import { LicenseConfig, LicenseLog, ActivationKey } from '../types/license';
import { AuthService } from '../services/auth';

const STORAGE_KEY = 'app_license_config_v1';
const LICENSE_BROADCAST_CHANNEL = 'lingua_license_sync_channel';

type LicenseListener = (config: LicenseConfig) => void;
const listeners = new Set<LicenseListener>();

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(LICENSE_BROADCAST_CHANNEL);
    broadcastChannel.onmessage = (event) => {
      if (event.data && typeof event.data === 'object' && event.data.deviceId) {
        listeners.forEach((l) => {
          try {
            l(event.data);
          } catch (e) {
            console.error('License listener error:', e);
          }
        });
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not supported or error:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        listeners.forEach((l) => l(parsed));
      } catch (err) {}
    }
  });
}

export function subscribeToLicense(callback: LicenseListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function generateRandomDeviceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DEV-${rand}`;
}

export function getDefaultLicenseConfig(): LicenseConfig {
  const now = Date.now();
  // By default, start with 5 minutes of active time so the user can immediately test
  const initialFiveMinutes = now + 5 * 60 * 1000;

  return {
    deviceId: generateRandomDeviceId(),
    expiresAt: initialFiveMinutes,
    isManuallyStopped: false,
    adminWhatsApp: '201120194940', // Egypt owner number 01120194940 in international format
    adminPin: '1234',
    customMessage: 'بالرجاء التواصل مع المسؤل علي الواتساب لفتح التطبيق مرة اخري',
    lastCheckedTime: now,
    logs: [
      {
        id: 'init-' + now,
        timestamp: now,
        action: 'ADD_5_MIN',
        title: 'صلاحية تجريبية أولية (5 دقائق)',
        details: 'تم بدء التطبيق بفترة تجريبية قدرها 5 دقائق لاختبار الحجب والمؤقت.',
      },
    ],
    keys: [
      {
        key: 'KEY-5MIN-FREE',
        durationMinutes: 5,
        label: 'كود تجريبي 5 دقائق',
        isUsed: false,
        createdAt: now,
      },
      {
        key: 'KEY-1DAY-PASS',
        durationMinutes: 24 * 60,
        label: 'كود صلاحية 1 يوم كامل',
        isUsed: false,
        createdAt: now,
      },
    ],
  };
}

export function loadLicenseConfig(): LicenseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultLicenseConfig();
      saveLicenseConfig(def);
      return def;
    }
    const parsed = JSON.parse(raw) as LicenseConfig;
    if (!parsed.deviceId) {
      parsed.deviceId = generateRandomDeviceId();
    }
    if (!parsed.adminWhatsApp) {
      parsed.adminWhatsApp = '201120194940';
    }
    if (!parsed.adminPin) {
      parsed.adminPin = '1234';
    }
    if (!parsed.customMessage) {
      parsed.customMessage = 'بالرجاء التواصل مع المسؤل علي الواتساب لفتح التطبيق مرة اخري';
    }
    if (!Array.isArray(parsed.logs)) {
      parsed.logs = [];
    }
    if (!Array.isArray(parsed.keys)) {
      parsed.keys = [];
    }
    return parsed;
  } catch {
    const def = getDefaultLicenseConfig();
    return def;
  }
}

export function saveLicenseConfig(config: LicenseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    
    // Sync with AuthService device lock
    if (config.isManuallyStopped || config.expiresAt <= Date.now()) {
      AuthService.lockDevice();
    } else {
      AuthService.unlockDevice();
    }

    // Notify local listeners
    listeners.forEach((l) => {
      try {
        l(config);
      } catch (e) {
        console.error('License listener callback error:', e);
      }
    });

    // Notify other tabs via BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(config);
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to save license config to localStorage:', err);
  }
}

export function addTimeMinutes(minutes: number, reasonTitle: string): LicenseConfig {
  const current = loadLicenseConfig();
  const now = Date.now();
  const baseTime = current.expiresAt > now && !current.isManuallyStopped ? current.expiresAt : now;
  const addedMs = minutes * 60 * 1000;
  const newExpiresAt = baseTime + addedMs;

  const newLog: LicenseLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
    action: minutes === 5 ? 'ADD_5_MIN' : minutes === 1440 ? 'ADD_1_DAY' : 'ADD_CUSTOM',
    title: reasonTitle,
    details: `تمت إضافة ${minutes >= 60 ? (minutes / 60).toFixed(1) + ' ساعة' : minutes + ' دقيقة'} للصلاحية.`,
  };

  const updated: LicenseConfig = {
    ...current,
    expiresAt: newExpiresAt,
    isManuallyStopped: false, // adding time reactivates the app
    lastCheckedTime: now,
    logs: [newLog, ...current.logs].slice(0, 50),
  };

  saveLicenseConfig(updated);
  return updated;
}

export function stopApplicationNow(reason = 'إيقاف فوري من قبل المسؤول'): LicenseConfig {
  const current = loadLicenseConfig();
  const now = Date.now();

  const newLog: LicenseLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: now,
    action: 'STOP_APP',
    title: 'إيقاف التطبيق وحجبه بالكامل',
    details: reason,
  };

  const updated: LicenseConfig = {
    ...current,
    isManuallyStopped: true,
    lastCheckedTime: now,
    logs: [newLog, ...current.logs].slice(0, 50),
  };

  saveLicenseConfig(updated);
  return updated;
}

export function resumeApplication(): LicenseConfig {
  const current = loadLicenseConfig();
  const now = Date.now();
  
  // If expired, give at least 5 minutes upon resume
  let newExpires = current.expiresAt;
  if (newExpires <= now) {
    newExpires = now + 5 * 60 * 1000;
  }

  const newLog: LicenseLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: now,
    action: 'RESUME_APP',
    title: 'استئناف تشغيل التطبيق',
    details: 'تم إلغاء الإيقاف اليدوي وإعادة تفعيل التطبيق.',
  };

  const updated: LicenseConfig = {
    ...current,
    isManuallyStopped: false,
    expiresAt: newExpires,
    lastCheckedTime: now,
    logs: [newLog, ...current.logs].slice(0, 50),
  };

  saveLicenseConfig(updated);
  return updated;
}

export function redeemActivationKey(keyStr: string): { success: boolean; message: string; config?: LicenseConfig } {
  const current = loadLicenseConfig();
  const cleanKey = keyStr.trim().toUpperCase();

  const foundIndex = current.keys.findIndex((k) => k.key.toUpperCase() === cleanKey);
  if (foundIndex === -1) {
    return { success: false, message: 'كود التفعيل غير صحيح، يرجى مراجعة المسؤول على واتساب.' };
  }

  const keyObj = current.keys[foundIndex];
  if (keyObj.isUsed) {
    return { success: false, message: 'تم استخدام كود التفعيل هذا مسبقاً.' };
  }

  // Key is valid! Apply time
  const now = Date.now();
  const baseTime = current.expiresAt > now && !current.isManuallyStopped ? current.expiresAt : now;
  const addedMs = keyObj.durationMinutes * 60 * 1000;
  const newExpiresAt = baseTime + addedMs;

  const updatedKeys = [...current.keys];
  updatedKeys[foundIndex] = {
    ...keyObj,
    isUsed: true,
    usedAt: now,
  };

  const newLog: LicenseLog = {
    id: 'log-' + Date.now(),
    timestamp: now,
    action: 'REDEEM_KEY',
    title: `تفعيل كود: ${keyObj.label}`,
    details: `تم استخدام الكود ${cleanKey} وإضافة ${keyObj.durationMinutes} دقيقة.`,
  };

  const updated: LicenseConfig = {
    ...current,
    expiresAt: newExpiresAt,
    isManuallyStopped: false,
    keys: updatedKeys,
    logs: [newLog, ...current.logs].slice(0, 50),
  };

  saveLicenseConfig(updated);
  return { success: true, message: `تم تفعيل الصلاحية بنجاح (${keyObj.label})`, config: updated };
}

export function createNewActivationKey(durationMinutes: number, label: string): { key: string; config: LicenseConfig } {
  const current = loadLicenseConfig();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const prefix = durationMinutes === 5 ? 'KEY-5MIN' : durationMinutes === 1440 ? 'KEY-1DAY' : 'KEY-EXP';
  const newKey = `${prefix}-${randNum}`;

  const newKeyObj: ActivationKey = {
    key: newKey,
    durationMinutes,
    label,
    isUsed: false,
    createdAt: Date.now(),
  };

  const updated: LicenseConfig = {
    ...current,
    keys: [newKeyObj, ...current.keys],
  };

  saveLicenseConfig(updated);
  return { key: newKey, config: updated };
}

export function formatTimeRemaining(msRemaining: number): {
  isExpired: boolean;
  formatted: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (msRemaining <= 0) {
    return {
      isExpired: true,
      formatted: '00:00:00 (منتهي الصلاحية)',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let formatted = '';
  if (days > 0) {
    formatted = `${days} يوم و ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return {
    isExpired: false,
    formatted,
    days,
    hours,
    minutes,
    seconds,
  };
}

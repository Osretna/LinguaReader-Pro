import { SystemState, UserProfile, AuditLogEntry, RealtimeEvent } from '../types';
import { INITIAL_SYSTEM_STATE } from '../data/initialState';

const STORAGE_KEY = 'realtime_admin_system_state_v1';
const CHANNEL_NAME = 'realtime_admin_sync_channel';

class RealtimeSyncManager {
  private state: SystemState;
  private listeners: Set<(state: SystemState, lastEvent?: RealtimeEvent) => void> = new Set();
  private channel: BroadcastChannel | null = null;
  private sseSource: EventSource | null = null;
  private isConnectedToServer: boolean = false;

  constructor() {
    this.state = this.loadState();
    this.setupBroadcastChannel();
    this.setupStorageListener();
    this.setupServerSSE();
  }

  private loadState(): SystemState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_SYSTEM_STATE;
  }

  private saveState(newState: SystemState) {
    this.state = newState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // ignore
    }
  }

  private setupBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.handleIncomingEvent(event.data as RealtimeEvent, false);
          }
        };
      } catch {
        // channel not supported
      }
    }
  }

  private setupStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.state = parsed;
            this.notifyListeners({ type: 'STATE_UPDATE', state: parsed, reason: 'مزامنة من نافذة أخرى' });
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private setupServerSSE() {
    if (typeof window === 'undefined') return;

    // Try connecting to Vite backend SSE
    try {
      this.sseSource = new EventSource('/api/realtime/events');
      this.sseSource.onopen = () => {
        this.isConnectedToServer = true;
      };
      this.sseSource.addEventListener('state_update', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.state) {
            this.handleIncomingEvent({ type: 'STATE_UPDATE', state: payload.state, reason: payload.reason }, false);
          }
        } catch {
          // ignore
        }
      });
      this.sseSource.onerror = () => {
        this.isConnectedToServer = false;
      };
    } catch {
      // SSE not available, fallback to BroadcastChannel
    }
  }

  private handleIncomingEvent(event: RealtimeEvent, shouldBroadcast: boolean = true) {
    if (event.type === 'STATE_UPDATE' || event.type === 'STATE_INIT') {
      this.saveState(event.state);
      this.notifyListeners(event);
    } else if (event.type === 'APP_LOCK_CHANGED') {
      const updatedState: SystemState = {
        ...this.state,
        isAppLocked: event.isLocked,
        lockReason: event.reason,
        auditLogs: [
          {
            id: 'log_' + Date.now(),
            timestamp: Date.now(),
            action: event.isLocked ? 'إغلاق التطبيق كلياً بواسطة الإدارة' : 'إلغاء قفل التطبيق واستئناف الخدمة',
            targetUser: 'كافة المستخدمين',
            badgeColor: event.isLocked ? 'rose' : 'emerald',
          },
          ...this.state.auditLogs.slice(0, 49),
        ],
      };
      this.saveState(updatedState);
      this.notifyListeners(event);
    } else if (event.type === 'USER_UPDATED') {
      const updatedUsers = this.state.users.map((u) => (u.id === event.user.id ? event.user : u));
      const updatedState: SystemState = {
        ...this.state,
        users: updatedUsers,
        auditLogs: [
          {
            id: 'log_' + Date.now(),
            timestamp: Date.now(),
            action: event.reason,
            targetUser: event.user.name,
            badgeColor: event.user.status === 'banned' ? 'rose' : 'emerald',
          },
          ...this.state.auditLogs.slice(0, 49),
        ],
      };
      this.saveState(updatedState);
      this.notifyListeners(event);
    } else if (event.type === 'BROADCAST_NOTICE') {
      const updatedState: SystemState = {
        ...this.state,
        broadcastNotice: event.notice,
      };
      this.saveState(updatedState);
      this.notifyListeners(event);
    }

    if (shouldBroadcast) {
      this.broadcastToPeers(event);
      this.sendToServer(event);
    }
  }

  private broadcastToPeers(event: RealtimeEvent) {
    try {
      if (this.channel) {
        this.channel.postMessage(event);
      }
    } catch {
      // ignore
    }
  }

  private async sendToServer(event: RealtimeEvent) {
    try {
      await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {
        // Server might be static or offline; local real-time sync is already active
      });
    } catch {
      // silent
    }
  }

  private notifyListeners(event?: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state, event);
      } catch {
        // ignore
      }
    });
  }

  public subscribe(listener: (state: SystemState, lastEvent?: RealtimeEvent) => void): () => void {
    this.listeners.add(listener);
    // Trigger initial state
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SystemState {
    return this.state;
  }

  public isServerConnected(): boolean {
    return this.isConnectedToServer;
  }

  // --- ACTIONS ---

  public toggleAppLock(isLocked: boolean, reason?: string) {
    const lockReason = reason || (isLocked ? 'تم إغلاق التطبيق بواسطة الإدارة' : '');
    this.handleIncomingEvent({
      type: 'APP_LOCK_CHANGED',
      isLocked,
      reason: lockReason,
    });
  }

  public activateSubscription(
    userId: string,
    plan: 'monthly' | 'lifetime' | 'custom' | 'trial_5m',
    durationDays: number,
    planLabel: string,
    customExpiryMs?: number,
  ) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    let newExpiresAt: number;
    if (customExpiryMs) {
      newExpiresAt = customExpiryMs;
    } else if (plan === 'lifetime') {
      newExpiresAt = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000; // 100 years
    } else if (plan === 'trial_5m') {
      newExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    } else {
      newExpiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    }

    const updatedUser: UserProfile = {
      ...user,
      status: plan === 'trial_5m' ? 'trial' : 'active',
      plan,
      planLabel,
      expiresAt: newExpiresAt,
      isBanned: false,
      lastAction: `تم تفعيل: ${planLabel}`,
      lastActionTime: Date.now(),
    };

    this.handleIncomingEvent({
      type: 'USER_UPDATED',
      user: updatedUser,
      reason: `تفعيل اشتراك (${planLabel}) للمستخدم ${user.name}`,
    });
  }

  public extendTrialMinutes(userId: string, minutes: number = 5) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    // If already expired or now, start from now + minutes
    const baseTime = user.expiresAt > Date.now() ? user.expiresAt : Date.now();
    const newExpiresAt = baseTime + minutes * 60 * 1000;

    const updatedUser: UserProfile = {
      ...user,
      status: 'trial',
      plan: 'trial_5m',
      planLabel: `فترة تجريبية (${minutes} دقائق)`,
      expiresAt: newExpiresAt,
      isBanned: false,
      lastAction: `تم تفعيل فترة تجريبية جديدة (${minutes} دقائق)`,
      lastActionTime: Date.now(),
    };

    this.handleIncomingEvent({
      type: 'USER_UPDATED',
      user: updatedUser,
      reason: `تجديد فترة تجريبية +${minutes} دقائق للمستخدم ${user.name}`,
    });
  }

  public expireUserImmediately(userId: string) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser: UserProfile = {
      ...user,
      status: 'expired',
      expiresAt: Date.now() - 1000,
      lastAction: 'انتهت فترة الصلاحية',
      lastActionTime: Date.now(),
    };

    this.handleIncomingEvent({
      type: 'USER_UPDATED',
      user: updatedUser,
      reason: `انتهاء فترة الصلاحية للمستخدم ${user.name}`,
    });
  }

  public toggleBan(userId: string) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    const willBeBanned = !user.isBanned;
    const updatedUser: UserProfile = {
      ...user,
      isBanned: willBeBanned,
      status: willBeBanned ? 'banned' : user.expiresAt > Date.now() ? (user.plan === 'trial_5m' ? 'trial' : 'active') : 'expired',
      lastAction: willBeBanned ? 'تم حظر وإيقاف الحساب' : 'تم رفع الحظر وتنشيط الحساب',
      lastActionTime: Date.now(),
    };

    this.handleIncomingEvent({
      type: 'USER_UPDATED',
      user: updatedUser,
      reason: willBeBanned ? `حظر المستخدم ${user.name}` : `إلغاء حظر المستخدم ${user.name}`,
    });
  }

  public updateUserPermissions(userId: string, permissions: Partial<UserProfile['permissions']>) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser: UserProfile = {
      ...user,
      permissions: {
        ...user.permissions,
        ...permissions,
      },
      lastAction: 'تم تعديل الصلاحيات',
      lastActionTime: Date.now(),
    };

    this.handleIncomingEvent({
      type: 'USER_UPDATED',
      user: updatedUser,
      reason: `تحديث صلاحيات المستخدم ${user.name}`,
    });
  }

  public setBroadcastNotice(notice: string | null) {
    this.handleIncomingEvent({
      type: 'BROADCAST_NOTICE',
      notice,
    });
  }

  public resetToDefault() {
    this.saveState(INITIAL_SYSTEM_STATE);
    const event: RealtimeEvent = {
      type: 'STATE_INIT',
      state: INITIAL_SYSTEM_STATE,
    };
    this.handleIncomingEvent(event);
  }
}

export const realtimeSync = new RealtimeSyncManager();

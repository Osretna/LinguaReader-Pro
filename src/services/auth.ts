import { AuthUser, UserSubscription, LicenseKey, SubscriptionPlan } from '../types';
import { FirebaseService } from './firebase';

const AUTH_STORAGE_KEY = 'lingua_auth_current_user';
const ALL_USERS_STORAGE_KEY = 'lingua_all_registered_users';
const LICENSES_STORAGE_KEY = 'lingua_license_keys';

// The owner's phone and credentials
export const OWNER_EMAIL = 's.mohamed1111111@gmail.com';
export const OWNER_PHONE = '01120194940';
export const OWNER_WHATSAPP_LINK = 'https://wa.me/201120194940';
export const MONTHLY_PRICE_EGP = 100;
export const TRIAL_DURATION_SECONDS = 300; // 5 minutes

// Secret admin master password specified by user
export const ADMIN_MASTER_PASSWORD = '4704600vdlhs@';

// Storage keys for persistent device lock across refreshes and restarts
export const DEVICE_LOCK_KEY = 'lingua_device_trial_locked';
export const DEVICE_TRIAL_ENDS_KEY = 'lingua_device_trial_ends_at';
export const DEVICE_UNLOCKED_KEY = 'lingua_device_unlocked_permanent';
export const ADMIN_SESSION_AUTH_KEY = 'lingua_admin_session_auth';

export class AuthService {
  // Device Lock State across refreshes and restarts
  public static isDeviceLocked(): boolean {
    try {
      if (localStorage.getItem(DEVICE_UNLOCKED_KEY) === 'true') {
        return false;
      }
      if (localStorage.getItem(DEVICE_LOCK_KEY) === 'true') {
        return true;
      }
      const remaining = this.getDeviceRemainingTrialSeconds();
      if (remaining <= 0) {
        this.lockDevice();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public static lockDevice(): void {
    try {
      localStorage.setItem(DEVICE_LOCK_KEY, 'true');
    } catch (e) {
      console.error('Failed to lock device:', e);
    }
  }

  public static unlockDevice(): void {
    try {
      localStorage.removeItem(DEVICE_LOCK_KEY);
      localStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
      localStorage.removeItem(DEVICE_TRIAL_ENDS_KEY);
    } catch (e) {
      console.error('Failed to unlock device:', e);
    }
  }

  public static isDeviceUnlocked(): boolean {
    try {
      return localStorage.getItem(DEVICE_UNLOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public static getDeviceRemainingTrialSeconds(): number {
    try {
      if (this.isDeviceUnlocked()) return TRIAL_DURATION_SECONDS;
      if (localStorage.getItem(DEVICE_LOCK_KEY) === 'true') return 0;

      let endsAtStr = localStorage.getItem(DEVICE_TRIAL_ENDS_KEY);
      if (!endsAtStr) {
        const endsAt = Date.now() + TRIAL_DURATION_SECONDS * 1000;
        localStorage.setItem(DEVICE_TRIAL_ENDS_KEY, endsAt.toString());
        return TRIAL_DURATION_SECONDS;
      }

      const endsAt = parseInt(endsAtStr, 10);
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining <= 0) {
        this.lockDevice();
        return 0;
      }
      return remaining;
    } catch {
      return TRIAL_DURATION_SECONDS;
    }
  }

  public static tickDeviceTrial(): number {
    return this.getDeviceRemainingTrialSeconds();
  }

  // Admin Password Verification
  public static verifyAdminPassword(password: string): boolean {
    return password.trim() === ADMIN_MASTER_PASSWORD;
  }

  public static isAdminSessionAuthenticated(): boolean {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public static setAdminSessionAuthenticated(): void {
    try {
      sessionStorage.setItem(ADMIN_SESSION_AUTH_KEY, 'true');
    } catch (e) {
      console.error('Failed to set admin session:', e);
    }
  }

  // Sign in using Admin Master Password (does not expose email in UI)
  public static signInWithAdminPassword(password: string): { success: boolean; message: string; user?: AuthUser } {
    if (!this.verifyAdminPassword(password)) {
      return { success: false, message: 'كلمة المرور غير صحيحة! الوصول مقيد لمصمم التطبيق فقط.' };
    }

    this.unlockDevice();
    this.setAdminSessionAuthenticated();

    const adminUser = this.signInWithGoogle({
      email: OWNER_EMAIL,
      name: 'مدير ومصمم التطبيق',
    });
    
    // Explicitly guarantee lifetime access & admin role
    adminUser.role = 'admin';
    adminUser.subscription = {
      ...adminUser.subscription,
      status: 'lifetime',
      plan: 'lifetime',
      planNameAr: 'حساب المدير والمصمم (وصول دائم)',
      planNameEn: 'Owner & Admin (Lifetime)',
      expiresAt: null,
      isExpired: false,
    };
    
    this.saveUser(adminUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
    } catch (e) {
      console.error('Failed to set admin session:', e);
    }

    return { success: true, message: 'تم فتح التطبيق وتسجيل الدخول بنجاح!', user: adminUser };
  }

  // Normalize any user object to ensure full type safety and prevent runtime rendering crashes
  public static normalizeUser(raw: any): AuthUser {
    const now = new Date();
    if (!raw || typeof raw !== 'object') {
      return {
        id: `usr_${Date.now()}`,
        email: 'user@lingua.app',
        name: 'مستخدم',
        createdAt: now.toISOString(),
        lastLoginAt: now.toISOString(),
        role: 'user',
        subscription: {
          status: 'trial',
          plan: 'trial',
          planNameAr: 'تجربة مجانية (5 دقائق)',
          planNameEn: 'Free Trial (5 minutes)',
          startedAt: now.toISOString(),
          expiresAt: null,
          trialSecondsTotal: TRIAL_DURATION_SECONDS,
          trialSecondsRemaining: TRIAL_DURATION_SECONDS,
          trialEndsAt: new Date(now.getTime() + TRIAL_DURATION_SECONDS * 1000).toISOString(),
          isExpired: false,
        },
      };
    }

    const email = (raw.email || '').trim();
    const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase() || raw.role === 'admin';

    const subRaw = raw.subscription && typeof raw.subscription === 'object' ? raw.subscription : {};

    const subscription: UserSubscription = isOwner
      ? {
          status: 'lifetime',
          plan: 'lifetime',
          planNameAr: 'حساب المدير والمصمم (وصول دائم)',
          planNameEn: 'Owner & Admin (Lifetime)',
          startedAt: subRaw.startedAt || raw.createdAt || now.toISOString(),
          expiresAt: null,
          trialSecondsTotal: TRIAL_DURATION_SECONDS,
          trialSecondsRemaining: TRIAL_DURATION_SECONDS,
          trialEndsAt: null,
          isExpired: false,
          notes: subRaw.notes || 'مدير ومصمم التطبيق',
        }
      : {
          status: subRaw.status || (subRaw.isExpired ? 'expired' : 'trial'),
          plan: subRaw.plan || (subRaw.status === 'active' ? 'monthly' : subRaw.status === 'lifetime' ? 'lifetime' : 'trial'),
          planNameAr: subRaw.planNameAr || (subRaw.status === 'lifetime' ? 'وصول دائم' : subRaw.status === 'active' ? 'اشتراك شهري' : 'تجربة مجانية (5 دقائق)'),
          planNameEn: subRaw.planNameEn || (subRaw.status === 'lifetime' ? 'Lifetime' : subRaw.status === 'active' ? 'Monthly' : 'Trial (5m)'),
          startedAt: subRaw.startedAt || raw.createdAt || now.toISOString(),
          expiresAt: subRaw.expiresAt || null,
          trialSecondsTotal: typeof subRaw.trialSecondsTotal === 'number' ? subRaw.trialSecondsTotal : TRIAL_DURATION_SECONDS,
          trialSecondsRemaining: typeof subRaw.trialSecondsRemaining === 'number' ? Math.max(0, subRaw.trialSecondsRemaining) : 0,
          trialEndsAt: subRaw.trialEndsAt || null,
          isExpired: Boolean(subRaw.isExpired || subRaw.status === 'expired'),
          notes: subRaw.notes,
        };

    const cleanName = raw.name && typeof raw.name === 'string' && raw.name.trim().length > 0
      ? raw.name.trim()
      : (email ? email.split('@')[0] : 'مشترك');

    return {
      ...raw,
      id: raw.id || (email ? `usr_${email}` : `usr_${Date.now()}`),
      email: email,
      name: isOwner ? 'مدير ومصمم التطبيق' : cleanName,
      role: isOwner ? 'admin' : (raw.role || 'user'),
      avatarUrl: raw.avatarUrl,
      createdAt: raw.createdAt || now.toISOString(),
      lastLoginAt: raw.lastLoginAt || now.toISOString(),
      subscription,
    };
  }

  // Get currently logged-in user
  public static getCurrentUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!data) return null;
      const rawUser = JSON.parse(data);
      const user = this.normalizeUser(rawUser);
      return this.validateUserExpiry(user);
    } catch (e) {
      console.error('Failed to parse current user from localStorage:', e);
      return null;
    }
  }

  // Validate if trial or subscription has expired
  public static validateUserExpiry(rawUser: AuthUser): AuthUser {
    const user = this.normalizeUser(rawUser);

    // Owner never expires
    if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || user.role === 'admin') {
      return user;
    }

    const sub = user.subscription;

    // Lifetime access never expires
    if (sub.status === 'lifetime') {
      return user;
    }

    // Active paid subscription with an expiration date
    if (sub.status === 'active' && sub.expiresAt) {
      const now = new Date().getTime();
      const exp = new Date(sub.expiresAt).getTime();
      if (!isNaN(exp) && now > exp) {
        sub.status = 'expired';
        sub.isExpired = true;
        sub.notes = 'انتهت فترة الاشتراك الشهري';
        this.lockDevice();
        this.saveUser(user, true);
      }
      return user;
    }

    // Trial validation (using accurate timestamp)
    if (sub.status === 'trial') {
      if (!sub.trialEndsAt) {
        const sec = sub.trialSecondsRemaining > 0 ? sub.trialSecondsRemaining : TRIAL_DURATION_SECONDS;
        sub.trialEndsAt = new Date(Date.now() + sec * 1000).toISOString();
      }
      const ends = new Date(sub.trialEndsAt).getTime();
      const diffSec = !isNaN(ends) ? Math.max(0, Math.ceil((ends - Date.now()) / 1000)) : 0;
      sub.trialSecondsRemaining = diffSec;
      if (diffSec <= 0) {
        sub.status = 'expired';
        sub.isExpired = true;
        sub.trialSecondsRemaining = 0;
        this.lockDevice();
        this.saveUser(user, true);
      }
    }

    if (sub.status === 'expired' || sub.isExpired) {
      this.lockDevice();
    }

    return user;
  }

  // Save/Update user in storage (with optional Cloud Firestore sync)
  public static saveUser(user: AuthUser, syncToCloud: boolean = true): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      
      // Also update in all users directory
      const allUsers = this.getAllUsers();
      const index = allUsers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (index >= 0) {
        allUsers[index] = user;
      } else {
        allUsers.push(user);
      }
      localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allUsers));
      // Asynchronously sync to Cloud Firestore when requested (not on high-frequency local ticks)
      if (syncToCloud) {
        FirebaseService.syncUserToCloud(user).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save user:', e);
    }
  }

  // Accurate countdown tick
  public static tickTrial(user: AuthUser): AuthUser {
    if (user.role === 'admin' || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      return user;
    }

    if (user.subscription.status !== 'trial') {
      return user;
    }

    if (!user.subscription.trialEndsAt) {
      const sec = user.subscription.trialSecondsRemaining > 0 ? user.subscription.trialSecondsRemaining : TRIAL_DURATION_SECONDS;
      user.subscription.trialEndsAt = new Date(Date.now() + sec * 1000).toISOString();
    }

    const ends = new Date(user.subscription.trialEndsAt).getTime();
    const diffSec = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
    
    user.subscription.trialSecondsRemaining = diffSec;

    if (diffSec <= 0) {
      user.subscription.trialSecondsRemaining = 0;
      user.subscription.status = 'expired';
      user.subscription.isExpired = true;
      this.lockDevice();
      this.saveUser(user, true); // Sync expiration to cloud
    } else {
      this.saveUser(user, false); // Local-only persist to avoid cloud feedback loop
    }

    return user;
  }

  // Sign in with Google (either from Google JWT token or Google profile)
  public static signInWithGoogle(profile: {
    email: string;
    name: string;
    picture?: string;
    googleId?: string;
  }): AuthUser {
    const isOwner = profile.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
    const existingUsers = this.getAllUsers();
    const existing = existingUsers.find(u => u.email.toLowerCase() === profile.email.toLowerCase());

    let user: AuthUser;

    if (existing) {
      user = {
        ...existing,
        name: profile.name || existing.name,
        avatarUrl: profile.picture || existing.avatarUrl,
        lastLoginAt: new Date().toISOString(),
        role: isOwner ? 'admin' : existing.role,
      };

      if (isOwner && user.subscription.status !== 'lifetime') {
        user.subscription.status = 'lifetime';
        user.subscription.plan = 'lifetime';
        user.subscription.isExpired = false;
        user.subscription.trialEndsAt = null;
      } else if (!isOwner && user.subscription.status === 'trial') {
        // If user is currently in trial, make sure trialEndsAt is computed accurately
        if (!user.subscription.trialEndsAt) {
          const sec = user.subscription.trialSecondsRemaining > 0 ? user.subscription.trialSecondsRemaining : TRIAL_DURATION_SECONDS;
          user.subscription.trialEndsAt = new Date(Date.now() + sec * 1000).toISOString();
        }
        const ends = new Date(user.subscription.trialEndsAt).getTime();
        const diffSec = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
        user.subscription.trialSecondsRemaining = diffSec;
        if (diffSec <= 0) {
          user.subscription.status = 'expired';
          user.subscription.isExpired = true;
          this.lockDevice();
        }
      }
    } else {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_SECONDS * 1000).toISOString();
      const initialSub: UserSubscription = isOwner ? {
        status: 'lifetime',
        plan: 'lifetime',
        planNameAr: 'حساب المدير والمصمم (وصول دائم)',
        planNameEn: 'Owner & Admin (Lifetime)',
        startedAt: now.toISOString(),
        expiresAt: null,
        trialSecondsTotal: TRIAL_DURATION_SECONDS,
        trialSecondsRemaining: TRIAL_DURATION_SECONDS,
        trialEndsAt: null,
        isExpired: false,
      } : {
        status: 'trial',
        plan: 'trial',
        planNameAr: 'تجربة مجانية (5 دقائق)',
        planNameEn: 'Free Trial (5 minutes)',
        startedAt: now.toISOString(),
        expiresAt: null,
        trialSecondsTotal: TRIAL_DURATION_SECONDS,
        trialSecondsRemaining: TRIAL_DURATION_SECONDS,
        trialEndsAt: trialEndsAt,
        isExpired: false,
      };

      user = {
        id: profile.googleId || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.email)}`,
        role: isOwner ? 'admin' : 'user',
        createdAt: now.toISOString(),
        lastLoginAt: now.toISOString(),
        subscription: initialSub,
      };
    }

    this.saveUser(user, true);
    // Persist current session so user state is never lost
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to set current user session:', e);
    }
    return user;
  }

  // Logout
  public static signOut(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  // Get all registered users (for admin panel)
  public static getAllUsers(): AuthUser[] {
    try {
      const data = localStorage.getItem(ALL_USERS_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(u => this.normalizeUser(u)).filter(Boolean);
    } catch (e) {
      console.error('Failed to get all users:', e);
      return [];
    }
  }

  // Admin action: Grant custom permission (duration in days, or 'lifetime')
  public static grantUserPermission(
    targetUserOrId: AuthUser | string, 
    permission: 'lifetime' | number, // number of days, e.g. 30 for 1 month
    adminName: string = 'المصمم'
  ): { success: boolean; message: string; user?: AuthUser } {
    const allUsers = this.getAllUsers();
    let target: AuthUser | undefined;

    if (typeof targetUserOrId === 'object' && targetUserOrId !== null) {
      target = targetUserOrId;
    } else {
      target = allUsers.find(
        u => u.id === targetUserOrId || u.email.toLowerCase() === (targetUserOrId as string).toLowerCase()
      );
    }

    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    const now = new Date();
    if (permission === 'lifetime') {
      target.subscription = {
        ...target.subscription,
        status: 'lifetime',
        plan: 'lifetime',
        planNameAr: 'وصول دائم ومفتوح (مدى الحياة)',
        planNameEn: 'Lifetime Unlimited Access',
        expiresAt: null,
        trialEndsAt: null,
        trialSecondsRemaining: TRIAL_DURATION_SECONDS,
        isExpired: false,
        notes: `تم منح وصول دائم بواسطة ${adminName} في ${now.toLocaleDateString('ar-EG')}`,
      };
    } else {
      const expDate = new Date(now.getTime() + permission * 24 * 60 * 60 * 1000);
      target.subscription = {
        ...target.subscription,
        status: 'active',
        plan: permission === 30 ? 'monthly' : 'custom',
        planNameAr: permission === 30 ? 'اشتراك شهري (100 جنيه)' : `فترة مخصصة (${permission} يوم)`,
        planNameEn: permission === 30 ? 'Monthly Subscription (100 EGP)' : `Custom Period (${permission} days)`,
        expiresAt: expDate.toISOString(),
        trialEndsAt: null,
        isExpired: false,
        notes: `تم التفعيل لمدة ${permission} يوم بواسطة ${adminName}`,
      };
    }

    this.saveUser(target, true);
    
    // Refresh active session if the target matches current user
    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.id === target.id || currentUser.email.toLowerCase() === target.email.toLowerCase())) {
      this.unlockDevice();
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
      } catch (e) {
        console.error('Failed to update active user session:', e);
      }
    }

    return { success: true, message: permission === 'lifetime' ? 'تم تفعيل الوصول الدائم مدى الحياة بنجاح' : `تم تفعيل الاشتراك لمدة ${permission} يوماً (100 ج.م) بنجاح`, user: target };
  }

  // Admin action: Reset trial (give another 5 minutes)
  public static resetUserTrial(targetUserOrId: AuthUser | string): boolean {
    const allUsers = this.getAllUsers();
    let target: AuthUser | undefined;

    if (typeof targetUserOrId === 'object' && targetUserOrId !== null) {
      target = targetUserOrId;
    } else {
      target = allUsers.find(
        u => u.id === targetUserOrId || u.email.toLowerCase() === (targetUserOrId as string).toLowerCase()
      );
    }

    if (!target) return false;

    const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_SECONDS * 1000).toISOString();
    target.subscription = {
      ...target.subscription,
      status: 'trial',
      plan: 'trial',
      planNameAr: 'تجربة مجانية (5 دقائق)',
      planNameEn: 'Free Trial (5 minutes)',
      trialSecondsTotal: TRIAL_DURATION_SECONDS,
      trialSecondsRemaining: TRIAL_DURATION_SECONDS,
      trialEndsAt: trialEndsAt,
      isExpired: false,
      notes: 'تم تجديد 5 دقائق تجربة مجانية بواسطة المدير',
    };

    this.saveUser(target, true);

    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.id === target.id || currentUser.email.toLowerCase() === target.email.toLowerCase())) {
      this.unlockDevice();
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
      } catch (e) {
        console.error('Failed to update active user session:', e);
      }
    }
    return true;
  }

  // Admin action: Revoke access / Expire user
  public static revokeUserAccess(targetUserOrId: AuthUser | string): boolean {
    const allUsers = this.getAllUsers();
    let target: AuthUser | undefined;

    if (typeof targetUserOrId === 'object' && targetUserOrId !== null) {
      target = targetUserOrId;
    } else {
      target = allUsers.find(
        u => u.id === targetUserOrId || u.email.toLowerCase() === (targetUserOrId as string).toLowerCase()
      );
    }

    if (!target) return false;

    target.subscription = {
      ...target.subscription,
      status: 'expired',
      isExpired: true,
      trialSecondsRemaining: 0,
      trialEndsAt: new Date().toISOString(),
      notes: 'تم إيقاف الصلاحية وقفل التطبيق بواسطة المدير',
    };

    this.saveUser(target, true);

    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.id === target.id || currentUser.email.toLowerCase() === target.email.toLowerCase())) {
      this.lockDevice();
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
      } catch (e) {
        console.error('Failed to update active user session:', e);
      }
    }
    return true;
  }

  // Activate via Activation Code
  public static activateWithCode(user: AuthUser, code: string): { success: boolean; message: string } {
    const rawCode = code.trim();
    const cleanCode = rawCode.toUpperCase();

    // Admin Master Password directly in activation box (4704600vdlhs@)
    if (rawCode === ADMIN_MASTER_PASSWORD) {
      this.unlockDevice();
      this.setAdminSessionAuthenticated();
      this.grantUserPermission(user.id, 'lifetime', 'كلمة سر المدير');
      return { success: true, message: 'تم فتح التطبيق بكلمة سر المدير وتفعيل الوصول الدائم بنجاح!' };
    }

    // Master Backdoor / Admin bypass codes
    if (cleanCode === '01120194940' || cleanCode === 'VIP2026' || cleanCode === 'ADMIN_PASS') {
      this.unlockDevice();
      this.grantUserPermission(user.id, 'lifetime', 'كود الماستر');
      return { success: true, message: 'تهانينا! تم تفعيل الوصول الدائم (مدى الحياة) بنجاح!' };
    }

    // Check License Keys database
    const licenses = this.getAllLicenseKeys();
    const license = licenses.find(l => l.code === cleanCode);

    if (!license) {
      // Also allow dynamic patterned codes:
      // MONTH-XXXX -> 30 days
      // LIFE-XXXX  -> Lifetime
      if (cleanCode.startsWith('READ-1M-') || cleanCode.startsWith('SUB-100-')) {
        this.unlockDevice();
        this.grantUserPermission(user.id, 30, 'كود اشتراك شهري');
        return { success: true, message: 'تم تفعيل الاشتراك الشهري (30 يوماً) بنجاح!' };
      }
      if (cleanCode.startsWith('READ-LIFE-') || cleanCode.startsWith('PRO-PERM-')) {
        this.unlockDevice();
        this.grantUserPermission(user.id, 'lifetime', 'كود وصول دائم');
        return { success: true, message: 'تم تفعيل الوصول غير المحدود مدى الحياة بنجاح!' };
      }

      return { success: false, message: 'كود التفعيل غير صحيح أو منتهي الصلاحية. يرجى مراجعة المصمم على الواتساب.' };
    }

    if (license.isUsed) {
      return { success: false, message: 'تم استخدام هذا الكود من قبل لحساب آخر.' };
    }

    // Redeem license
    license.isUsed = true;
    license.usedByEmail = user.email;
    license.usedAt = new Date().toISOString();
    this.saveLicenseKeys(licenses);
    this.unlockDevice();

    if (license.plan === 'lifetime') {
      this.grantUserPermission(user.id, 'lifetime', `كود ${cleanCode}`);
      return { success: true, message: 'تهانينا! تم تفعيل الوصول الدائم (مدى الحياة) بنجاح!' };
    } else {
      const days = license.durationDays || 30;
      this.grantUserPermission(user.id, days, `كود ${cleanCode}`);
      return { success: true, message: `تم تفعيل اشتراكك بنجاح لمدة ${days} يوماً!` };
    }
  }

  // License Keys management
  public static getAllLicenseKeys(): LicenseKey[] {
    try {
      const data = localStorage.getItem(LICENSES_STORAGE_KEY);
      if (!data) return this.generateInitialLicenseKeys();
      return JSON.parse(data);
    } catch {
      return this.generateInitialLicenseKeys();
    }
  }

  public static saveLicenseKeys(keys: LicenseKey[]): void {
    localStorage.setItem(LICENSES_STORAGE_KEY, JSON.stringify(keys));
  }

  public static generateNewLicenseKey(plan: SubscriptionPlan, durationDays = 30): LicenseKey {
    const prefix = plan === 'lifetime' ? 'READ-LIFE' : `READ-${durationDays}D`;
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefix}-${randomPart}`;

    const newKey: LicenseKey = {
      code,
      plan,
      durationDays: plan === 'lifetime' ? undefined : durationDays,
      isUsed: false,
      createdAt: new Date().toISOString(),
      createdBy: 'مدير التطبيق (01120194940)',
    };

    const keys = this.getAllLicenseKeys();
    keys.unshift(newKey);
    this.saveLicenseKeys(keys);
    // Asynchronously save to Firebase Cloud
    FirebaseService.saveLicenseToCloud(newKey).catch(() => {});
    return newKey;
  }

  private static generateInitialLicenseKeys(): LicenseKey[] {
    const initial: LicenseKey[] = [
      {
        code: 'READ-1M-DEMO-100',
        plan: 'monthly',
        durationDays: 30,
        isUsed: false,
        createdAt: new Date().toISOString(),
        createdBy: 'النظام',
      },
      {
        code: 'READ-LIFE-PREMIUM',
        plan: 'lifetime',
        isUsed: false,
        createdAt: new Date().toISOString(),
        createdBy: 'النظام',
      }
    ];
    localStorage.setItem(LICENSES_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  // WhatsApp Message Generator
  public static getWhatsAppMessage(user?: AuthUser | null): string {
    const email = user?.email || 'لم يتم تسجيل البريد بعد';
    const id = user?.id || 'غير معروف';
    const text = `السلام عليكم يا باشمهندس محمد،
أود تفعيل اشتراكي في تطبيق LinguaReader Pro لتعلم اللغات (الاشتراك الشهري 100 جنيه).

بيانات حسابي لتفعيل الصلاحية:
- البريد الإلكتروني المسجل: ${email}
- معرف الحساب: ${id}

يرجى إرسال كود التفعيل أو تفعيل الحساب. شكراً جزيلاً!`;
    return text;
  }

  public static getWhatsAppUrl(user?: AuthUser | null): string {
    const text = encodeURIComponent(this.getWhatsAppMessage(user));
    return `https://wa.me/201120194940?text=${text}`;
  }
}

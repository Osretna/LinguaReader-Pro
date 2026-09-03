import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  Database 
} from 'firebase/database';
import { AuthUser, LicenseKey, UserSubscription } from '../types';

// =========================================================================
// 🔥 إعدادات الربط بـ Firebase (قاعدة البيانات السحابية والمصادقة المركزية)
// =========================================================================
// 📍 مكان هذا الملف: /src/services/firebase.ts
// 📍 تم ضبط الإعدادات بالقيم الحقيقية الخاصة بمشروعك (linguareader-pro)
// =========================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCcr6w3KfbTKWyIyflDh-rKyiNuID9DG2E",
  authDomain: "linguareader-pro.firebaseapp.com",
  databaseURL: "https://linguareader-pro-default-rtdb.firebaseio.com",
  projectId: "linguareader-pro",
  storageBucket: "linguareader-pro.firebasestorage.app",
  messagingSenderId: "118006367459",
  appId: "1:118006367459:web:6032a7e156fbed284cb1d6",
  measurementId: "G-724YXFFXS4"
};

// Check if Firebase credentials are real
export function isFirebaseConfigured(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('YOUR_') &&
    Boolean(firebaseConfig.projectId) &&
    !firebaseConfig.projectId.includes('YOUR_')
  );
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export class FirebaseService {
  private static isFirestoreExhausted = false;
  private static lastSyncTimestamp: Record<string, number> = {};

  /**
   * Safe key for Firebase Realtime Database paths (disallows '.', '#', '$', '/', '[', ']')
   */
  public static toSafeKey(key: string): string {
    if (!key) return `usr_${Date.now()}`;
    return key.trim().replace(/[.#$[\]/]/g, '_');
  }

  /**
   * Check connection status
   */
  public static isConnected(): boolean {
    return isFirebaseConfigured() && (db !== null || rtdb !== null);
  }

  // =======================================================================
  // 🔐 1. Real Firebase Authentication (Google & Email)
  // =======================================================================

  /**
   * Real Google Sign-in with Firebase Auth (Popup with fallback)
   */
  public static async signInWithGoogleReal(): Promise<FirebaseUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      console.warn("Popup sign-in notice, attempting redirect fallback:", error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error("Redirect sign-in error:", redirectErr);
          throw redirectErr;
        }
      }
      throw error;
    }
  }

  /**
   * Real Email / Password Sign In
   */
  public static async signInWithEmailReal(email: string, pass: string): Promise<FirebaseUser> {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  }

  /**
   * Real Email / Password Registration
   */
  public static async registerWithEmailReal(email: string, pass: string): Promise<FirebaseUser> {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  }

  /**
   * Real Sign Out from Firebase
   */
  public static async signOutReal(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out notice:", e);
    }
  }

  /**
   * Listen to Firebase Auth state change
   */
  public static onAuthChanged(callback: (user: FirebaseUser | null) => void): (() => void) {
    return onAuthStateChanged(auth, callback);
  }

  // =======================================================================
  // ☁️ 2. Cloud Firestore & Realtime Database User Synchronization
  // =======================================================================

  /**
   * Save or sync any logged-in user to Cloud Firestore and RTDB in real time.
   * Resilient against quota exhaustion with debouncing and dual-database sync.
   */
  public static async syncUserToCloud(user: AuthUser): Promise<boolean> {
    if (!this.isConnected() || !user) return false;

    // Debounce rapid syncs for the same user within 2 seconds
    const now = Date.now();
    const lastSync = this.lastSyncTimestamp[user.id] || 0;
    if (now - lastSync < 2000 && user.subscription.status === 'trial') {
      return true;
    }
    this.lastSyncTimestamp[user.id] = now;

    const payload: AuthUser = {
      ...user,
      cloudSyncedAt: new Date().toISOString(),
    };

    const safeId = this.toSafeKey(user.id);
    const safeEmail = user.email ? this.toSafeKey(user.email.toLowerCase()) : null;

    let rtdbSuccess = false;

    // 1. Primary: Sync to Realtime Database (Instant, high quota, sub-100ms WebSocket push)
    try {
      const rtdbUserRef = ref(rtdb, `users/${safeId}`);
      await set(rtdbUserRef, payload);

      // Also maintain index by email for instant multi-device resolution
      if (safeEmail) {
        const rtdbEmailRef = ref(rtdb, `usersByEmail/${safeEmail}`);
        await set(rtdbEmailRef, payload);
      }
      rtdbSuccess = true;
    } catch (rtdbErr) {
      console.warn('RTDB sync notice:', rtdbErr);
    }

    // 2. Broadcast via BroadcastChannel for instant 0ms tab-to-tab update
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.postMessage({
          type: 'USER_LOGGED_IN',
          user: payload,
          timestamp: Date.now(),
        });
        bc.close();
      }
    } catch {}

    // 3. Sync to Firestore if quota is not exhausted
    if (!this.isFirestoreExhausted) {
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, payload, { merge: true });
      } catch (error: any) {
        if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
          this.isFirestoreExhausted = true;
        } else {
          console.warn('Firestore syncUserToCloud notice:', error);
        }
      }
    }

    return rtdbSuccess || true;
  }

  public static normalizeUser(raw: any): AuthUser {
    const now = new Date();
    if (!raw || typeof raw !== 'object') {
      return {
        id: `usr_${Date.now()}`,
        email: '',
        name: 'مشترك',
        role: 'user',
        createdAt: now.toISOString(),
        lastLoginAt: now.toISOString(),
        subscription: {
          status: 'trial',
          plan: 'trial',
          planNameAr: 'تجربة مجانية',
          planNameEn: 'Trial',
          startedAt: now.toISOString(),
          expiresAt: null,
          trialSecondsTotal: 300,
          trialSecondsRemaining: 300,
          trialEndsAt: new Date(now.getTime() + 300 * 1000).toISOString(),
          isExpired: false,
        }
      };
    }

    const email = (raw.email || '').trim();
    const isOwner = email.toLowerCase() === 'nesmanagahhassan@gmail.com' || raw.role === 'admin';
    const subRaw = raw.subscription && typeof raw.subscription === 'object' ? raw.subscription : {};

    const subscription: UserSubscription = isOwner
      ? {
          status: 'lifetime',
          plan: 'lifetime',
          planNameAr: 'حساب المدير والمصمم (وصول دائم)',
          planNameEn: 'Owner & Admin (Lifetime)',
          startedAt: subRaw.startedAt || raw.createdAt || now.toISOString(),
          expiresAt: null,
          trialSecondsTotal: 300,
          trialSecondsRemaining: 300,
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
          trialSecondsTotal: typeof subRaw.trialSecondsTotal === 'number' ? subRaw.trialSecondsTotal : 300,
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

  /**
   * Real-time subscription to all users across Realtime Database & Firestore.
   * Merges all sources seamlessly so NO user is ever missed.
   */
  public static subscribeToCloudUsers(
    onUsersUpdated: (users: AuthUser[]) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    let unsubFirestore: (() => void) | null = null;
    let unsubRTDB: (() => void) | null = null;
    let bc: BroadcastChannel | null = null;

    let rtdbUsers: AuthUser[] = [];
    let firestoreUsers: AuthUser[] = [];
    let broadcastUsers: AuthUser[] = [];

    const emitUnifiedUsers = () => {
      const mergedMap = new Map<string, AuthUser>();

      // 1. Add Firestore users first
      firestoreUsers.forEach((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const u = FirebaseService.normalizeUser(raw);
        const key = u.email ? u.email.toLowerCase() : u.id;
        if (key) mergedMap.set(key, u);
      });

      // 2. Add local broadcast users
      broadcastUsers.forEach((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const u = FirebaseService.normalizeUser(raw);
        const key = u.email ? u.email.toLowerCase() : u.id;
        if (key) mergedMap.set(key, u);
      });

      // 3. Add RTDB users (authoritative for live real-time state)
      rtdbUsers.forEach((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const u = FirebaseService.normalizeUser(raw);
        const key = u.email ? u.email.toLowerCase() : u.id;
        if (key) {
          const existing = mergedMap.get(key);
          if (existing) {
            mergedMap.set(key, FirebaseService.normalizeUser({
              ...existing,
              ...u,
              subscription: { ...(existing.subscription || {}), ...(u.subscription || {}) },
            }));
          } else {
            mergedMap.set(key, u);
          }
        }
      });

      const sortedList = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = new Date(a?.lastLoginAt || a?.createdAt || 0).getTime() || 0;
        const timeB = new Date(b?.lastLoginAt || b?.createdAt || 0).getTime() || 0;
        return timeB - timeA;
      });

      onUsersUpdated(sortedList);
    };

    // 1. Primary: Always listen to Realtime Database
    try {
      const rtdbUsersRef = ref(rtdb, 'users');
      unsubRTDB = onValue(
        rtdbUsersRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.val();
            rtdbUsers = data && typeof data === 'object'
              ? (Object.values(data).filter(v => v && typeof v === 'object') as AuthUser[])
              : [];
          } else {
            rtdbUsers = [];
          }
          emitUnifiedUsers();
        },
        (err) => {
          console.warn('RTDB subscribe error notice:', err);
        }
      );
    } catch (e) {
      console.warn('RTDB setup listener notice:', e);
    }

    // 2. Parallel: Listen to Firestore if available
    try {
      const usersRef = collection(db, 'users');
      unsubFirestore = onSnapshot(
        usersRef,
        (snapshot) => {
          const usersList: AuthUser[] = [];
          snapshot.forEach((docSnap) => {
            usersList.push(docSnap.data() as AuthUser);
          });
          firestoreUsers = usersList;
          emitUnifiedUsers();
        },
        (error: any) => {
          if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
            this.isFirestoreExhausted = true;
          }
          console.warn('Firestore subscription notice (using RTDB):', error?.message || error);
        }
      );
    } catch (error) {
      console.warn('Firestore subscription error:', error);
    }

    // 3. Local cross-tab broadcast channel listener
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'USER_LOGGED_IN' && event.data?.user) {
            broadcastUsers = [event.data.user, ...broadcastUsers];
            emitUnifiedUsers();
          }
        };
      }
    } catch {}

    return () => {
      if (unsubRTDB) unsubRTDB();
      if (unsubFirestore) unsubFirestore();
      if (bc) bc.close();
    };
  }

  /**
   * Admin updates a user's subscription in Firestore & RTDB (e.g. grants 30 days, Lifetime, or resets trial).
   * Instantly notifies the user's screen in real time without refreshing.
   */
  public static async updateUserSubscription(
    userId: string, 
    subscription: Partial<UserSubscription>,
    fullUser?: AuthUser,
    email?: string
  ): Promise<boolean> {
    if (!this.isConnected()) return false;

    const updates = {
      subscription: subscription,
      updatedAt: new Date().toISOString(),
    };

    const safeId = this.toSafeKey(userId);
    const targetEmail = email || fullUser?.email;
    const safeEmail = targetEmail ? this.toSafeKey(targetEmail.toLowerCase()) : null;

    let rtdbSuccess = false;

    // 1. Update in RTDB (Instant real-time push to all connected clients)
    try {
      if (fullUser) {
        const fullPayload = {
          ...fullUser,
          subscription: { ...fullUser.subscription, ...subscription },
          updatedAt: new Date().toISOString(),
        };
        const rtdbUserRef = ref(rtdb, `users/${safeId}`);
        await set(rtdbUserRef, fullPayload);

        // Also save indexed by clean email for instant matching
        if (safeEmail) {
          const rtdbEmailRef = ref(rtdb, `usersByEmail/${safeEmail}`);
          await set(rtdbEmailRef, fullPayload);
        }
      } else {
        const rtdbUserRef = ref(rtdb, `users/${safeId}/subscription`);
        await update(rtdbUserRef, subscription);
        if (safeEmail) {
          const rtdbEmailRef = ref(rtdb, `usersByEmail/${safeEmail}/subscription`);
          await update(rtdbEmailRef, subscription);
        }
      }
      rtdbSuccess = true;
    } catch (e) {
      console.warn('RTDB updateUserSubscription notice:', e);
    }

    // 2. Broadcast through local BroadcastChannel for 0ms instant tab update
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.postMessage({
          type: 'USER_SUBSCRIPTION_UPDATED',
          userId,
          email: targetEmail,
          subscription,
          user: fullUser ? { ...fullUser, subscription: { ...fullUser.subscription, ...subscription } } : undefined,
          timestamp: Date.now(),
        });
        bc.close();
      }
    } catch {}

    // 3. Update in Firestore if not exhausted
    if (!this.isFirestoreExhausted) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, updates, { merge: true });
      } catch (error: any) {
        if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
          this.isFirestoreExhausted = true;
        }
        console.warn('Firestore updateUserSubscription notice:', error);
      }
    }

    return rtdbSuccess || true;
  }

  /**
   * Listen to current user's profile in real time.
   * If the admin activates this user remotely or renews their 5 minutes, their screen unlocks automatically without refresh!
   */
  public static listenToMyUser(
    userId: string, 
    onUserChanged: (user: AuthUser) => void,
    userEmail?: string
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    let unsubFirestore: (() => void) | null = null;
    let unsubRTDBUser: (() => void) | null = null;
    let unsubRTDBEmail: (() => void) | null = null;
    let bc: BroadcastChannel | null = null;

    const safeId = this.toSafeKey(userId);

    // 1. RTDB Primary Realtime Listener (Sub-100ms WebSocket push)
    try {
      const rtdbUserRef = ref(rtdb, `users/${safeId}`);
      unsubRTDBUser = onValue(rtdbUserRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          if (val && (val.id || val.email)) {
            onUserChanged(FirebaseService.normalizeUser(val));
          }
        }
      }, (err) => {
        console.warn('RTDB listenToMyUser notice:', err);
      });

      // Also listen by sanitized email if provided
      if (userEmail) {
        const cleanEmail = this.toSafeKey(userEmail.toLowerCase());
        const rtdbEmailRef = ref(rtdb, `usersByEmail/${cleanEmail}`);
        unsubRTDBEmail = onValue(rtdbEmailRef, (snap) => {
          if (snap.exists()) {
            const val = snap.val();
            if (val && (val.id || val.email)) {
              onUserChanged(FirebaseService.normalizeUser(val));
            }
          }
        });
      }
    } catch (e) {
      console.warn('RTDB setup listener notice:', e);
    }

    // 2. BroadcastChannel Listener for instant 0ms tab-to-tab update
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'USER_SUBSCRIPTION_UPDATED') {
            if (
              data.userId === userId || 
              (userEmail && data.email && data.email.toLowerCase() === userEmail.toLowerCase())
            ) {
              if (data.user) {
                onUserChanged(FirebaseService.normalizeUser(data.user));
              }
            }
          }
        };
      }
    } catch {}

    // 3. Firestore Listener as secondary fallback
    if (!this.isFirestoreExhausted) {
      try {
        const userRef = doc(db, 'users', userId);
        unsubFirestore = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            onUserChanged(FirebaseService.normalizeUser(docSnap.data()));
          }
        }, (err: any) => {
          if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota exceeded')) {
            this.isFirestoreExhausted = true;
          }
          if (unsubFirestore) {
            try { unsubFirestore(); } catch {}
            unsubFirestore = null;
          }
        });
      } catch (e) {
        console.warn('Firestore listener notice:', e);
      }
    }

    return () => {
      if (unsubRTDBUser) unsubRTDBUser();
      if (unsubRTDBEmail) unsubRTDBEmail();
      if (unsubFirestore) unsubFirestore();
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }

  // =======================================================================
  // ⚡ 2.5 Global App Lock & Broadcast System (قفل التطبيق بالكامل أو إلغاء القفل)
  // =======================================================================

  /**
   * Set Global App Lock (Kill Switch) from Admin Panel.
   * Immediately shuts down or re-enables the app for all active users without refresh.
   */
  public static async setGlobalAppLock(
    isLocked: boolean, 
    reason: string = 'تم إغلاق التطبيق بواسطة الإدارة لأعمال الصيانة والتحديثات',
    adminEmail?: string
  ): Promise<boolean> {
    const payload = {
      isAppLocked: isLocked,
      lockReason: reason,
      lastCommand: isLocked ? 'LOCK_APP' : 'UNLOCK_APP',
      lastCommandAt: Date.now(),
      updatedBy: adminEmail || 'Admin',
    };

    // 1. RTDB Update (Instant worldwide push)
    try {
      const appStateRef = ref(rtdb, 'system/appState');
      await set(appStateRef, payload);
    } catch (e) {
      console.warn('RTDB setGlobalAppLock notice:', e);
    }

    // 2. BroadcastChannel (0ms local push)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.postMessage({
          type: 'GLOBAL_APP_LOCK_CHANGED',
          isLocked,
          reason,
          timestamp: Date.now(),
        });
        bc.close();
      }
    } catch {}

    // 3. Local storage backup
    try {
      localStorage.setItem('lingua_global_app_locked', isLocked ? 'true' : 'false');
      localStorage.setItem('lingua_global_lock_reason', reason);
    } catch {}

    return true;
  }

  /**
   * Send Instant Broadcast Notice to all users
   */
  public static async setGlobalBroadcastNotice(notice: string | null): Promise<boolean> {
    try {
      const noticeRef = ref(rtdb, 'system/appState/broadcastNotice');
      await set(noticeRef, notice);

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.postMessage({
          type: 'GLOBAL_BROADCAST_NOTICE',
          notice,
          timestamp: Date.now(),
        });
        bc.close();
      }
      return true;
    } catch (e) {
      console.warn('setGlobalBroadcastNotice notice:', e);
      return false;
    }
  }

  /**
   * Listen to Global App State (Lock status & Broadcasts)
   */
  public static listenToGlobalAppState(
    callback: (state: { isAppLocked: boolean; lockReason: string; broadcastNotice?: string | null }) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    let unsubRTDB: (() => void) | null = null;
    let bc: BroadcastChannel | null = null;

    try {
      const appStateRef = ref(rtdb, 'system/appState');
      unsubRTDB = onValue(appStateRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          callback({
            isAppLocked: Boolean(val?.isAppLocked),
            lockReason: val?.lockReason || 'تم إغلاق التطبيق بواسطة الإدارة',
            broadcastNotice: val?.broadcastNotice || null,
          });
        } else {
          callback({
            isAppLocked: false,
            lockReason: '',
            broadcastNotice: null,
          });
        }
      }, (err) => {
        console.warn('RTDB listenToGlobalAppState notice:', err);
      });
    } catch (e) {
      console.warn('listenToGlobalAppState setup notice:', e);
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('lingua_realtime_admin_channel');
        bc.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'GLOBAL_APP_LOCK_CHANGED') {
            callback({
              isAppLocked: Boolean(data.isLocked),
              lockReason: data.reason || 'تم إغلاق التطبيق بواسطة الإدارة',
            });
          } else if (data && data.type === 'GLOBAL_BROADCAST_NOTICE') {
            callback({
              isAppLocked: false,
              lockReason: '',
              broadcastNotice: data.notice,
            });
          }
        };
      }
    } catch {}

    return () => {
      if (unsubRTDB) unsubRTDB();
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }

  // =======================================================================
  // 🔑 3. License Keys Cloud Management
  // =======================================================================

  /**
   * Save a newly generated license key to Firestore & RTDB
   */
  public static async saveLicenseToCloud(license: LicenseKey): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const rtdbLicenseRef = ref(rtdb, `licenses/${license.code}`);
      await set(rtdbLicenseRef, license);
    } catch {}

    if (!this.isFirestoreExhausted) {
      try {
        const licenseRef = doc(db, 'licenses', license.code);
        await setDoc(licenseRef, license, { merge: true });
      } catch (error: any) {
        if (error?.code === 'resource-exhausted') {
          this.isFirestoreExhausted = true;
        }
      }
    }

    return true;
  }

  /**
   * Real-time subscription to license keys
   */
  public static subscribeToCloudLicenses(
    onLicensesUpdated: (licenses: LicenseKey[]) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    try {
      const rtdbLicensesRef = ref(rtdb, 'licenses');
      const unsub = onValue(rtdbLicensesRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.values(data) as LicenseKey[];
          onLicensesUpdated(list);
        }
      });
      return () => unsub();
    } catch (error) {
      console.warn('subscribeToCloudLicenses error:', error);
      return null;
    }
  }

  /**
   * Redeem a license key directly in Firestore & RTDB
   */
  public static async redeemCloudLicense(
    code: string, 
    userEmail: string
  ): Promise<{ success: boolean; license?: LicenseKey; message: string }> {
    if (!this.isConnected()) {
      return { success: false, message: 'قاعدة البيانات غير متصلة' };
    }

    const cleanCode = code.toUpperCase().trim();

    try {
      // 1. Try checking in RTDB first (fast & quota-free)
      const rtdbLicenseRef = ref(rtdb, `licenses/${cleanCode}`);
      const rtdbSnap = await get(rtdbLicenseRef);

      if (rtdbSnap.exists()) {
        const license = rtdbSnap.val() as LicenseKey;
        if (license.isUsed) {
          return { success: false, message: 'تم استخدام هذا الكود من قبل' };
        }

        const updatedLicense: LicenseKey = {
          ...license,
          isUsed: true,
          usedByEmail: userEmail,
          usedAt: new Date().toISOString(),
        };

        await set(rtdbLicenseRef, updatedLicense);
        
        // Also update Firestore if not exhausted
        if (!this.isFirestoreExhausted) {
          try {
            const licenseRef = doc(db, 'licenses', cleanCode);
            await setDoc(licenseRef, updatedLicense, { merge: true });
          } catch {}
        }

        return { 
          success: true, 
          license: updatedLicense, 
          message: 'تم تفعيل الكود بنجاح' 
        };
      }

      // 2. Fallback to Firestore if not found in RTDB
      if (!this.isFirestoreExhausted) {
        const licenseRef = doc(db, 'licenses', cleanCode);
        const snapshot = await getDoc(licenseRef);

        if (snapshot.exists()) {
          const license = snapshot.data() as LicenseKey;
          if (license.isUsed) {
            return { success: false, message: 'تم استخدام هذا الكود من قبل' };
          }

          const updatedLicense: LicenseKey = {
            ...license,
            isUsed: true,
            usedByEmail: userEmail,
            usedAt: new Date().toISOString(),
          };

          await setDoc(licenseRef, updatedLicense, { merge: true });
          try {
            await set(rtdbLicenseRef, updatedLicense);
          } catch {}

          return { 
            success: true, 
            license: updatedLicense, 
            message: 'تم تفعيل الكود بنجاح' 
          };
        }
      }

      return { success: false, message: 'كود التفعيل غير موجود' };
    } catch (error: any) {
      if (error?.code === 'resource-exhausted') {
        this.isFirestoreExhausted = true;
      }
      console.error('Firebase redeemCloudLicense error:', error);
      return { success: false, message: 'حدث خطأ أثناء فحص الكود السحابي' };
    }
  }
}

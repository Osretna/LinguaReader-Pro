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
    if (!this.isConnected()) return false;

    // Debounce rapid syncs for the same user within 2 seconds
    const now = Date.now();
    const lastSync = this.lastSyncTimestamp[user.id] || 0;
    if (now - lastSync < 2000 && user.subscription.status === 'trial') {
      return true;
    }
    this.lastSyncTimestamp[user.id] = now;

    const payload = {
      ...user,
      cloudSyncedAt: new Date().toISOString(),
    };

    let rtdbSuccess = false;

    // 1. Always sync to Realtime Database (High quota & real-time resilience)
    try {
      const rtdbUserRef = ref(rtdb, `users/${user.id}`);
      await set(rtdbUserRef, payload);
      rtdbSuccess = true;
    } catch (rtdbErr) {
      console.warn('RTDB sync notice:', rtdbErr);
    }

    // 2. Sync to Firestore if quota is not exhausted
    if (!this.isFirestoreExhausted) {
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, payload, { merge: true });
      } catch (error: any) {
        if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
          console.warn('Firestore Quota Exceeded. Switching automatically to Realtime Database fallback.');
          this.isFirestoreExhausted = true;
        } else {
          console.warn('Firestore syncUserToCloud notice:', error);
        }
      }
    }

    return rtdbSuccess || true;
  }

  /**
   * Real-time subscription to all users in Firestore / RTDB.
   * Automatically falls back to Realtime Database on Firestore quota limits.
   */
  public static subscribeToCloudUsers(
    onUsersUpdated: (users: AuthUser[]) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    let unsubFirestore: (() => void) | null = null;
    let unsubRTDB: (() => void) | null = null;

    const setupRTDBListener = () => {
      try {
        const rtdbUsersRef = ref(rtdb, 'users');
        unsubRTDB = onValue(rtdbUsersRef, (snap) => {
          if (snap.exists()) {
            const data = snap.val();
            const list = Object.values(data) as AuthUser[];
            onUsersUpdated(list);
          }
        }, (err) => {
          console.warn('RTDB subscribe error notice:', err);
        });
      } catch (e) {
        console.warn('RTDB setup listener notice:', e);
      }
    };

    // If Firestore is already exhausted, use RTDB directly
    if (this.isFirestoreExhausted) {
      setupRTDBListener();
      return () => {
        if (unsubRTDB) unsubRTDB();
      };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastLoginAt', 'desc'));

      unsubFirestore = onSnapshot(q, (snapshot) => {
        const usersList: AuthUser[] = [];
        snapshot.forEach((docSnap) => {
          usersList.push(docSnap.data() as AuthUser);
        });
        onUsersUpdated(usersList);
      }, (error: any) => {
        if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
          this.isFirestoreExhausted = true;
        }
        console.warn('Firebase subscribeToCloudUsers fallback to RTDB:', error?.message || error);
        if (unsubFirestore) {
          try { unsubFirestore(); } catch {}
          unsubFirestore = null;
        }
        setupRTDBListener();
      });

      return () => {
        if (unsubFirestore) unsubFirestore();
        if (unsubRTDB) unsubRTDB();
      };
    } catch (error) {
      console.warn('Firebase subscribeToCloudUsers init error, using RTDB:', error);
      setupRTDBListener();
      return () => {
        if (unsubRTDB) unsubRTDB();
      };
    }
  }

  /**
   * Admin updates a user's subscription in Firestore & RTDB (e.g. grants 30 days or Lifetime).
   */
  public static async updateUserSubscription(
    userId: string, 
    subscription: Partial<UserSubscription>
  ): Promise<boolean> {
    if (!this.isConnected()) return false;

    const updates = {
      subscription: subscription,
      updatedAt: new Date().toISOString(),
    };

    let rtdbSuccess = false;

    // 1. Update in RTDB (Instant real-time update)
    try {
      const rtdbUserRef = ref(rtdb, `users/${userId}/subscription`);
      await update(rtdbUserRef, subscription);
      rtdbSuccess = true;
    } catch (e) {
      console.warn('RTDB updateUserSubscription notice:', e);
    }

    // 2. Update in Firestore if not exhausted
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
   * If the admin activates this user remotely from their phone, their screen unlocks automatically!
   */
  public static listenToMyUser(
    userId: string, 
    onUserChanged: (user: AuthUser) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    let unsubFirestore: (() => void) | null = null;
    let unsubRTDB: (() => void) | null = null;

    const setupRTDBListener = () => {
      try {
        const rtdbUserRef = ref(rtdb, `users/${userId}`);
        unsubRTDB = onValue(rtdbUserRef, (snap) => {
          if (snap.exists()) {
            onUserChanged(snap.val() as AuthUser);
          }
        }, (err) => {
          console.warn('RTDB listenToMyUser notice:', err);
        });
      } catch (e) {
        console.warn('RTDB listenToMyUser setup notice:', e);
      }
    };

    if (this.isFirestoreExhausted) {
      setupRTDBListener();
      return () => {
        if (unsubRTDB) unsubRTDB();
      };
    }

    try {
      const userRef = doc(db, 'users', userId);
      unsubFirestore = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          onUserChanged(docSnap.data() as AuthUser);
        }
      }, (err: any) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota exceeded')) {
          this.isFirestoreExhausted = true;
        }
        console.warn('listenToMyUser fallback to RTDB:', err?.message || err);
        if (unsubFirestore) {
          try { unsubFirestore(); } catch {}
          unsubFirestore = null;
        }
        setupRTDBListener();
      });

      return () => {
        if (unsubFirestore) unsubFirestore();
        if (unsubRTDB) unsubRTDB();
      };
    } catch (e) {
      console.warn('listenToMyUser init error, using RTDB:', e);
      setupRTDBListener();
      return () => {
        if (unsubRTDB) unsubRTDB();
      };
    }
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

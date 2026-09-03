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
  /**
   * Check connection status
   */
  public static isConnected(): boolean {
    return isFirebaseConfigured() && db !== null;
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
   * This allows the admin (م. محمد) to see all users who entered the app from anywhere.
   */
  public static async syncUserToCloud(user: AuthUser): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      // 1. Firestore sync
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        cloudSyncedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Realtime Database sync (dual compatibility)
      try {
        const rtdbUserRef = ref(rtdb, `users/${user.id}`);
        await set(rtdbUserRef, {
          ...user,
          cloudSyncedAt: new Date().toISOString(),
        });
      } catch (rtdbErr) {
        console.warn('RTDB sync notice:', rtdbErr);
      }

      return true;
    } catch (error) {
      console.error('Firebase syncUserToCloud error:', error);
      return false;
    }
  }

  /**
   * Real-time subscription to all users in Firestore / RTDB.
   * Admin panel uses this to monitor all registered users live with instant status.
   */
  public static subscribeToCloudUsers(
    onUsersUpdated: (users: AuthUser[]) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastLoginAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersList: AuthUser[] = [];
        snapshot.forEach((docSnap) => {
          usersList.push(docSnap.data() as AuthUser);
        });
        onUsersUpdated(usersList);
      }, (error) => {
        console.warn('Firebase subscribeToCloudUsers snapshot notice, trying RTDB:', error);
        // Fallback to RTDB
        try {
          const rtdbUsersRef = ref(rtdb, 'users');
          onValue(rtdbUsersRef, (snap) => {
            if (snap.exists()) {
              const data = snap.val();
              const list = Object.values(data) as AuthUser[];
              onUsersUpdated(list);
            }
          });
        } catch {}
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firebase subscribeToCloudUsers error:', error);
      return null;
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

    try {
      // Update in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);

      // Update in RTDB
      try {
        const rtdbUserRef = ref(rtdb, `users/${userId}/subscription`);
        await update(rtdbUserRef, subscription);
      } catch {}

      return true;
    } catch (error) {
      console.error('Firebase updateUserSubscription error:', error);
      return false;
    }
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

    try {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          onUserChanged(docSnap.data() as AuthUser);
        }
      }, (err) => {
        console.warn('listenToMyUser error fallback to RTDB:', err);
        try {
          const rtdbUserRef = ref(rtdb, `users/${userId}`);
          onValue(rtdbUserRef, (snap) => {
            if (snap.exists()) {
              onUserChanged(snap.val() as AuthUser);
            }
          });
        } catch {}
      });
      return unsubscribe;
    } catch (e) {
      console.warn('listenToMyUser error:', e);
      return null;
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
      const licenseRef = doc(db, 'licenses', license.code);
      await setDoc(licenseRef, license, { merge: true });

      try {
        const rtdbLicenseRef = ref(rtdb, `licenses/${license.code}`);
        await set(rtdbLicenseRef, license);
      } catch {}

      return true;
    } catch (error) {
      console.error('Firebase saveLicenseToCloud error:', error);
      return false;
    }
  }

  /**
   * Real-time subscription to license keys in Firestore
   */
  public static subscribeToCloudLicenses(
    onLicensesUpdated: (licenses: LicenseKey[]) => void
  ): (() => void) | null {
    if (!this.isConnected()) return null;

    try {
      const licensesRef = collection(db, 'licenses');
      const q = query(licensesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: LicenseKey[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as LicenseKey);
        });
        onLicensesUpdated(list);
      }, (err) => {
        console.warn('Firebase licenses snapshot notice:', err);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firebase subscribeToCloudLicenses error:', error);
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

    try {
      const cleanCode = code.toUpperCase().trim();
      const licenseRef = doc(db, 'licenses', cleanCode);
      const snapshot = await getDoc(licenseRef);

      if (!snapshot.exists()) {
        return { success: false, message: 'كود التفعيل غير موجود في السحابة' };
      }

      const license = snapshot.data() as LicenseKey;
      if (license.isUsed) {
        return { success: false, message: 'تم استخدام هذا الكود من قبل' };
      }

      // Mark as used in Firestore
      await updateDoc(licenseRef, {
        isUsed: true,
        usedByEmail: userEmail,
        usedAt: new Date().toISOString()
      });

      // Update in RTDB
      try {
        const rtdbLicenseRef = ref(rtdb, `licenses/${cleanCode}`);
        await update(rtdbLicenseRef, {
          isUsed: true,
          usedByEmail: userEmail,
          usedAt: new Date().toISOString()
        });
      } catch {}

      return { 
        success: true, 
        license: { ...license, isUsed: true, usedByEmail: userEmail }, 
        message: 'تم تفعيل الكود بنجاح' 
      };
    } catch (error) {
      console.error('Firebase redeemCloudLicense error:', error);
      return { success: false, message: 'حدث خطأ أثناء فحص الكود السحابي' };
    }
  }
}

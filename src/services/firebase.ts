import { initializeApp, getApps, getApp } from 'firebase/app';
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
import { AuthUser, LicenseKey, UserSubscription } from '../types';

// =========================================================================
// 🔥 إعدادات الربط بـ Firebase (قاعدة البيانات السحابية المركزية)
// =========================================================================
// 📍 مكان هذا الملف: src/services/firebase.ts
//
// 📍 خطوات الحصول على هذه البيانات بسهولة:
// 1. افتح https://console.firebase.google.com/ وسجل دخول بحساب Google.
// 2. اضغط "Add Project" أو اختر مشروع موجود.
// 3. اضغط على أيقونة الويب (</>) لإنشاء تطبيق ويب جديد.
// 4. فعّل Firestore Database بالضغط على "Firestore Database" ثم "Create Database".
// 5. انسخ بيانات `firebaseConfig` وضعها هنا مباشرة بدلاً من القيم الافتراضية:
// =========================================================================

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if the user has replaced placeholder credentials with real Firebase keys
export function isFirebaseConfigured(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('YOUR_') &&
    Boolean(firebaseConfig.projectId) &&
    !firebaseConfig.projectId.includes('YOUR_')
  );
}

let dbInstance: Firestore | null = null;

function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!dbInstance) {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      dbInstance = getFirestore(app);
    } catch (e) {
      console.warn('Firebase initialization error:', e);
      return null;
    }
  }
  return dbInstance;
}

export class FirebaseService {
  /**
   * Check connection status
   */
  public static isConnected(): boolean {
    return isFirebaseConfigured() && getDb() !== null;
  }

  /**
   * Save or sync any logged-in user to the Cloud Firestore in real time.
   * This allows the admin to see all users from any device.
   */
  public static async syncUserToCloud(user: AuthUser): Promise<boolean> {
    const db = getDb();
    if (!db) return false;

    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        cloudSyncedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Firebase syncUserToCloud error:', error);
      return false;
    }
  }

  /**
   * Real-time subscription to all users in Firestore.
   * Admin panel uses this to monitor all registered and active users live.
   */
  public static subscribeToCloudUsers(
    onUsersUpdated: (users: AuthUser[]) => void
  ): (() => void) | null {
    const db = getDb();
    if (!db) return null;

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
        console.warn('Firebase subscribeToCloudUsers snapshot error:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firebase subscribeToCloudUsers error:', error);
      return null;
    }
  }

  /**
   * Admin updates a user's subscription in Firestore (e.g. grants 30 days or Lifetime).
   */
  public static async updateUserSubscription(
    userId: string, 
    subscription: Partial<UserSubscription>
  ): Promise<boolean> {
    const db = getDb();
    if (!db) return false;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscription: subscription,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Firebase updateUserSubscription error:', error);
      return false;
    }
  }

  /**
   * Listen to current user's profile in real time.
   * If the admin activates this user remotely, their screen unlocks automatically!
   */
  public static listenToMyUser(
    userId: string, 
    onUserChanged: (user: AuthUser) => void
  ): (() => void) | null {
    const db = getDb();
    if (!db) return null;

    try {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          onUserChanged(docSnap.data() as AuthUser);
        }
      });
      return unsubscribe;
    } catch (e) {
      console.warn('listenToMyUser error:', e);
      return null;
    }
  }

  /**
   * Save a newly generated license key to Firestore
   */
  public static async saveLicenseToCloud(license: LicenseKey): Promise<boolean> {
    const db = getDb();
    if (!db) return false;

    try {
      const licenseRef = doc(db, 'licenses', license.code);
      await setDoc(licenseRef, license, { merge: true });
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
    const db = getDb();
    if (!db) return null;

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
        console.warn('Firebase licenses snapshot error:', err);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firebase subscribeToCloudLicenses error:', error);
      return null;
    }
  }

  /**
   * Redeem a license key directly in Firestore
   */
  public static async redeemCloudLicense(
    code: string, 
    userEmail: string
  ): Promise<{ success: boolean; license?: LicenseKey; message: string }> {
    const db = getDb();
    if (!db) {
      return { success: false, message: 'قاعدة البيانات غير متصلة' };
    }

    try {
      const licenseRef = doc(db, 'licenses', code.toUpperCase().trim());
      const snapshot = await getDoc(licenseRef);

      if (!snapshot.exists()) {
        return { success: false, message: 'كود التفعيل غير موجود في السحابة' };
      }

      const license = snapshot.data() as LicenseKey;
      if (license.isUsed) {
        return { success: false, message: 'تم استخدام هذا الكود من قبل' };
      }

      // Mark as used
      await updateDoc(licenseRef, {
        isUsed: true,
        usedByEmail: userEmail,
        usedAt: new Date().toISOString()
      });

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

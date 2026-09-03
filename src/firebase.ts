/**
 * LinguaReader Pro - Firebase Centralized Module
 * 
 * يحتوي هذا الملف على إعدادات الربط الحقيقية بـ Firebase لمشروع linguareader-pro
 * مع تصدير جميع دوال المصادقة وقاعدة البيانات وإدارة المستخدمين
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
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
import { UserProfile, AuthUser } from './types';
import { firebaseConfig, FirebaseService, isFirebaseConfigured } from './services/firebase';

export { firebaseConfig, FirebaseService, isFirebaseConfigured };

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Admin Email Constant
export const ADMIN_EMAIL = 'vip.mohamed@gmail.com';

/**
 * Sync user profile to Firestore & Realtime Database with graceful error fallback
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                  user.email?.toLowerCase().includes('admin') || 
                  user.email?.toLowerCase().includes('mohamed');

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
    photoURL: user.photoURL || null,
    role: isAdmin ? 'admin' : 'user',
    isActivated: isAdmin,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // Sync to RTDB first (quota resilient)
  try {
    const rtdbUserRef = ref(rtdb, `users/${user.uid}`);
    await set(rtdbUserRef, profile);
  } catch (rtdbErr) {
    console.warn("RTDB syncUserProfile notice:", rtdbErr);
  }

  // Sync to Firestore if possible
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const updated: UserProfile = {
        ...existing,
        email: user.email,
        displayName: user.displayName || existing.displayName,
        photoURL: user.photoURL || existing.photoURL,
        lastLoginAt: new Date().toISOString(),
        role: existing.role === 'admin' || isAdmin ? 'admin' : existing.role,
        isActivated: existing.role === 'admin' || isAdmin ? true : existing.isActivated,
      };
      await updateDoc(userRef, updated as any);
      return updated;
    } else {
      await setDoc(userRef, profile);
      return profile;
    }
  } catch (err) {
    console.warn("Firestore syncUserProfile notice (fallback to profile):", err);
    return profile;
  }
}

/**
 * Listen to user profile changes
 */
export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  let unsubFirestore: (() => void) | null = null;
  let unsubRTDB: (() => void) | null = null;

  try {
    const userRef = doc(db, 'users', uid);
    unsubFirestore = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn("subscribeToUserProfile fallback to RTDB:", err);
      try {
        const rtdbUserRef = ref(rtdb, `users/${uid}`);
        unsubRTDB = onValue(rtdbUserRef, (snap) => {
          if (snap.exists()) {
            callback(snap.val() as UserProfile);
          } else {
            callback(null);
          }
        });
      } catch {}
    });
  } catch (e) {
    console.warn("subscribeToUserProfile error fallback:", e);
    try {
      const rtdbUserRef = ref(rtdb, `users/${uid}`);
      unsubRTDB = onValue(rtdbUserRef, (snap) => {
        if (snap.exists()) {
          callback(snap.val() as UserProfile);
        } else {
          callback(null);
        }
      });
    } catch {}
  }

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (unsubRTDB) unsubRTDB();
  };
}

/**
 * Real Google Sign-in
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await syncUserProfile(result.user);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
}

/**
 * Sign In with Email
 */
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfile(res.user);
}

/**
 * Register with Email
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  return await syncUserProfile(res.user);
}

/**
 * Reset password email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get all registered users for Admin panel
 */
export async function getAllRegisteredUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snapshot.forEach(docSnap => {
      users.push(docSnap.data() as UserProfile);
    });
    return users;
  } catch (err) {
    console.error("Error fetching all users:", err);
    return [];
  }
}

/**
 * Set user activation status
 */
export async function setUserActivationStatus(uid: string, isActivated: boolean, activatedBy: string = 'Admin'): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    isActivated,
    activationDate: isActivated ? new Date().toISOString() : null,
    activatedBy: isActivated ? activatedBy : null,
  });
}

/**
 * Set user role
 */
export async function setUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role,
    isActivated: role === 'admin' ? true : undefined
  });
}

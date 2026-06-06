/**
 * Auth Service — GarageSathi
 *
 * Firebase Authentication operations.
 * Handles signup (with garage creation), login, logout, and password reset.
 *
 * Architecture Note:
 * On signup, a new garage document is created and the user is linked to it.
 * This ensures multi-garage readiness from day 1.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { USER_ROLES } from '@/config/constants';


/**
 * Register a new garage owner.
 * Creates: Firebase Auth user → User document → Garage document
 *
 * @param {object} data - { email, password, name, phone, garageName, garagePhone, garageCity }
 * @returns {object} - { user, garageId }
 */
export async function registerGarageOwner(data) {
  const { email, password, name, phone, garageName, garagePhone, garageCity } = data;

  // 1. Create Firebase Auth account
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  try {
    // 2. Update display name in Auth
    await updateProfile(credential.user, { displayName: name });

    // 3 & 4. Create garage doc + user profile atomically in a single batch.
    // If either write fails, both are rolled back — no orphan documents.
    const garageId = uid; // Use user ID as garage ID (MVP: 1 user = 1 garage)
    const garageRef = doc(db, 'garages', garageId);
    const userRef = doc(db, 'users', uid);

    const batch = writeBatch(db);

    batch.set(garageRef, {
      name: garageName,
      ownerId: uid,
      phone: garagePhone || phone,
      email: email,
      address: {
        city: garageCity || '',
        state: '',
        pincode: '',
        street: '',
      },
      gstNumber: '',
      upiId: '',
      staffIds: [uid],
      subscription: {
        plan: 'free',
        validUntil: null,
        features: ['customers', 'services', 'billing'],
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(userRef, {
      uid: uid,
      email: email,
      displayName: name,
      phone: phone,
      role: USER_ROLES.GARAGE_OWNER,
      garageId: garageId,
      garageName: garageName,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { user: credential.user, garageId };
  } catch (firestoreError) {
    // Firestore writes failed after Auth user was created.
    // Delete the Auth account so the email can be re-used on retry.
    // If deleteUser also fails, log it — the user can still reset via Firebase Console.
    try {
      await deleteUser(credential.user);
    } catch (deleteError) {
      console.error('[Auth] Rollback failed — orphaned auth account:', deleteError);
    }
    throw firestoreError;
  }
}


/**
 * Login with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {object} Firebase user
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Logout current user.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Send password reset email.
 * @param {string} email
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Fetch user profile from Firestore.
 * Called after auth state change to get role, garageId, etc.
 * @param {string} uid - Firebase user ID
 * @returns {object|null} User profile data
 */
export async function getUserProfile(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
}

/**
 * Subscribe to auth state changes.
 * Called once in App.jsx to sync auth state with Zustand store.
 * @param {function} callback - (user: FirebaseUser | null) => void
 * @returns {function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

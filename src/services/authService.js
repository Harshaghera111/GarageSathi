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
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
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

  // 2. Update display name
  await updateProfile(credential.user, { displayName: name });

  // 3. Create garage document
  const garageId = uid; // Use user ID as garage ID for simplicity in MVP
  const garageRef = doc(db, 'garages', garageId);
  await setDoc(garageRef, {
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

  // 4. Create user profile document
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
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

  return { user: credential.user, garageId };
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

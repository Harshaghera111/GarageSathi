/**
 * Firebase Configuration — GarageSathi
 *
 * Uses Firebase v9+ modular SDK for tree-shaking.
 * Includes Firestore offline persistence for slow/no internet areas.
 * Phase 3: Firebase Storage added for vehicle photo management.
 *
 * SETUP:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project called "GarageSathi"
 * 3. Add a Web app
 * 4. Copy the config values to your .env file
 * 5. Enable Authentication (Email/Password)
 * 6. Create a Firestore database
 * 7. Enable Firebase Storage
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton)
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

/**
 * Initialize Firestore with persistent local cache.
 * persistentLocalCache replaces the deprecated enableIndexedDbPersistence.
 * This lets the app work offline — critical for Indian Tier-2/3 cities
 * with spotty connectivity.
 *
 * persistentMultipleTabManager allows multiple tabs to share the cache.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/**
 * Firebase Storage instance.
 * Phase 3: Used for vehicle condition photo uploads.
 * Storage bucket is configured via VITE_FIREBASE_STORAGE_BUCKET in .env
 */
export const storage = getStorage(app);

export default app;

// @ts-ignore
if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "atlas-v1-505407",
  appId: "1:763285078460:web:bbd2d1684b68f6b0672bb9",
  apiKey: "AIzaSyBREWqKwPmaXW9pJ5AoJgiNo5eEYcGMNwc",
  authDomain: "atlas-v1-505407.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-agendacraftai-88228244-34b0-45f8-9d06-001ed8595880",
  storageBucket: "atlas-v1-505407.firebasestorage.app",
  messagingSenderId: "763285078460",
  oAuthClientId: "763285078460-5odvll59mj2ihppog7cb3jhes3n032hs.apps.googleusercontent.com",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export default app;

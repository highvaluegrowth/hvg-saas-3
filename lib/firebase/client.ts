import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Strict singleton — Turbopack/hot-reload can re-execute this module,
// so we must guard both the app AND Firestore initialization to prevent
// "Firestore has already been initialized" / "can only call settings() once" crashes.
const apps = getApps();
const app = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = apps.length === 0
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : getFirestore(app);
export const storage = getStorage(app);

export { app };

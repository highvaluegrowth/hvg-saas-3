// lib/firebase/admin.ts
// All firebase-admin imports are done lazily inside getter functions so that
// the firebase-admin packages are NEVER evaluated at Next.js build time
// (which would fail because env vars / gRPC credentials aren't available).

/* eslint-disable @typescript-eslint/no-require-imports */
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore, FieldValue as FieldValueType } from 'firebase-admin/firestore';

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

function initializeAdminApp(): App {
  if (_adminApp) return _adminApp;

  // Lazy require — only runs at request time, never at build time
  const { initializeApp, getApps, cert } = require('firebase-admin/app');

  const apps = getApps();
  if (apps.length > 0) {
    _adminApp = apps[0];
    return _adminApp!;
  }

  if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    throw new Error('Firebase Admin SDK environment variables are not configured');
  }

  _adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  return _adminApp!;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    const { getAuth } = require('firebase-admin/auth');
    _adminAuth = getAuth(initializeAdminApp());
  }
  return _adminAuth!;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    const { getFirestore } = require('firebase-admin/firestore');
    _adminDb = getFirestore(initializeAdminApp());
  }
  return _adminDb!;
}

// FieldValue re-export as a Proxy so existing code using FieldValue.serverTimestamp() etc. still works
export const FieldValue: typeof FieldValueType = new Proxy({} as typeof FieldValueType, {
  get: (_, prop) => {
    const { FieldValue: FV } = require('firebase-admin/firestore');
    return FV[prop as keyof typeof FieldValueType];
  },
});

// Backward-compatible proxy exports — properties are only accessed at request time
export const adminAuth: Auth = new Proxy({} as Auth, {
  get: (_, prop) => {
    return getAdminAuth()[prop as keyof Auth];
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get: (_, prop) => {
    return getAdminDb()[prop as keyof Firestore];
  },
});

// Legacy named export
export { initializeAdminApp as adminApp };

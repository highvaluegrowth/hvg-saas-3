// lib/firebase/admin.ts
// All firebase-admin imports are done lazily inside getter functions so that
// the firebase-admin packages are NEVER evaluated at Next.js build time
// (which would fail because env vars / gRPC credentials aren't available).
//
// Private-key credential strategy (in priority order):
//   1. FIREBASE_SERVICE_ACCOUNT_BASE64  — full service-account JSON, base64-encoded.
//      Eliminates ALL newline / OpenSSL-3 key-parsing issues on Vercel.
//      Generate with: base64 -i <service-account.json> | tr -d '\n'
//   2. FIREBASE_ADMIN_PRIVATE_KEY + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PROJECT_ID
//      — three individual env vars (legacy fallback).

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

  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // ✅ Preferred: full service-account JSON, base64-encoded.
    // Zero newline or OpenSSL-3 key-format issues.
    try {
      const json = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8');
      credential = cert(JSON.parse(json));
    } catch (e) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64: ${e}`);
    }
  } else if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    // Fallback: individual env vars
    credential = cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    throw new Error(
      'Firebase Admin SDK: set FIREBASE_SERVICE_ACCOUNT_BASE64 or the three ' +
        'FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY vars.'
    );
  }

  _adminApp = initializeApp({ credential });
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

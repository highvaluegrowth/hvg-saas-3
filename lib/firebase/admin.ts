import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';

export { FieldValue };

let adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

function initializeAdminApp(): App {
  if (getApps().length === 0) {
    // Only initialize if environment variables are present
    if (
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      throw new Error('Firebase Admin SDK environment variables are not configured');
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(initializeAdminApp());
  }
  return _adminAuth;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(initializeAdminApp());
  }
  return _adminDb;
}

// For backward compatibility
export const adminAuth = new Proxy({} as Auth, {
  get: (_, prop) => {
    return getAdminAuth()[prop as keyof Auth];
  }
});

export const adminDb = new Proxy({} as Firestore, {
  get: (_, prop) => {
    return getAdminDb()[prop as keyof Firestore];
  }
});

export { initializeAdminApp as adminApp };

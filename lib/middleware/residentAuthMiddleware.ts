import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { appUserService } from '@/features/appUser/services/appUserService';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AppUser } from '@/shared/types';

export interface ResidentContext {
  uid: string;
  residentId: string;
  tenantId: string;
  enrollmentStatus: string;
  appUser: AppUser;
}

export class ResidentAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'ResidentAuthError';
  }
}

/**
 * Verifies that the request bearer token belongs to a resident
 * who has an active or waitlist enrollment for the given tenantId.
 * Throws ResidentAuthError (403) or (401) if checks fail.
 */
export async function verifyResidentTenantAccess(
  request: NextRequest,
  tenantId: string
): Promise<ResidentContext> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ResidentAuthError('Missing authorization token', 401);
  }
  const idToken = authHeader.slice(7);

  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new ResidentAuthError('Invalid or expired token', 401);
  }

  const uid = decodedToken.uid;

  // Must have resident role in claims
  if (decodedToken.role !== 'resident') {
    throw new ResidentAuthError('Access restricted to residents');
  }

  // Must have a /users/{uid} document
  const appUser = await appUserService.getByUid(uid);
  if (!appUser) {
    throw new ResidentAuthError('App user profile not found');
  }

  if (!appUser.residentId) {
    throw new ResidentAuthError('No resident record linked to this account');
  }

  // Must have an enrollment in this tenant (collection group query)
  const enrollmentSnap = await adminDb
    .collectionGroup('enrollments')
    .where('residentId', '==', appUser.residentId)
    .where('tenantId', '==', tenantId)
    .limit(1)
    .get();

  if (enrollmentSnap.empty) {
    throw new ResidentAuthError('Not enrolled in this organization');
  }

  const enrollment = enrollmentSnap.docs[0].data();

  if (enrollment.status === 'discharged') {
    throw new ResidentAuthError('Enrollment has been discharged');
  }

  return {
    uid,
    residentId: appUser.residentId,
    tenantId,
    enrollmentStatus: enrollment.status,
    appUser,
  };
}

/**
 * Lighter version: verifies resident token exists + /users doc exists.
 * Does NOT check tenant enrollment — for routes like /me, /tenants (discovery).
 */
export async function verifyResidentToken(
  request: NextRequest
): Promise<{ uid: string; appUser: AppUser }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ResidentAuthError('Missing authorization token', 401);
  }
  const idToken = authHeader.slice(7);

  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new ResidentAuthError('Invalid or expired token', 401);
  }

  if (decodedToken.role !== 'resident') {
    throw new ResidentAuthError('Access restricted to residents');
  }

  const appUser = await appUserService.getByUid(decodedToken.uid);
  if (!appUser) {
    throw new ResidentAuthError('App user profile not found');
  }

  return { uid: decodedToken.uid, appUser };
}

/**
 * Verifies any valid app user token (resident, admin, staff, etc.)
 * For SaaS Operators without a native profile, JIT provisions one.
 */
export async function verifyAppUserToken(
  request: NextRequest
): Promise<{ uid: string; appUser: AppUser; decodedToken: DecodedIdToken }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ResidentAuthError('Missing authorization token', 401);
  }
  const idToken = authHeader.slice(7);

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new ResidentAuthError('Invalid or expired token', 401);
  }

  // Attempt to find or JIT provision the AppUser profile
  let appUser: AppUser;
  try {
    appUser = await appUserService.findOrCreate(decodedToken);
  } catch (error) {
    console.error('Failed to find or create AppUser profile:', error);
    throw new ResidentAuthError('Failed to initialize user profile', 500);
  }

  return { uid: decodedToken.uid, appUser, decodedToken };
}

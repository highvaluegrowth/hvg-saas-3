import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { AuthError } from '@/lib/utils/errors';

/**
 * Verifies Firebase ID token from Authorization header
 * @param request - Next.js request object
 * @returns Decoded token with custom claims
 * @throws AuthError if token is missing or invalid
 */
export async function verifyAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header');
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    throw new AuthError(`Token verification failed: ${error.message}`, error.code);
  }
}

/**
 * Checks if user has permission to set custom claims on target user
 * @param decodedToken - Token of requesting user
 * @param targetUid - UID of user whose claims are being modified
 * @returns true if authorized, false otherwise
 */
export function canSetCustomClaims(
  decodedToken: any,
  targetUid: string
): boolean {
  // Super admins can set claims on any user
  if (decodedToken.role === 'super_admin') {
    return true;
  }

  // Users can only modify their own claims (limited fields)
  if (decodedToken.uid === targetUid) {
    return true;
  }

  return false;
}

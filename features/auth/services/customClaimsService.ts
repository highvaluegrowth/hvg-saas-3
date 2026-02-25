import { adminAuth } from '@/lib/firebase/admin';
import type { UserRole } from '../types/auth.types';

export interface CustomClaims {
  tenant_id?: string;
  role?: UserRole;
}

/**
 * Sets custom claims on a user's Firebase Auth token
 * @param uid - User ID
 * @param claims - Custom claims to set
 */
export async function setCustomClaims(uid: string, claims: CustomClaims): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, claims);
}

/**
 * Gets custom claims from a user's Firebase Auth token
 * @param uid - User ID
 * @returns Custom claims or null if user not found
 */
export async function getCustomClaims(uid: string): Promise<CustomClaims | null> {
  try {
    const user = await adminAuth.getUser(uid);
    return (user.customClaims as CustomClaims) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Removes custom claims from a user
 * @param uid - User ID
 */
export async function removeCustomClaims(uid: string): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, {});
}

import { adminDb } from '@/lib/firebase/admin';
import type { AppUser } from '@/shared/types';
import type { CreateAppUserInput, UpdateAppUserInput } from '../schemas/appUser.schemas';
import type { DecodedIdToken } from 'firebase-admin/auth';

const usersCol = () => adminDb.collection('users');

export const appUserService = {
  async create(uid: string, input: CreateAppUserInput): Promise<AppUser> {
    const now = new Date();
    const user: AppUser = {
      uid,
      email: input.email,
      displayName: input.displayName,
      residentId: null,
      tenantIds: input.tenantIds || [],
      preferences: input.preferences || [],
      sobrietyDate: null,
      recoveryGoals: [],
      notificationPreferences: { events: true, chores: true, rides: true, messages: true },
      createdAt: now,
      updatedAt: now,
    };

    if (input.photoURL) {
      user.photoURL = input.photoURL;
    }

    await usersCol().doc(uid).set(user);
    return user;
  },

  async getByUid(uid: string): Promise<AppUser | null> {
    const doc = await usersCol().doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      sobrietyDate: data.sobrietyDate?.toDate?.() ?? data.sobrietyDate ?? null,
    } as AppUser;
  },

  async update(uid: string, input: UpdateAppUserInput): Promise<void> {
    await usersCol().doc(uid).update({ ...input, updatedAt: new Date() });
  },

  async linkResident(uid: string, residentId: string): Promise<void> {
    await usersCol().doc(uid).update({ residentId, updatedAt: new Date() });
  },

  async getByEmail(email: string): Promise<AppUser | null> {
    const snap = await usersCol().where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      sobrietyDate: data.sobrietyDate?.toDate?.() ?? data.sobrietyDate ?? null,
    } as AppUser;
  },

  /**
   * JIT Provisioning: Finds an existing AppUser or creates one automatically 
   * using the Firebase Auth metadata from the decoded token.
   * Crucial for SaaS Operators (Admins, Staff) who log in via Google/Email 
   * but may not have a native /users/{uid} document yet.
   */
  async findOrCreate(decodedToken: DecodedIdToken): Promise<AppUser> {
    const existingUser = await this.getByUid(decodedToken.uid);
    if (existingUser) {
      return existingUser;
    }

    // Default to email prefix if name is missing from custom claims/auth token
    const fallbackName = decodedToken.email ? decodedToken.email.split('@')[0] : 'SaaS Operator';

    // Create new profile mapped to the Operator
    return this.create(decodedToken.uid, {
      email: decodedToken.email || '',
      displayName: decodedToken.name || fallbackName,
      photoURL: decodedToken.picture || undefined,
      // If the token claims a specific tenantId, array-wrap it to start their multi-tenant tracking
      tenantIds: decodedToken.tenantId ? [decodedToken.tenantId] : [],
    });
  }
};


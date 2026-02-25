import { adminDb } from '@/lib/firebase/admin';
import type { AppUser } from '@/shared/types';
import type { CreateAppUserInput, UpdateAppUserInput } from '../schemas/appUser.schemas';

const usersCol = () => adminDb.collection('users');

export const appUserService = {
  async create(uid: string, input: CreateAppUserInput): Promise<AppUser> {
    const now = new Date();
    const user: AppUser = {
      uid,
      email: input.email,
      displayName: input.displayName,
      photoURL: input.photoURL,
      residentId: null,
      sobrietyDate: null,
      recoveryGoals: [],
      notificationPreferences: { events: true, chores: true, rides: true, messages: true },
      createdAt: now,
      updatedAt: now,
    };
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
};

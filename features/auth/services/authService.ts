import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AuthError } from '@/lib/utils/errors';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const authService = {
  async register(credentials: RegisterCredentials): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      return userCredential;
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Registration failed',
        error.code
      );
    }
  },

  async login(credentials: LoginCredentials): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      return userCredential;
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Login failed',
        error.code
      );
    }
  },

  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      // Optional: provider.addScope('profile');
      // Optional: provider.addScope('email');
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential;
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Google login failed',
        error.code
      );
    }
  },

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Logout failed',
        error.code
      );
    }
  },

  async getCurrentUser() {
    return auth.currentUser;
  },

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  },
};

'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import type { User, AuthState, UserRole } from '../types/auth.types';

export interface UseAuthReturn extends AuthState {
  refreshToken: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const loadUserData = async (fbUser: FirebaseUser) => {
    try {
      // Get custom claims from ID token
      const idTokenResult = await fbUser.getIdTokenResult();

      const user: User = {
        uid: fbUser.uid,
        email: fbUser.email!,
        displayName: fbUser.displayName,
        tenantId: idTokenResult.claims.tenant_id as string | undefined,
        tenantIds: (idTokenResult.claims.tenant_ids as string[]) || [], // For multi-tenant operators
        role: idTokenResult.claims.role as UserRole | undefined,
      };

      setState({
        user,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        user: null,
        loading: false,
        error: error.message,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          await loadUserData(fbUser);
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        setState({
          user: null,
          loading: false,
          error: error.message,
        });
      }
    );

    return unsubscribe;
  }, []);

  const refreshToken = async () => {
    if (firebaseUser) {
      // Force token refresh to get updated custom claims
      await firebaseUser.getIdToken(true);
      await loadUserData(firebaseUser);
    }
  };

  return {
    ...state,
    refreshToken,
  };
}

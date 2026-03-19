'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { authService } from '../services/authService';
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
      const role = idTokenResult.claims.role as UserRole | undefined;
      const impersonatedId = role === 'super_admin' ? authService.getImpersonatedTenantId() : null;

      const user: User = {
        uid: fbUser.uid,
        email: fbUser.email!,
        displayName: fbUser.displayName,
        tenantId: impersonatedId || (idTokenResult.claims.tenant_id as string | undefined),
        tenantIds: (idTokenResult.claims.tenant_ids as string[]) || [], // For multi-tenant operators
        role,
        isImpersonating: !!impersonatedId,
      };

      setState({
        user,
        loading: false,
        error: null,
      });

      // Set a routing-hint cookie so Next.js edge middleware can redirect
      // unauthenticated/wrong-tenant requests before the page loads.
      // This is NOT a security token — real enforcement is Firestore rules + verifyAuthToken().
      if (typeof document !== 'undefined') {
        const sessionTenantId = user.tenantId ?? '';
        const sessionRole = user.role ?? 'resident';
        document.cookie = `hvg-session=${sessionTenantId}|${sessionRole}; path=/; SameSite=Strict; Max-Age=3600`;
      }
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
          // Clear the routing-hint cookie on sign-out
          if (typeof document !== 'undefined') {
            document.cookie = 'hvg-session=; path=/; Max-Age=0; SameSite=Strict';
          }
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

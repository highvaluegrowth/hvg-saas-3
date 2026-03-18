import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { saveAuthToken, clearAuthToken } from './tokenStore';
import type { AppUser } from '@shared/types/appUser';
import { userApi } from '../api/routes';

interface AuthState {
  firebaseUser: FirebaseAuthTypes.User | null;
  appUser: AppUser | null;
  loading: boolean;
  /** True while getMe() is in-flight — wait for this before routing */
  appUserLoading: boolean;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  appUserLoading: false,
  signOut: async () => { },
  refreshAppUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      clearRefreshInterval();

      if (user) {
        try {
          const token = await user.getIdToken(true); // force-refresh to pick up custom claims
          await saveAuthToken(token);

          // Refresh token every 55 minutes
          refreshIntervalRef.current = setInterval(async () => {
            try {
              const u = auth().currentUser;
              if (u) {
                const freshToken = await u.getIdToken(true);
                await saveAuthToken(freshToken);
              }
            } catch (err) {
              console.warn('[AuthContext] Background token refresh failed:', err);
            }
          }, 55 * 60 * 1000);

          // Unblock Firebase check immediately if we haven't already, then fetch profile
          setLoading(false);
          setAppUserLoading(true);
          const { user: au } = await userApi.getMe();
          setAppUser(au);
        } catch (err) {
          console.error('[AuthContext] Error initializing user:', err);
          setAppUser(null);
          setLoading(false);
        } finally {
          setAppUserLoading(false);
        }
      } else {
        await clearAuthToken();
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearRefreshInterval();
    };
  }, []);

  const signOut = async () => {
    clearRefreshInterval();
    await auth().signOut();
    await clearAuthToken();
    setAppUser(null);
  };

  const refreshAppUser = async () => {
    try {
      const { user } = await userApi.getMe();
      setAppUser(user);
    } catch (err) {
      console.error('[AuthContext] refreshAppUser failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, appUserLoading, signOut, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

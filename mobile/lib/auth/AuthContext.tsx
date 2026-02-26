import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { saveAuthToken, clearAuthToken } from './tokenStore';
import type { AppUser } from '@shared/types/appUser';
import { userApi } from '../api/routes';

interface AuthState {
  firebaseUser: FirebaseAuthTypes.User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  signOut: async () => { },
  refreshAppUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const token = await user.getIdToken();
        await saveAuthToken(token);
        // Refresh token every 55 minutes
        const refreshInterval = setInterval(async () => {
          const freshToken = await user.getIdToken(true);
          await saveAuthToken(freshToken);
        }, 55 * 60 * 1000);
        // Unblock app immediately — profile fetch runs in the background
        setLoading(false);
        try {
          const { user: au } = await userApi.getMe();
          setAppUser(au);
        } catch {
          setAppUser(null);
        }
        return () => clearInterval(refreshInterval);
      } else {
        await clearAuthToken();
        setAppUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await auth().signOut();
    await clearAuthToken();
    setAppUser(null);
  };

  const refreshAppUser = async () => {
    const { user } = await userApi.getMe();
    setAppUser(user);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, signOut, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

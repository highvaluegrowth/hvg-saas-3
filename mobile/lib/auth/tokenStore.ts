import * as SecureStore from 'expo-secure-store';
import auth from '@react-native-firebase/auth';

const TOKEN_KEY = 'hvg_auth_token';

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Returns a valid auth token, always preferring Firebase Auth as the source
 * of truth (which handles token expiry and auto-refresh internally).
 * SecureStore is updated on each successful Firebase fetch and used only
 * as a last-resort fallback when Firebase is unavailable.
 */
export async function getAuthToken(): Promise<string | null> {
  const currentUser = auth().currentUser;
  if (currentUser) {
    try {
      // getIdToken(false) returns cached token if still valid, auto-refreshes if expired
      const token = await currentUser.getIdToken(false);
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return token;
    } catch (err) {
      console.warn('[tokenStore] Firebase token refresh failed, falling back to store:', err);
    }
  }

  // Fallback: use stored token (e.g. Firebase not yet initialized, or offline)
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

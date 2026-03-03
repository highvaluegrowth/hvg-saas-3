import * as SecureStore from 'expo-secure-store';
import auth from '@react-native-firebase/auth';

const TOKEN_KEY = 'hvg_auth_token';

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Returns the saved auth token.
 * If SecureStore is empty (e.g. fresh install, cleared storage),
 * falls back to asking Firebase for a fresh token and saves it.
 */
export async function getAuthToken(): Promise<string | null> {
  let token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    const currentUser = auth().currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken(true);
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  }

  return token;
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

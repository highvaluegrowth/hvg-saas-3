import { Platform } from 'react-native';

// Android emulator routes localhost to 10.0.2.2, iOS simulator uses localhost
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Base URL of the Next.js backend (change for production)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:3000`;

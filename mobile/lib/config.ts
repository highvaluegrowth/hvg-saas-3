import { Platform } from 'react-native';

// Android emulator routes localhost to 10.0.2.2, iOS simulator uses localhost
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// In dev → local Next.js server. In production → highvaluegrowth.com.
// Override either with EXPO_PUBLIC_API_URL (e.g. in EAS secrets).
export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ??
    (__DEV__ ? `http://${DEV_HOST}:3000` : 'https://highvaluegrowth.com');

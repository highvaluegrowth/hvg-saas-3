import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function IndexPage() {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (firebaseUser) {
        const hasPreferences = appUser?.preferences && appUser.preferences.length > 0;
        const profileDone = appUser?.profileComplete === true;

        if (!hasPreferences) {
          // Step 1: no preferences yet → go to personalization
          router.replace('/(onboarding)/personalization');
        } else if (!profileDone) {
          // Step 2: has preferences but profile not yet built → profile builder
          router.replace('/(profile-builder)/faith' as any);
        } else {
          // Step 3: fully onboarded → main app
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [firebaseUser, appUser, loading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator color="#6366f1" />
    </View>
  );
}


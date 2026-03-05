import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function IndexPage() {
  const { firebaseUser, appUser, loading, appUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for BOTH Firebase auth check AND profile fetch to complete
    if (loading || appUserLoading) return;

    if (firebaseUser) {
      // Consider the user "onboarded" if they have any completion signal
      const hasPreferences = (appUser?.preferences?.length ?? 0) > 0;
      const isEnrolled = (appUser?.tenantIds?.length ?? 0) > 0;
      const profileDone = appUser?.profileComplete === true;

      if (hasPreferences || isEnrolled || profileDone) {
        // Already went through onboarding → main app
        router.replace('/(tabs)');
      } else {
        // Fresh user → start onboarding
        router.replace('/(onboarding)/personalization');
      }
    } else {
      router.replace('/login');
    }
  }, [firebaseUser, appUser, loading, appUserLoading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator color="#6366f1" />
    </View>
  );
}

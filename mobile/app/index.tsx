import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function IndexPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (firebaseUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [firebaseUser, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator color="#6366f1" />
    </View>
  );
}

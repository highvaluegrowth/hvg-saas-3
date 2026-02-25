import { Stack } from 'expo-router';

export default function TenantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerBackTitle: 'Back',
      }}
    />
  );
}

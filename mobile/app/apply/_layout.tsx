import { Stack } from 'expo-router';

export default function ApplyLayout() {
  return (
    <Stack>
      <Stack.Screen name="bed" options={{ title: 'Bed Application', headerShown: true }} />
      <Stack.Screen name="staff" options={{ title: 'Staff Application', headerShown: true }} />
    </Stack>
  );
}

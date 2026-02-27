import { Stack } from 'expo-router';

export default function LmsLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="[courseId]" options={{ title: 'Course Details' }} />
        </Stack>
    );
}

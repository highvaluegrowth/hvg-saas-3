import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from '@react-native-community/blur';

import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';
import { colors } from '@/lib/constants/theme';

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={20}
        reducedTransparencyFallbackColor={colors.bg.primary}
      />
    );
  }
  // Android: plain dark overlay (BlurView can be heavy on older devices)
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg.overlay }]}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const tabBarPaddingBottom = (Platform.OS === 'ios' ? 24 : 10) + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: colors.border.strong,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
          position: 'absolute',
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarActiveTintColor: colors.tab.active,
        tabBarInactiveTintColor: colors.tab.inactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        headerStyle: { backgroundColor: colors.bg.primary },
        headerTintColor: colors.text.primary,
      }}
    >
      {/* ── Visible tabs ─────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Hub',
          tabBarLabel: 'Hub',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="grid-view" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'HVG Outlet',
          tabBarLabel: 'Outlet',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-awesome" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lms"
        options={{
          title: 'LMS',
          tabBarLabel: 'LMS',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* ── Hidden tabs (accessible via router.push) ─── */}
      <Tabs.Screen name="admin"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="explore"  options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="activity" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="inbox"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="schedule" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="progress" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

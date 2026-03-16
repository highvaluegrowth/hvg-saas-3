import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

const ACTIVE = '#6366f1';
const INACTIVE = '#475569';
const BAR_BG = '#0a0f1e';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const tabBarPaddingBottom = (Platform.OS === 'ios' ? 24 : 10) + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: BAR_BG,
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
          position: 'absolute',
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        headerStyle: { backgroundColor: '#0a0f1e' },
        headerTintColor: '#f8fafc',
      }}
    >
      {/* ── Visible tabs ─────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'HVG Outlet',
          tabBarLabel: 'Outlet',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-awesome" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarLabel: 'Activity',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarLabel: 'Inbox',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inbox" size={size} color={color} />
          ),
        }}
      />

      {/* ── Hidden tabs (accessible via router.push) ─── */}
      <Tabs.Screen name="admin"     options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="lms"      options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="profile"  options={{ href: null }} />
    </Tabs>
  );
}

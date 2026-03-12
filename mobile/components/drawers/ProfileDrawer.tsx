import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.90;

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ visible, onClose }: ProfileDrawerProps) {
  const { appUser, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const sobrietyDays = appUser?.sobrietyDate
    ? Math.floor(
        (Date.now() - new Date(appUser.sobrietyDate as unknown as string).getTime()) /
          86400000
      )
    : null;

  const initials = appUser?.displayName
    ? appUser.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  function nav(path: string) {
    onClose();
    setTimeout(() => router.push(path as never), 250);
  }

  async function handleSignOut() {
    onClose();
    setTimeout(() => signOut(), 250);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Dim overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: insets.top + 16,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Avatar + name */}
        <View style={[styles.profile, { paddingHorizontal: 20 }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {appUser?.displayName ?? 'Resident'}
          </Text>
          {sobrietyDays !== null && (
            <View style={styles.sobrietyPill}>
              <Text style={styles.sobrietyText}>🏆 {sobrietyDays} days sober</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Scrollable nav */}
        <ScrollView
          style={styles.navScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.navContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          {/* ── My Profile ──────────────────────────── */}
          <SectionHeader label="My Profile" />
          <NavItem
            icon="person"
            label="Profile"
            onPress={() => nav('/(dashboard)/profile')}
          />
          <NavItem
            icon="assignment"
            label="My Applications"
            onPress={() => nav('/my-applications')}
          />
          <NavItem
            icon="school"
            label="My Courses"
            onPress={() => nav('/(tabs)/lms')}
          />
          <NavItem
            icon="calendar-today"
            label="Schedule"
            onPress={() => nav('/(tabs)/schedule')}
          />
          <NavItem
            icon="bar-chart"
            label="My Progress"
            onPress={() => nav('/(tabs)/activity')}
          />

          <View style={styles.divider} />

          {/* ── Profile Builder ──────────────────────── */}
          <SectionHeader label="Profile Builder" />
          <NavItem
            icon="emoji-events"
            label="Sobriety Status"
            onPress={() => nav('/profile-builder/sobriety')}
          />
          <NavItem
            icon="flag"
            label="Goals"
            onPress={() => nav('/profile-builder/goals')}
          />
          <NavItem
            icon="build"
            label="Capabilities"
            onPress={() => nav('/profile-builder/capabilities')}
          />
          <NavItem
            icon="favorite"
            label="Faith"
            onPress={() => nav('/profile-builder/faith')}
          />
          <NavItem
            icon="gavel"
            label="Morals"
            onPress={() => nav('/profile-builder/morals')}
          />
          <NavItem
            icon="local-pharmacy"
            label="Substances"
            onPress={() => nav('/profile-builder/substances')}
          />
          <NavItem
            icon="group"
            label="Demographics"
            onPress={() => nav('/profile-builder/demographics')}
          />

          <View style={styles.divider} />

          {/* ── Support ─────────────────────────────── */}
          <NavItem
            icon="help-outline"
            label="Support"
            onPress={() => nav('/support')}
          />

          <View style={styles.divider} />

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.75}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

function NavItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
      <MaterialIcons name={icon} size={22} color="#94a3b8" />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0a0f1e',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  profile: {
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sobrietyPill: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sobrietyText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sectionHeader: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  navLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});

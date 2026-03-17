import { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ visible, onClose }: SettingsDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateX = useMemo(() => new Animated.Value(DRAWER_WIDTH), []);
  const overlayOpacity = useMemo(() => new Animated.Value(0), []);

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
          toValue: DRAWER_WIDTH,
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
  }, [visible, translateX, overlayOpacity]);

  function nav(path: string) {
    onClose();
    setTimeout(() => router.push(path as never), 250);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Dim overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel — slides from right */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Account section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <NavItem
          icon="person-outline"
          label="Edit Profile"
          onPress={() => nav('/(dashboard)/profile')}
        />
        <NavItem
          icon="notifications-none"
          label="Notifications"
          onPress={() => nav('/settings/notifications')}
        />
        <NavItem
          icon="lock-outline"
          label="Privacy"
          onPress={() => nav('/settings/privacy')}
        />

        <View style={styles.divider} />

        {/* App section */}
        <Text style={styles.sectionLabel}>App</Text>
        <NavItem
          icon="info-outline"
          label="About HVG"
          onPress={() => nav('/settings/about')}
        />
        <NavItem
          icon="help-outline"
          label="Help & Support"
          onPress={() => nav('/support')}
        />
        <NavItem
          icon="description"
          label="Terms & Privacy"
          onPress={() => nav('/settings/terms')}
        />

        <View style={{ flex: 1 }} />

        {/* App version */}
        <Text style={styles.version}>HVG v1.0.0</Text>
      </Animated.View>
    </Modal>
  );
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
      <MaterialIcons name="chevron-right" size={18} color="#475569" style={styles.navChevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#0a0f1e',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  navLabel: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  navChevron: {
    marginLeft: 'auto',
  },
  version: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 4,
  },
});

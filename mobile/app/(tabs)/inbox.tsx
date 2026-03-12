import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 16;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="mark-email-unread" size={48} color="#4f46e5" />
        </View>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>
          Messages, notifications, and updates from your house and programs will appear here.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  badgeText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

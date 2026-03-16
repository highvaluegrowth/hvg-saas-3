import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
  const { appUser } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 16;

  const adminStats = [
    { label: 'Active Residents', value: '--', icon: 'people', color: '#6366f1' },
    { label: 'Pending Chores', value: '--', icon: 'assignment', color: '#10b981' },
    { label: 'Incidents (24h)', value: '--', icon: 'report-problem', color: '#ef4444' },
    { label: 'Bed Capacity', value: '--', icon: 'bed', color: '#0891b2' },
  ];

  return (
    <View style={styles.root}>
      <AppHeader title="Staff Dashboard" />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome, {appUser?.displayName?.split(' ')[0]}</Text>
          <Text style={styles.roleLabel}>Role: {appUser?.role?.replace('_', ' ')}</Text>
        </View>

        <View style={styles.statsGrid}>
          {adminStats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '22' }]}>
                <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operations</Text>
          <AdminAction 
            icon="people" 
            title="Resident Roster" 
            subtitle="View and manage current residents" 
          />
          <AdminAction 
            icon="assignment" 
            title="House Chores" 
            subtitle="Review chore completion status" 
          />
          <AdminAction 
            icon="add-alert" 
            title="Incident Reports" 
            subtitle="Draft or review incident logs" 
          />
          <AdminAction 
            icon="directions-car" 
            title="Ride Requests" 
            subtitle="Approve or assign transportation" 
          />
        </View>

        <View style={styles.placeholderCard}>
          <MaterialIcons name="construction" size={32} color="#64748b" />
          <Text style={styles.placeholderText}>
            Advanced administrative tools and real-time syncing are currently being integrated.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function AdminAction({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
      <View style={styles.actionIcon}>
        <MaterialIcons name={icon as any} size={24} color="#f8fafc" />
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#475569" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { flex: 1 },
  header: { padding: 20 },
  welcome: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  roleLabel: { fontSize: 14, color: '#10b981', fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 16, 
    gap: 12 
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  section: { padding: 20 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#94a3b8', 
    marginBottom: 16, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  actionSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  placeholderCard: {
    margin: 20,
    padding: 32,
    backgroundColor: '#1e293b55',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#334155',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});

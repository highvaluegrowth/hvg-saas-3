import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi, tenantApi, TenantHouse } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';
import { format } from 'date-fns';
import { AppHeader } from '@/components/AppHeader';
import { ProfileDrawer } from '@/components/drawers/ProfileDrawer';
import { SettingsDrawer } from '@/components/drawers/SettingsDrawer';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function HomeScreen() {
  const { appUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: userApi.getFeed,
  });

  // Fetch enrollments to determine if user is enrolled in a tenant
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: userApi.getEnrollments,
    staleTime: 5 * 60 * 1000,
  });

  // Find first active/approved enrollment
  const activeEnrollment = enrollmentsData?.enrollments?.find(
    (e) => e.status === 'active' || e.status === 'approved'
  ) ?? null;

  const enrolledTenantId = activeEnrollment?.tenantId ?? null;

  // Fetch houses for the enrolled tenant
  const { data: housesData } = useQuery({
    queryKey: ['myHouses', enrolledTenantId],
    queryFn: () => tenantApi.getHouses(enrolledTenantId!),
    enabled: !!enrolledTenantId,
    staleTime: 5 * 60 * 1000,
  });

  const myHouses: TenantHouse[] = housesData?.houses ?? [];

  const events = data?.events ?? [];
  const chores = data?.chores ?? [];

  const sobrietyDays = appUser?.sobrietyDate
    ? Math.floor(
        (Date.now() - new Date(appUser.sobrietyDate as unknown as string).getTime()) /
          86400000,
      )
    : null;

  const isAdmin = ['super_admin', 'admin', 'tenant_admin', 'staff_admin', 'staff', 'house_manager'].includes(appUser?.role || '');

  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 16;

  return (
    <View style={styles.root}>
      <AppHeader
        title="Dashboard"
        onProfilePress={() => setProfileOpen(true)}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Hi, {appUser?.displayName?.split(' ')[0] ?? 'there'} 👋
          </Text>
          {sobrietyDays !== null && (
            <View style={styles.sobrietyPill}>
              <Text style={styles.sobrietyText}>{sobrietyDays} days sober</Text>
            </View>
          )}
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administrative Tools</Text>
            <TouchableOpacity
              style={styles.applyCard}
              onPress={() => router.push('/(tabs)/admin' as any)}
              activeOpacity={0.75}
            >
              <Text style={styles.applyCardIcon}>🛡️</Text>
              <View style={styles.applyCardBody}>
                <Text style={styles.applyCardTitle}>Staff Dashboard</Text>
                <Text style={styles.applyCardSub}>Manage house operations & residents</Text>
              </View>
              <Text style={styles.applyCardArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My Houses — shown only when enrolled */}
        {enrolledTenantId && myHouses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Houses</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.housesRow}
            >
              {myHouses.map((house) => (
                <TouchableOpacity
                  key={house.id}
                  style={styles.houseCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(
                      `/tenants/${enrolledTenantId}/houses/${house.id}` as never
                    )
                  }
                >
                  <View style={styles.houseIconWrap}>
                    <MaterialIcons name="home" size={24} color="#6366f1" />
                  </View>
                  <Text style={styles.houseName} numberOfLines={2}>
                    {house.name}
                  </Text>
                  {(house.address?.city || house.address?.state) ? (
                    <Text style={styles.houseLocation} numberOfLines={1}>
                      {house.address?.city}
                      {house.address?.city && house.address?.state ? ', ' : ''}
                      {house.address?.state}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Section title="Upcoming Events">
          {isLoading ? (
            <LoadingRow />
          ) : events.length === 0 ? (
            <EmptyRow text="No upcoming events" />
          ) : (
            events.slice(0, 5).map((e) => (
              <View key={e.id} style={styles.card}>
                <Text style={styles.cardTitle}>{e.title}</Text>
                <Text style={styles.cardSub}>
                  {format(new Date(e.scheduledAt), 'EEE, MMM d · h:mm a')}
                </Text>
                {e.location ? <Text style={styles.cardMeta}>{e.location}</Text> : null}
              </View>
            ))
          )}
        </Section>

        <Section title="My Chores">
          {isLoading ? (
            <LoadingRow />
          ) : chores.length === 0 ? (
            <EmptyRow text="No pending chores" />
          ) : (
            chores.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.choreRow}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <StatusBadge status={c.status} />
                </View>
                {c.dueDate ? (
                  <Text style={styles.cardSub}>
                    Due {format(new Date(c.dueDate), 'MMM d')}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </Section>

        <Section title="Get Started">
          <TouchableOpacity
            style={styles.applyCard}
            onPress={() => router.push('/apply/bed')}
            activeOpacity={0.75}
          >
            <Text style={styles.applyCardIcon}>🛏️</Text>
            <View style={styles.applyCardBody}>
              <Text style={styles.applyCardTitle}>Find a Bed</Text>
              <Text style={styles.applyCardSub}>Apply for sober living placement</Text>
            </View>
            <Text style={styles.applyCardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyCard}
            onPress={() => router.push('/apply/staff')}
            activeOpacity={0.75}
          >
            <Text style={styles.applyCardIcon}>💼</Text>
            <View style={styles.applyCardBody}>
              <Text style={styles.applyCardTitle}>Staff Positions</Text>
              <Text style={styles.applyCardSub}>Apply to work at a sober living house</Text>
            </View>
            <Text style={styles.applyCardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyCard}
            onPress={() => router.push('/search')}
            activeOpacity={0.75}
          >
            <Text style={styles.applyCardIcon}>🔍</Text>
            <View style={styles.applyCardBody}>
              <Text style={styles.applyCardTitle}>Search Houses</Text>
              <Text style={styles.applyCardSub}>Browse sober living homes near you</Text>
            </View>
            <Text style={styles.applyCardArrow}>→</Text>
          </TouchableOpacity>
        </Section>

        <TouchableOpacity
          style={styles.discoverBtn}
          onPress={() => router.push('/tenants')}
        >
          <Text style={styles.discoverBtnText}>Discover Programs →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Drawers */}
      <ProfileDrawer visible={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LoadingRow() {
  return <Text style={styles.loadingText}>Loading…</Text>;
}

function EmptyRow({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#D946EF',
    in_progress: '#6366f1',
    done: '#22c55e',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[status] ?? '#64748b' }]}>
      <Text style={styles.badgeText}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { flex: 1, backgroundColor: '#0f172a' },
  greeting: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  greetingText: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  sobrietyPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  sobrietyText: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  cardSub: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  choreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  loadingText: { color: '#64748b', padding: 8 },
  emptyText: { color: '#475569', fontStyle: 'italic', padding: 8 },
  applyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  applyCardIcon: { fontSize: 22, marginRight: 12 },
  applyCardBody: { flex: 1 },
  applyCardTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  applyCardSub: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  applyCardArrow: { color: '#10b981', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  discoverBtn: {
    margin: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  discoverBtnText: { color: '#6366f1', fontWeight: '600', fontSize: 15 },

  // My Houses horizontal scroll
  housesRow: {
    paddingRight: 16,
    gap: 12,
  },
  houseCard: {
    width: 140,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  houseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#6366f122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseName: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
  houseLocation: { color: '#64748b', fontSize: 11 },
});

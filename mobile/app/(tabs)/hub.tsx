import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '@/lib/auth/AuthContext';
import { userApi, tenantApi, TenantHouse } from '@/lib/api/routes';
import { ChoreCard, ChoreItem } from '@/components/chores/ChoreCard';
import { colors } from '@/lib/constants/theme';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

// ─── My House Card ────────────────────────────────────────────────────────────

function HouseCard({ house }: { house: TenantHouse }) {
  return (
    <View style={styles.houseCard}>
      <View style={styles.houseIconWrap}>
        <MaterialIcons name="home" size={28} color={colors.primary.DEFAULT} />
      </View>
      <View style={styles.houseInfo}>
        <Text style={styles.houseName}>{house.name}</Text>
        {(house.address?.city || house.address?.state) ? (
          <Text style={styles.houseAddress}>
            {[house.address?.city, house.address?.state].filter(Boolean).join(', ')}
          </Text>
        ) : null}
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active Enrollment</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Hub Screen ───────────────────────────────────────────────────────────────

export default function HubScreen() {
  const { firebaseUser, appUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 16;

  // ── Enrollment + house (REST / React Query) ──────────────────
  const {
    data: enrollmentsData,
    isLoading: enrollLoading,
    refetch: refetchEnroll,
  } = useQuery({
    queryKey: ['enrollments'],
    queryFn: userApi.getEnrollments,
    staleTime: 5 * 60 * 1000,
  });

  const activeEnrollment =
    enrollmentsData?.enrollments?.find(
      (e: any) => e.status === 'active' || e.status === 'approved'
    ) ?? null;

  // Prefer enrollment tenantId, fall back to custom-claim tenantId
  const enrolledTenantId: string | null =
    activeEnrollment?.tenantId ?? (appUser as any)?.tenantId ?? null;

  const {
    data: housesData,
    isLoading: housesLoading,
    refetch: refetchHouses,
  } = useQuery({
    queryKey: ['myHouses', enrolledTenantId],
    queryFn: () => tenantApi.getHouses(enrolledTenantId!),
    enabled: !!enrolledTenantId,
    staleTime: 5 * 60 * 1000,
  });

  const myHouses: TenantHouse[] = housesData?.houses ?? [];

  // ── Real-time Firestore chores ────────────────────────────────
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [choresLoading, setChoresLoading] = useState(true);
  const [choresError, setChoresError] = useState(false);

  useEffect(() => {
    const uid = firebaseUser?.uid;
    const tenantId = enrolledTenantId;

    if (!uid || !tenantId) {
      setChores([]);
      setChoresLoading(false);
      return;
    }

    setChoresLoading(true);
    setChoresError(false);

    const unsub = firestore()
      .collection('tenants')
      .doc(tenantId)
      .collection('chores')
      .where('assigneeIds', 'array-contains', uid)
      .where('status', 'in', ['pending', 'in_progress'])
      .onSnapshot(
        (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          const items: ChoreItem[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              tenantId,
              title: d.title ?? 'Untitled Chore',
              description: d.description ?? '',
              status: d.status,
              priority: d.priority,
              dueDate: d.dueDate?.toDate?.() ?? null,
            };
          });
          setChores(items);
          setChoresLoading(false);
        },
        () => {
          setChoresError(true);
          setChoresLoading(false);
        }
      );

    return () => unsub();
  }, [firebaseUser?.uid, enrolledTenantId]);

  // ── Real-time active rides (for logistics badge) ──────────────
  const [activeRideCount, setActiveRideCount] = useState(0);

  useEffect(() => {
    const uid = firebaseUser?.uid;
    const tenantId = enrolledTenantId;
    if (!uid || !tenantId) { setActiveRideCount(0); return; }

    const unsub = firestore()
      .collection('tenants')
      .doc(tenantId)
      .collection('rides')
      .where('requestedBy', '==', uid)
      .where('status', 'in', ['pending_triage', 'requested', 'approved', 'in_progress'])
      .onSnapshot(
        (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          setActiveRideCount(snapshot.size);
        },
        () => {}
      );

    return () => unsub();
  }, [firebaseUser?.uid, enrolledTenantId]);

  // ── Pull-to-refresh (REST only; Firestore is real-time) ───────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEnroll(), refetchHouses()]);
    setIsRefreshing(false);
  };

  const houseLoading = enrollLoading || housesLoading;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────── */}
        <Text style={styles.pageTitle}>Hub</Text>
        <Text style={styles.pageSubtitle}>Your house & chores</Text>

        {/* ── My House ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY HOUSE</Text>

          {houseLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary.DEFAULT} size="small" />
            </View>
          ) : !enrolledTenantId ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="home" size={32} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No active enrollment</Text>
              <Text style={styles.emptyText}>Apply for a bed to get started.</Text>
            </View>
          ) : myHouses.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="meeting-room" size={32} color={colors.text.muted} />
              <Text style={styles.emptyText}>No house assignment found.</Text>
            </View>
          ) : (
            <HouseCard house={myHouses[0]} />
          )}
        </View>

        {/* ── My Chores ───────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>MY CHORES</Text>
            {!choresLoading && !choresError && chores.length > 0 && (
              <Text style={styles.choreCount}>{chores.length} pending</Text>
            )}
          </View>

          {choresLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary.DEFAULT} size="small" />
            </View>
          ) : choresError ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="wifi-off" size={28} color={colors.text.muted} />
              <Text style={styles.emptyText}>Could not load chores. Pull to retry.</Text>
            </View>
          ) : chores.length === 0 ? (
            <View style={styles.allDoneCard}>
              <MaterialIcons name="check-circle" size={36} color={colors.success.DEFAULT} />
              <Text style={styles.allDoneTitle}>All caught up!</Text>
              <Text style={styles.allDoneText}>No pending chores. Great work.</Text>
            </View>
          ) : (
            chores.map((chore) => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </View>

        {/* ── Logistics ───────────────────────────────────── */}
        {!!enrolledTenantId && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LOGISTICS</Text>

            {/* My Rides nav card */}
            <TouchableOpacity
              style={styles.logisticsCard}
              onPress={() => router.push('/logistics' as any)}
              activeOpacity={0.75}
            >
              <View style={styles.logisticsIconWrap}>
                <MaterialIcons name="directions-car" size={22} color={colors.primary.DEFAULT} />
              </View>
              <View style={styles.logisticsBody}>
                <Text style={styles.logisticsTitle}>My Rides</Text>
                <Text style={styles.logisticsSub}>
                  {activeRideCount > 0
                    ? `${activeRideCount} active request${activeRideCount !== 1 ? 's' : ''}`
                    : 'View & manage ride requests'}
                </Text>
              </View>
              {activeRideCount > 0 && (
                <View style={styles.rideBadge}>
                  <Text style={styles.rideBadgeText}>{activeRideCount}</Text>
                </View>
              )}
              <MaterialIcons name="chevron-right" size={20} color={colors.text.muted} />
            </TouchableOpacity>

            {/* Request a Ride quick action */}
            <TouchableOpacity
              style={styles.requestRideBtn}
              onPress={() => router.push('/logistics/ride-request' as any)}
              activeOpacity={0.75}
            >
              <MaterialIcons name="add" size={18} color={colors.primary.DEFAULT} />
              <Text style={styles.requestRideBtnText}>Request a Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 24,
  },

  // ── Section ────────────────────────────────────
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  choreCount: {
    fontSize: 12,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },

  // ── House Card ─────────────────────────────────
  houseCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  houseIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseInfo: {
    flex: 1,
    gap: 3,
  },
  houseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  houseAddress: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success.DEFAULT,
  },
  activeText: {
    fontSize: 11,
    color: colors.success.DEFAULT,
    fontWeight: '600',
  },

  // ── Loading / Empty States ─────────────────────
  loadingCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  emptyCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  allDoneCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.success.DEFAULT + '33',
  },
  allDoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.DEFAULT,
  },
  allDoneText: {
    fontSize: 13,
    color: colors.text.muted,
  },

  // ── Logistics ──────────────────────────────────
  logisticsCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginBottom: 8,
  },
  logisticsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary.glow,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logisticsBody: {
    flex: 1,
    gap: 2,
  },
  logisticsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  logisticsSub: {
    fontSize: 12,
    color: colors.text.muted,
  },
  rideBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rideBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  requestRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary.dark + '88',
  },
  requestRideBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isToday, isTomorrow } from 'date-fns';

import { useAuth } from '@/lib/auth/AuthContext';
import { userApi } from '@/lib/api/routes';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/theme';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RideDoc {
  id: string;
  destination: string;
  status: string;
  requestedAt: FirebaseFirestoreTypes.Timestamp | null;
  notes?: string;
  purpose?: string;
  driverId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending_triage: { label: 'Pending Approval', color: colors.primary.DEFAULT, icon: 'schedule' },
  requested:       { label: 'Requested',        color: colors.primary.DEFAULT, icon: 'schedule' },
  approved:        { label: 'Approved',          color: colors.success.DEFAULT, icon: 'check-circle' },
  in_progress:     { label: 'In Progress',       color: colors.success.DEFAULT, icon: 'directions-car' },
  completed:       { label: 'Completed',          color: colors.text.muted,      icon: 'done-all' },
  cancelled:       { label: 'Cancelled',          color: colors.text.muted,      icon: 'cancel' },
};

function formatRideTime(ts: FirebaseFirestoreTypes.Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, 'EEE, MMM d · h:mm a');
}

// ─── Ride Card ────────────────────────────────────────────────────────────────

function RideCard({ ride }: { ride: RideDoc }) {
  const meta = STATUS_META[ride.status] ?? { label: ride.status, color: colors.text.muted, icon: 'local-taxi' };
  const timeStr = formatRideTime(ride.requestedAt);

  return (
    <View style={styles.rideCard}>
      <View style={[styles.rideIconWrap, { backgroundColor: meta.color + '22' }]}>
        <MaterialIcons name={meta.icon as any} size={20} color={meta.color} />
      </View>

      <View style={styles.rideBody}>
        <Text style={styles.rideDestination} numberOfLines={1}>
          {ride.destination}
        </Text>
        {timeStr ? (
          <View style={styles.rideMeta}>
            <MaterialIcons name="schedule" size={12} color={colors.text.muted} />
            <Text style={styles.rideMetaText}>{timeStr}</Text>
          </View>
        ) : null}
        {ride.purpose ? (
          <Text style={styles.ridePurpose} numberOfLines={1}>{ride.purpose}</Text>
        ) : null}
        {ride.notes ? (
          <Text style={styles.rideNotes} numberOfLines={2}>{ride.notes}</Text>
        ) : null}
      </View>

      <View style={[styles.statusBadge, { borderColor: meta.color + '55' }]}>
        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </View>
  );
}

// ─── Logistics Screen ─────────────────────────────────────────────────────────

export default function LogisticsScreen() {
  const { firebaseUser, appUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 80; // FAB space

  const uid = firebaseUser?.uid ?? null;

  // Resolve tenantId
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: userApi.getEnrollments,
    staleTime: 5 * 60 * 1000,
  });
  const activeEnrollment =
    enrollmentsData?.enrollments?.find(
      (e: any) => e.status === 'active' || e.status === 'approved'
    ) ?? null;
  const tenantId: string | null =
    activeEnrollment?.tenantId ?? (appUser as any)?.tenantId ?? null;

  // Real-time rides listener
  const [rides, setRides] = useState<RideDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !tenantId) {
      setRides([]);
      setLoading(false);
      return;
    }

    const unsub = firestore()
      .collection('tenants')
      .doc(tenantId)
      .collection('rides')
      .where('requestedBy', '==', uid)
      .orderBy('requestedAt', 'desc')
      .limit(20)
      .onSnapshot(
        (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          const docs: RideDoc[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              destination: d.destination ?? 'Unknown destination',
              status: d.status ?? 'requested',
              requestedAt: d.requestedAt ?? null,
              notes: d.notes,
              purpose: d.purpose,
              driverId: d.driverId,
            };
          });
          setRides(docs);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

    return () => unsub();
  }, [uid, tenantId]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Rides</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
        </View>
      ) : !tenantId ? (
        <View style={styles.centered}>
          <MaterialIcons name="local-taxi" size={40} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No active enrollment</Text>
          <Text style={styles.emptyText}>Apply for a bed to request rides.</Text>
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="directions-car" size={40} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No ride requests yet</Text>
          <Text style={styles.emptyText}>Tap the button below to request a ride.</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RideCard ride={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Request Ride FAB */}
      {!!tenantId && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/logistics/ride-request' as any)}
            activeOpacity={0.85}
            accessibilityLabel="Request a ride"
            accessibilityRole="button"
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.fabLabel}>Request a Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },

  // Ride card
  rideCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  rideIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  rideBody: {
    flex: 1,
    gap: 4,
  },
  rideDestination: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rideMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideMetaText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  ridePurpose: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  rideNotes: {
    fontSize: 12,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Loading / Empty
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    minWidth: 200,
    backgroundColor: colors.primary.dark,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

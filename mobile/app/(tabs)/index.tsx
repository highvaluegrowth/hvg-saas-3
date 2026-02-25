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
import { userApi } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { appUser } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: userApi.getFeed,
  });

  const events = data?.events ?? [];
  const chores = data?.chores ?? [];

  const sobrietyDays = appUser?.sobrietyDate
    ? Math.floor((Date.now() - new Date(appUser.sobrietyDate as unknown as string).getTime()) / 86400000)
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hi, {appUser?.displayName?.split(' ')[0] ?? 'there'} 👋
        </Text>
        {sobrietyDays !== null && (
          <Text style={styles.sobriety}>{sobrietyDays} days sober</Text>
        )}
      </View>

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

      <TouchableOpacity
        style={styles.discoverBtn}
        onPress={() => router.push('/tenants')}
      >
        <Text style={styles.discoverBtnText}>Discover Programs →</Text>
      </TouchableOpacity>
    </ScrollView>
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
    pending: '#f59e0b',
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 24, paddingBottom: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  sobriety: { fontSize: 14, color: '#6366f1', marginTop: 4, fontWeight: '600' },
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
});

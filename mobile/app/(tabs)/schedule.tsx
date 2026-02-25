import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { userApi } from '@/lib/api/routes';
import { format } from 'date-fns';

export default function ScheduleScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: userApi.getFeed,
    staleTime: 2 * 60 * 1000,
  });

  const events = (data?.events ?? []).sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  // Group by date
  const grouped: Record<string, typeof events> = {};
  for (const e of events) {
    const key = format(new Date(e.scheduledAt), 'yyyy-MM-dd');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Schedule</Text>
      </View>
      {isLoading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : Object.entries(grouped).length === 0 ? (
        <Text style={styles.empty}>No upcoming events</Text>
      ) : (
        Object.entries(grouped).map(([dateKey, dayEvents]) => (
          <View key={dateKey} style={styles.dayGroup}>
            <Text style={styles.dateLabel}>
              {format(new Date(dateKey + 'T00:00:00'), 'EEEE, MMMM d')}
            </Text>
            {dayEvents.map((e) => (
              <View key={e.id} style={styles.eventCard}>
                <Text style={styles.eventTime}>
                  {format(new Date(e.scheduledAt), 'h:mm a')}
                </Text>
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle}>{e.title}</Text>
                  {e.location ? (
                    <Text style={styles.eventLocation}>{e.location}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 24, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  loading: { color: '#64748b', padding: 24 },
  empty: { color: '#475569', padding: 24, fontStyle: 'italic' },
  dayGroup: { padding: 16, paddingBottom: 0 },
  dateLabel: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  eventTime: { color: '#94a3b8', fontSize: 13, width: 64 },
  eventBody: { flex: 1 },
  eventTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  eventLocation: { color: '#64748b', fontSize: 12, marginTop: 2 },
});

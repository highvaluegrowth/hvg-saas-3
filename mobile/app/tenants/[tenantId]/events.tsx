import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { tenantApi } from '@/lib/api/routes';
import { format } from 'date-fns';

export default function TenantEventsScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['events', tenantId],
    queryFn: () => tenantApi.getEvents(tenantId),
  });

  const attendMutation = useMutation({
    mutationFn: (eventId: string) => tenantApi.attendEvent(tenantId, eventId),
    onSuccess: () => refetch(),
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Failed to RSVP';
      Alert.alert('Error', msg);
    },
  });

  return (
    <FlatList
      style={styles.container}
      data={data?.events ?? []}
      keyExtractor={(e) => e.id}
      refreshing={isLoading}
      onRefresh={refetch}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>No upcoming events</Text>
      }
      renderItem={({ item: e }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{e.title}</Text>
          <Text style={styles.time}>
            {format(new Date(e.scheduledAt), 'EEE, MMM d · h:mm a')}
          </Text>
          {e.location ? <Text style={styles.meta}>{e.location}</Text> : null}
          <View style={styles.footer}>
            <Text style={styles.attendees}>{e.attendeeCount} attending</Text>
            <TouchableOpacity
              style={styles.attendBtn}
              onPress={() => attendMutation.mutate(e.id)}
              disabled={attendMutation.isPending}
            >
              <Text style={styles.attendBtnText}>RSVP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 16 },
  empty: {
    color: '#475569',
    padding: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  title: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  time: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  meta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  attendees: { color: '#64748b', fontSize: 12 },
  attendBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  attendBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

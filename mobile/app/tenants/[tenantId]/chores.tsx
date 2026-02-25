import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const STATUS_OPTIONS = ['pending', 'in_progress', 'done'] as const;
type ChoreStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#6366f1',
  done: '#22c55e',
  overdue: '#ef4444',
};

export default function TenantChoresScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chores', tenantId],
    queryFn: () => tenantApi.getChores(tenantId),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      choreId,
      status,
    }: {
      choreId: string;
      status: string;
    }) => tenantApi.updateChoreStatus(tenantId, choreId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chores', tenantId] }),
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Update failed';
      Alert.alert('Error', msg);
    },
  });

  function promptStatus(choreId: string, current: string) {
    const options = STATUS_OPTIONS.filter((s) => s !== current);
    Alert.alert('Update Status', 'Mark chore as:', [
      ...options.map((s) => ({
        text: s.replace('_', ' '),
        onPress: () => statusMutation.mutate({ choreId, status: s }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <FlatList
      style={styles.container}
      data={data?.chores ?? []}
      keyExtractor={(c) => c.id}
      refreshing={isLoading}
      onRefresh={refetch}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>No chores assigned</Text>
      }
      renderItem={({ item: c }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => promptStatus(c.id, c.status)}
        >
          <View style={styles.row}>
            <Text style={styles.title}>{c.title}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: STATUS_COLORS[c.status] ?? '#64748b' },
              ]}
            >
              <Text style={styles.badgeText}>
                {c.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          {c.description ? (
            <Text style={styles.desc}>{c.description}</Text>
          ) : null}
          {c.dueDate ? (
            <Text style={styles.due}>Due {c.dueDate}</Text>
          ) : null}
          <Text style={styles.tap}>Tap to update status</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 16 },
  empty: {
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#f8fafc', fontSize: 15, fontWeight: '600', flex: 1 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  desc: { color: '#94a3b8', fontSize: 13, marginTop: 6 },
  due: { color: '#f59e0b', fontSize: 12, marginTop: 4 },
  tap: { color: '#475569', fontSize: 11, marginTop: 8, fontStyle: 'italic' },
});

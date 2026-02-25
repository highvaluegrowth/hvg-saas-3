import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { tenantApi } from '@/lib/api/routes';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  requested: '#f59e0b',
  scheduled: '#6366f1',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

export default function TenantRidesScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rides', tenantId],
    queryFn: () => tenantApi.getRides(tenantId),
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      tenantApi.requestRide(tenantId, {
        destination,
        requestedAt: new Date().toISOString(),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setShowModal(false);
      setDestination('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['rides', tenantId] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Request failed';
      Alert.alert('Error', msg);
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.rides ?? []}
        keyExtractor={(r) => r.id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No ride requests</Text>
        }
        renderItem={({ item: r }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.dest}>{r.destination}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: STATUS_COLORS[r.status] ?? '#64748b' },
                ]}
              >
                <Text style={styles.badgeText}>{r.status}</Text>
              </View>
            </View>
            <Text style={styles.time}>
              {format(new Date(r.requestedAt), 'MMM d, h:mm a')}
            </Text>
            {r.notes ? <Text style={styles.notes}>{r.notes}</Text> : null}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabText}>+ Request Ride</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request a Ride</Text>
            <TextInput
              style={styles.input}
              placeholder="Destination"
              placeholderTextColor="#64748b"
              value={destination}
              onChangeText={setDestination}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              placeholderTextColor="#64748b"
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!destination || requestMutation.isPending) && styles.submitBtnDisabled,
              ]}
              onPress={() => requestMutation.mutate()}
              disabled={!destination || requestMutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {requestMutation.isPending ? 'Sending…' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 16, paddingBottom: 96 },
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
  dest: { color: '#f8fafc', fontSize: 15, fontWeight: '600', flex: 1 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  time: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  notes: { color: '#64748b', fontSize: 13, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { color: '#64748b', textAlign: 'center', marginTop: 12 },
});

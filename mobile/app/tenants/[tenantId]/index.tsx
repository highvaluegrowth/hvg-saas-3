import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tenantApi, userApi } from '@/lib/api/routes';

export default function TenantDetailScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [message, setMessage] = useState('');
  const [requested, setRequested] = useState(false);

  const { data: tenantData } = useQuery({
    queryKey: ['tenants'],
    queryFn: tenantApi.list,
    select: (d) => d.tenants.find((t) => t.id === tenantId),
  });

  const { data: enrollData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: userApi.getEnrollments,
  });

  const alreadyEnrolled = enrollData?.enrollments.some(
    (e) => e.tenantId === tenantId
  );

  const joinMutation = useMutation({
    mutationFn: () =>
      tenantApi.requestJoin(tenantId, { message: message || undefined }),
    onSuccess: () => {
      setRequested(true);
      Alert.alert(
        'Request Sent',
        'Your join request has been submitted. Staff will review it shortly.'
      );
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Request failed';
      Alert.alert('Error', msg);
    },
  });

  if (!tenantData) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.name}>{tenantData.name}</Text>
        <Text style={styles.location}>
          {tenantData.city}, {tenantData.state}
        </Text>
      </View>

      {tenantData.description ? (
        <View style={styles.section}>
          <Text style={styles.description}>{tenantData.description}</Text>
        </View>
      ) : null}

      {alreadyEnrolled ? (
        <View style={styles.enrolled}>
          <Text style={styles.enrolledText}>✓ You are enrolled in this program</Text>
        </View>
      ) : requested ? (
        <View style={styles.enrolled}>
          <Text style={styles.enrolledText}>✓ Join request submitted</Text>
        </View>
      ) : (
        <View style={styles.joinSection}>
          <Text style={styles.joinTitle}>Request to Join</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Tell them a bit about yourself (optional)"
            placeholderTextColor="#64748b"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            <Text style={styles.joinBtnText}>
              {joinMutation.isPending ? 'Sending…' : 'Request to Join'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#64748b' },
  hero: { padding: 24 },
  name: { fontSize: 26, fontWeight: '700', color: '#f8fafc' },
  location: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 24, paddingBottom: 16 },
  description: { color: '#94a3b8', fontSize: 15, lineHeight: 22 },
  enrolled: {
    margin: 24,
    backgroundColor: '#134e4a',
    borderRadius: 12,
    padding: 16,
  },
  enrolledText: { color: '#34d399', fontWeight: '600', textAlign: 'center' },
  joinSection: { padding: 24 },
  joinTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  messageInput: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  joinBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

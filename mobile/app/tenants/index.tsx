import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { tenantApi } from '@/lib/api/routes';

export default function TenantsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: tenantApi.list,
  });
  const tenants = data?.tenants ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Programs</Text>
        <Text style={styles.subtitle}>Find a sober living program near you</Text>
      </View>
      {isLoading ? (
        <Text style={styles.loading}>Loading programs…</Text>
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No programs available yet</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/tenants/${item.id}`)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.location}>
                {item.city}, {item.state}
              </Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.cta}>View Program →</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 24, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  loading: { color: '#64748b', padding: 24 },
  list: { padding: 16 },
  empty: { color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: 16 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: { color: '#f8fafc', fontSize: 17, fontWeight: '700' },
  location: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  description: { color: '#64748b', fontSize: 13, marginTop: 6, lineHeight: 18 },
  cta: { color: '#6366f1', fontSize: 13, fontWeight: '600', marginTop: 10 },
});

import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { tenantApi, PublicTenant } from '@/lib/api/routes';

const CATEGORIES = ['All', 'Houses', 'Programs', 'Staff Jobs', 'Events'] as const;
type Category = (typeof CATEGORIES)[number];

export default function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['explore', 'tenants'],
    queryFn: tenantApi.list,
    staleTime: 5 * 60 * 1000,
  });

  const listings: PublicTenant[] = data?.tenants ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
      }
    >
      {/* Page title */}
      <Text style={styles.pageTitle}>Explore</Text>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, activeCategory === cat && styles.pillActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick-action cards */}
      <View style={styles.quickRow}>
        <QuickCard
          icon="bed"
          label="Find a Bed"
          color="#6366f1"
          onPress={() => router.push('/apply/bed')}
        />
        <QuickCard
          icon="work-outline"
          label="Staff Jobs"
          color="#0891b2"
          onPress={() => router.push('/apply/staff')}
        />
        <QuickCard
          icon="calendar-today"
          label="Events"
          color="#10b981"
          onPress={() => router.push('/(tabs)/schedule' as never)}
        />
        <QuickCard
          icon="school"
          label="Courses"
          color="#D946EF"
          onPress={() => router.push('/(tabs)/lms' as never)}
        />
      </View>

      {/* House listings */}
      <Text style={styles.sectionTitle}>Sober Living Houses</Text>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="home" size={40} color="#334155" />
          <Text style={styles.emptyText}>No listings available</Text>
          <Text style={styles.emptySubtext}>Check back soon for available houses</Text>
        </View>
      ) : (
        listings.map((tenant) => (
          <TouchableOpacity
            key={tenant.id}
            style={styles.houseCard}
            onPress={() => router.push(`/tenants/${tenant.id}` as never)}
            activeOpacity={0.8}
          >
            <View style={styles.houseCardInner}>
              <View style={styles.houseIconWrap}>
                <MaterialIcons name="business" size={28} color="#6366f1" />
              </View>
              <View style={styles.houseBody}>
                <Text style={styles.houseName} numberOfLines={1}>
                  {tenant.name}
                </Text>
                {tenant.city ? (
                  <Text style={styles.houseLocation} numberOfLines={1}>
                    {tenant.city}{tenant.state ? `, ${tenant.state}` : ''}
                  </Text>
                ) : null}
                {tenant.description ? (
                  <Text style={styles.houseDesc} numberOfLines={2}>
                    {tenant.description}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#475569" />
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Tenants / programs */}
      <TouchableOpacity
        style={styles.discoverBtn}
        onPress={() => router.push('/tenants')}
        activeOpacity={0.75}
      >
        <MaterialIcons name="business" size={18} color="#6366f1" />
        <Text style={styles.discoverBtnText}>View All Programs</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#6366f1" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function QuickCard({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickIcon, { backgroundColor: color + '22' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { paddingBottom: 120 },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },

  // Pills
  pillsScroll: { marginBottom: 20 },
  pillsRow: { paddingHorizontal: 20, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  pillText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  pillTextActive: { color: '#f8fafc' },

  // Quick cards
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { color: '#f8fafc', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // House cards
  houseCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  houseCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  houseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366f122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseBody: { flex: 1, gap: 3 },
  houseName: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  houseLocation: { color: '#64748b', fontSize: 13 },
  houseDesc: { color: '#94a3b8', fontSize: 12, marginTop: 2 },

  // Tags
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: { fontSize: 11, fontWeight: '600' },

  // States
  centered: { padding: 40, alignItems: 'center' },
  emptyState: {
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#64748b', fontSize: 13, textAlign: 'center' },

  // Discover
  discoverBtn: {
    margin: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  discoverBtnText: { color: '#6366f1', fontWeight: '600', fontSize: 15 },
});

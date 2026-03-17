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
import {
  tenantApi,
  houseApi,
  courseApi,
  eventsApi,
  PublicTenant,
  GlobalHouse,
  UniversalCourse,
  UniversalEvent,
} from '@/lib/api/routes';
import { AppHeader } from '@/components/AppHeader';
import { ProfileDrawer } from '@/components/drawers/ProfileDrawer';
import { SettingsDrawer } from '@/components/drawers/SettingsDrawer';
import { format } from 'date-fns';

const CATEGORIES = ['All', 'Houses', 'Programs', 'Staff Jobs', 'Events', 'Courses'] as const;
type Category = (typeof CATEGORIES)[number];

const PROGRAM_TAGS = [
  'Recovery',
  'Medication Assisted',
  'Faith-based',
  'LGBTQ+ Friendly',
  'Veteran Focused',
  'Women Only',
  'Men Only',
];

export default function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

  // Tenant query — used for All, Programs, Staff Jobs
  const tenantQuery = useQuery({
    queryKey: ['explore', 'tenants', activeTag],
    queryFn: () => tenantApi.list(activeTag || undefined),
    staleTime: 5 * 60 * 1000,
    enabled:
      activeCategory === 'All' ||
      activeCategory === 'Programs' ||
      activeCategory === 'Staff Jobs',
  });

  // Houses query — used for Houses pill
  const housesQuery = useQuery({
    queryKey: ['explore', 'houses'],
    queryFn: houseApi.listAll,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'Houses',
  });

  // Events query — used for Events pill
  const eventsQuery = useQuery({
    queryKey: ['explore', 'events'],
    queryFn: eventsApi.listUniversal,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'Events',
  });

  // Courses query — used for Courses pill
  const coursesQuery = useQuery({
    queryKey: ['explore', 'courses'],
    queryFn: courseApi.listUniversal,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'Courses',
  });

  const tenants: PublicTenant[] = tenantQuery.data?.tenants ?? [];
  const houses: GlobalHouse[] = housesQuery.data?.houses ?? [];
  const events: UniversalEvent[] = eventsQuery.data?.events ?? [];
  const courses: UniversalCourse[] = coursesQuery.data?.courses ?? [];

  // Filter tenants by search query
  const filteredTenants = tenants.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q) ||
      t.state?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  });

  // Filter houses by search query
  const filteredHouses = houses.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.name?.toLowerCase().includes(q) ||
      h.city?.toLowerCase().includes(q) ||
      h.state?.toLowerCase().includes(q) ||
      h.tenantName?.toLowerCase().includes(q)
    );
  });

  // Filter events by search query
  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title?.toLowerCase().includes(q) ||
      e.tenantName?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  });

  // Filter courses by search query
  const filteredCourses = courses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.tenantName?.toLowerCase().includes(q)
    );
  });

  // Derive loading + refetch for current pill
  const isLoading =
    activeCategory === 'Houses'
      ? housesQuery.isLoading
      : activeCategory === 'Events'
      ? eventsQuery.isLoading
      : activeCategory === 'Courses'
      ? coursesQuery.isLoading
      : tenantQuery.isLoading;

  const isRefetching =
    activeCategory === 'Houses'
      ? housesQuery.isRefetching
      : activeCategory === 'Events'
      ? eventsQuery.isRefetching
      : activeCategory === 'Courses'
      ? coursesQuery.isRefetching
      : tenantQuery.isRefetching;

  const refetch =
    activeCategory === 'Houses'
      ? housesQuery.refetch
      : activeCategory === 'Events'
      ? eventsQuery.refetch
      : activeCategory === 'Courses'
      ? coursesQuery.refetch
      : tenantQuery.refetch;

  // Section title per category
  const sectionTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (activeTag && (activeCategory === 'All' || activeCategory === 'Programs')) {
      return `${activeTag} Programs`;
    }
    switch (activeCategory) {
      case 'Houses': return 'Sober Living Houses';
      case 'Events': return 'Upcoming Events';
      case 'Courses': return 'Available Courses';
      case 'Programs': return 'Sober Living Programs';
      case 'Staff Jobs': return 'Staff Positions';
      default: return 'Sober Living Houses';
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Explore"
        searchMode={searchQuery.length > 0 || true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search houses, programs, events, courses..."
        onProfilePress={() => setProfileOpen(true)}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
        }
      >
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

        {/* Tag pills — only for Programs/All */}
        {(activeCategory === 'All' || activeCategory === 'Programs') && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.pillsRow, { marginBottom: 20, paddingTop: 0 }]}
          >
            <TouchableOpacity
              style={[styles.tagPill, !activeTag && styles.tagPillActive]}
              onPress={() => setActiveTag(null)}
            >
              <Text style={[styles.tagText, !activeTag && styles.tagTextActive]}>Any Type</Text>
            </TouchableOpacity>
            {PROGRAM_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagPill, activeTag === tag && styles.tagPillActive]}
                onPress={() => setActiveTag(tag)}
              >
                <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

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

        {/* Section title */}
        <Text style={styles.sectionTitle}>{sectionTitle()}</Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#6366f1" />
          </View>
        ) : (
          <>
            {/* Houses pill content */}
            {activeCategory === 'Houses' && (
              filteredHouses.length === 0 ? (
                <EmptyState searchQuery={searchQuery} emptyLabel="No houses available" />
              ) : (
                filteredHouses.map((house) => (
                  <TouchableOpacity
                    key={house.id}
                    style={styles.houseCard}
                    activeOpacity={0.8}
                  >
                    <View style={styles.houseCardInner}>
                      <View style={[styles.houseIconWrap, { backgroundColor: '#6366f122' }]}>
                        <MaterialIcons name="home" size={28} color="#6366f1" />
                      </View>
                      <View style={styles.houseBody}>
                        <Text style={styles.houseName} numberOfLines={1}>
                          {house.name}
                        </Text>
                        {(house.city || house.address?.city) ? (
                          <Text style={styles.houseLocation} numberOfLines={1}>
                            {house.city ?? house.address?.city}
                            {(house.state ?? house.address?.state) ? `, ${house.state ?? house.address?.state}` : ''}
                          </Text>
                        ) : null}
                        <Text style={styles.houseDesc} numberOfLines={1}>
                          {house.tenantName}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color="#475569" />
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}

            {/* Events pill content */}
            {activeCategory === 'Events' && (
              filteredEvents.length === 0 ? (
                <EmptyState searchQuery={searchQuery} emptyLabel="No events available" />
              ) : (
                filteredEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.houseCard}
                    onPress={() => router.push({
                      pathname: '/apply/event',
                      params: { eventId: event.id, title: event.title }
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.houseCardInner}>
                      <View style={[styles.houseIconWrap, { backgroundColor: '#10b98122' }]}>
                        <MaterialIcons name="event" size={28} color="#10b981" />
                      </View>
                      <View style={styles.houseBody}>
                        <Text style={styles.houseName} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.houseLocation} numberOfLines={1}>
                          {format(new Date(event.scheduledAt), 'EEE, MMM d · h:mm a')}
                        </Text>
                        <Text style={styles.houseDesc} numberOfLines={1}>
                          {event.tenantName}
                          {event.location ? ` · ${event.location}` : ''}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color="#475569" />
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}

            {/* Courses pill content */}
            {activeCategory === 'Courses' && (
              filteredCourses.length === 0 ? (
                <EmptyState searchQuery={searchQuery} emptyLabel="No courses available" />
              ) : (
                filteredCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={styles.houseCard}
                    onPress={() => router.push({
                      pathname: '/apply/course',
                      params: { courseId: course.id, title: course.title }
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.houseCardInner}>
                      <View style={[styles.houseIconWrap, { backgroundColor: '#D946EF22' }]}>
                        <MaterialIcons name="school" size={28} color="#D946EF" />
                      </View>
                      <View style={styles.houseBody}>
                        <Text style={styles.houseName} numberOfLines={1}>
                          {course.title}
                        </Text>
                        {course.description ? (
                          <Text style={styles.houseDesc} numberOfLines={2}>
                            {course.description}
                          </Text>
                        ) : null}
                        <Text style={styles.houseLocation} numberOfLines={1}>
                          {course.tenantName} · {course.totalLessons} lessons
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color="#475569" />
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}

            {/* Tenant cards — All, Programs, Staff Jobs */}
            {(activeCategory === 'All' || activeCategory === 'Programs' || activeCategory === 'Staff Jobs') && (
              filteredTenants.length === 0 ? (
                <EmptyState searchQuery={searchQuery} emptyLabel="No listings available" />
              ) : (
                filteredTenants.map((tenant) => (
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
              )
            )}
          </>
        )}

        {/* View all programs */}
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

      <ProfileDrawer visible={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

function EmptyState({ searchQuery, emptyLabel }: { searchQuery: string; emptyLabel: string }) {
  return (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={40} color="#334155" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No results found' : emptyLabel}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try a different search term' : 'Check back soon'}
      </Text>
    </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { paddingBottom: 120, paddingTop: 12 },

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

  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  tagPillActive: { borderColor: '#10b981', backgroundColor: '#10b98122' },
  tagText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tagTextActive: { color: '#10b981' },

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

  // House cards (shared style for all card types)
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

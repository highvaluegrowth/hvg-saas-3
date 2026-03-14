# Houses, Courses & Events Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix LMS lesson persistence; add global house browsing + "My Houses" on mobile; add course visibility field and full mobile course access (enroll/complete); add event visibility tiers and recurrence (web + mobile).

**Architecture:** Firestore field additions (no migrations needed, existing docs default gracefully); new mobile API endpoints (`/api/mobile/houses`, `/api/mobile/events`, `/api/mobile/courses`, enroll, complete); updated web forms; recurrence expanded client-side for display.

**Tech Stack:** Next.js 14 App Router, Firebase Admin SDK (`adminDb`), Expo 52 / React Native, TanStack Query, Zod.

---

## Task 1: Fix LMS — Curriculum Route Creates Lesson Stubs

**Files:**
- Modify: `app/api/tenants/[tenantId]/lms/courses/[courseId]/curriculum/route.ts`

**Root cause:** `PUT /curriculum` saves the `curriculum` array to the course document but never creates individual lesson Firestore documents. Lessons only get a document when opened individually in the lesson editor.

**Step 1: Open the curriculum route**

File: `app/api/tenants/[tenantId]/lms/courses/[courseId]/curriculum/route.ts`

Current code calls `courseService.saveCurriculum()` and returns. That's all.

**Step 2: Add lesson stub upsert loop after `saveCurriculum`**

Replace the route body with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { courseService, CurriculumModule } from '@/features/lms/services/courseService';
import { lessonService } from '@/features/lms/services/lessonService';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, courseId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const body = await request.json();
        const curriculum: CurriculumModule[] = body.curriculum;
        if (!Array.isArray(curriculum)) {
            return NextResponse.json({ error: 'curriculum must be an array' }, { status: 400 });
        }

        // Save the structure to the course document
        await courseService.saveCurriculum(tenantId, courseId, curriculum);

        // Ensure every lesson has a Firestore document (stub only — does NOT overwrite content)
        for (const module of curriculum) {
            for (const lesson of module.lessons) {
                await lessonService.upsert(tenantId, courseId, lesson.id, {
                    id: lesson.id,
                    courseId,
                    tenantId,
                    title: lesson.title,
                    type: lesson.type,
                    order: lesson.order,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
```

**Why this is safe:** `lessonService.upsert()` checks `existing.exists` before deciding whether to `set` (create) or `update` (metadata only). The stub data contains only `{ id, courseId, tenantId, title, type, order }` — it never touches `content`, `videoUrl`, `questions`, or `slides` on existing documents.

**Step 3: Test manually in web app**
1. Open LMS course builder
2. Add a module and two lessons
3. Click "Save Structure"
4. Check Firestore console → `tenants/{tenantId}/courses/{courseId}/lessons/` should now have documents for each lesson
5. Open a lesson in the editor → content should load (not blank)

**Step 4: Commit**

```bash
git add "app/api/tenants/[tenantId]/lms/courses/[courseId]/curriculum/route.ts"
git commit -m "fix: create lesson stubs when curriculum structure is saved"
```

---

## Task 2: Global Houses API Endpoint

**Files:**
- Create: `app/api/mobile/houses/route.ts`

Returns all houses across all tenants with `tenantName` attached. No tenant scope required — any authenticated user can call this.

**Step 1: Create the route**

```typescript
// app/api/mobile/houses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAuthToken(request);

    // Fetch all tenants for name lookup
    const tenantsSnap = await adminDb.collection('tenants').get();
    const tenantNames: Record<string, string> = {};
    for (const doc of tenantsSnap.docs) {
      const data = doc.data();
      tenantNames[doc.id] = data.name ?? doc.id;
    }

    // Fetch all houses across all tenants
    const houses: object[] = [];
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const housesSnap = await adminDb
        .collection(`tenants/${tenantId}/houses`)
        .get();
      for (const houseDoc of housesSnap.docs) {
        const data = houseDoc.data();
        houses.push({
          id: houseDoc.id,
          tenantId,
          tenantName: tenantNames[tenantId],
          name: data.name ?? '',
          address: data.address ?? null,
          city: data.address?.city ?? null,
          state: data.address?.state ?? null,
          capacity: data.capacity ?? 0,
          status: data.status ?? 'active',
        });
      }
    }

    return NextResponse.json({ houses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 2: Test**

```bash
curl -H "Authorization: Bearer <token>" https://localhost:3000/api/mobile/houses
# Expected: { houses: [...] }
```

**Step 3: Commit**

```bash
git add "app/api/mobile/houses/route.ts"
git commit -m "feat: add GET /api/mobile/houses — all houses across tenants"
```

---

## Task 3: Wire Explore "Houses" Pill + Home "My Houses" Section

**Files:**
- Modify: `mobile/lib/api/routes.ts`
- Modify: `mobile/app/(tabs)/explore.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`

### Part A — Add API methods to routes.ts

**Step 1: Add `GlobalHouse` interface and `housesApi.listAll()` to `mobile/lib/api/routes.ts`**

After the existing `houseApi` object, add:

```typescript
// Add to the interfaces section:
export interface GlobalHouse {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  address?: { street?: string; city?: string; state?: string; zip?: string } | null;
  city?: string | null;
  state?: string | null;
  capacity: number;
  status: string;
}

// Replace/extend houseApi:
export const houseApi = {
  houseDetail: (houseId: string, tenantId: string) =>
    api.get<{ house: HouseDetail }>(`/api/mobile/houses/${houseId}?tenantId=${tenantId}`),
  listAll: () =>
    api.get<{ houses: GlobalHouse[] }>('/api/mobile/houses'),
};
```

**Step 2: Add `courseApi` (universal courses, used in Task 8)**

```typescript
export const courseApi = {
  listUniversal: () =>
    api.get<{ courses: UniversalCourse[] }>('/api/mobile/courses'),
};

export interface UniversalCourse {
  id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  totalLessons: number;
  moduleCount: number;
  visibility: 'tenant' | 'universal';
}
```

**Step 3: Add `eventsApi` (universal events)**

```typescript
export const eventsApi = {
  listUniversal: () =>
    api.get<{ events: UniversalEvent[] }>('/api/mobile/events'),
};

export interface UniversalEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  location?: string;
  type?: string;
  visibility: 'universal';
}
```

**Step 4: Add enroll and lesson-complete methods to `lmsApi`**

```typescript
// Extend lmsApi with:
enroll: (tenantId: string, courseId: string) =>
  api.post<{ success: boolean }>(`/api/mobile/tenants/${tenantId}/courses/${courseId}/enroll`, {}),
completeLesson: (tenantId: string, courseId: string, lessonId: string) =>
  api.post<{ success: boolean }>(
    `/api/mobile/tenants/${tenantId}/courses/${courseId}/lessons/${lessonId}/complete`,
    {}
  ),
```

**Step 5: Commit routes.ts changes**

```bash
git add mobile/lib/api/routes.ts
git commit -m "feat: add globalHouses, universalCourses, universalEvents, enroll/complete API methods"
```

### Part B — Wire "Houses" category pill in Explore

**Step 6: Update `mobile/app/(tabs)/explore.tsx`**

The explore screen currently always shows tenant listings regardless of category. Update it so:
- `'Houses'` pill → fetch `houseApi.listAll()` → show house cards
- `'Events'` pill → fetch `eventsApi.listUniversal()` → show event cards
- `'Courses'` pill → fetch `courseApi.listUniversal()` → show course cards
- `'All'` / `'Programs'` / `'Staff Jobs'` → current behaviour (show tenants)

Replace the relevant parts of `explore.tsx`:

```typescript
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
import { tenantApi, houseApi, eventsApi, courseApi, PublicTenant, GlobalHouse, UniversalEvent, UniversalCourse } from '@/lib/api/routes';
import { AppHeader } from '@/components/AppHeader';
import { ProfileDrawer } from '@/components/drawers/ProfileDrawer';
import { SettingsDrawer } from '@/components/drawers/SettingsDrawer';
import { format } from 'date-fns';

const CATEGORIES = ['All', 'Houses', 'Programs', 'Staff Jobs', 'Events', 'Courses'] as const;
type Category = (typeof CATEGORIES)[number];

export default function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

  // Tenants (Programs / All / Staff Jobs)
  const tenantsQuery = useQuery({
    queryKey: ['explore', 'tenants'],
    queryFn: tenantApi.list,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'All' || activeCategory === 'Programs' || activeCategory === 'Staff Jobs',
  });

  // Houses
  const housesQuery = useQuery({
    queryKey: ['explore', 'houses'],
    queryFn: houseApi.listAll,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'Houses',
  });

  // Events
  const eventsQuery = useQuery({
    queryKey: ['explore', 'events'],
    queryFn: eventsApi.listUniversal,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'Events',
  });

  // Courses
  const coursesQuery = useQuery({
    queryKey: ['explore', 'courses'],
    queryFn: courseApi.listUniversal,
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'Courses',
  });

  const tenants: PublicTenant[] = tenantsQuery.data?.tenants ?? [];
  const houses: GlobalHouse[] = housesQuery.data?.houses ?? [];
  const events: UniversalEvent[] = eventsQuery.data?.events ?? [];
  const courses: UniversalCourse[] = coursesQuery.data?.courses ?? [];

  const isLoading =
    (activeCategory === 'All' || activeCategory === 'Programs' || activeCategory === 'Staff Jobs') ? tenantsQuery.isLoading :
    activeCategory === 'Houses' ? housesQuery.isLoading :
    activeCategory === 'Events' ? eventsQuery.isLoading :
    coursesQuery.isLoading;

  const handleRefresh = () => {
    if (activeCategory === 'Houses') housesQuery.refetch();
    else if (activeCategory === 'Events') eventsQuery.refetch();
    else if (activeCategory === 'Courses') coursesQuery.refetch();
    else tenantsQuery.refetch();
  };

  const isRefetching =
    tenantsQuery.isRefetching || housesQuery.isRefetching ||
    eventsQuery.isRefetching || coursesQuery.isRefetching;

  // Filter tenants by search
  const filteredTenants = tenants.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.city?.toLowerCase().includes(q);
  });

  const filteredHouses = houses.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.name?.toLowerCase().includes(q) || h.tenantName?.toLowerCase().includes(q) ||
      h.city?.toLowerCase().includes(q) || h.state?.toLowerCase().includes(q);
  });

  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.title?.toLowerCase().includes(q) || e.tenantName?.toLowerCase().includes(q);
  });

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.tenantName?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.root}>
      <AppHeader
        title="Explore"
        searchMode={true}
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
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#6366f1" />
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

        {/* Quick-action cards */}
        <View style={styles.quickRow}>
          <QuickCard icon="bed" label="Find a Bed" color="#6366f1" onPress={() => router.push('/apply/bed')} />
          <QuickCard icon="work-outline" label="Staff Jobs" color="#0891b2" onPress={() => router.push('/apply/staff')} />
          <QuickCard icon="calendar-today" label="Events" color="#10b981" onPress={() => setActiveCategory('Events')} />
          <QuickCard icon="school" label="Courses" color="#D946EF" onPress={() => setActiveCategory('Courses')} />
        </View>

        {/* --- Houses --- */}
        {activeCategory === 'Houses' && (
          <>
            <Text style={styles.sectionTitle}>Sober Living Houses</Text>
            {isLoading ? (
              <View style={styles.centered}><ActivityIndicator color="#6366f1" /></View>
            ) : filteredHouses.length === 0 ? (
              <EmptyState text={searchQuery ? 'No houses found' : 'No houses available'} />
            ) : (
              filteredHouses.map((house) => (
                <TouchableOpacity
                  key={`${house.tenantId}-${house.id}`}
                  style={styles.houseCard}
                  onPress={() => router.push(`/tenants/${house.tenantId}` as never)}
                  activeOpacity={0.8}
                >
                  <View style={styles.houseCardInner}>
                    <View style={styles.houseIconWrap}>
                      <MaterialIcons name="home" size={28} color="#6366f1" />
                    </View>
                    <View style={styles.houseBody}>
                      <Text style={styles.houseName} numberOfLines={1}>{house.name}</Text>
                      <Text style={styles.houseLocation} numberOfLines={1}>{house.tenantName}</Text>
                      {(house.city || house.state) ? (
                        <Text style={styles.houseDesc} numberOfLines={1}>
                          {[house.city, house.state].filter(Boolean).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => router.push('/apply/bed')}
                    >
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* --- Events --- */}
        {activeCategory === 'Events' && (
          <>
            <Text style={styles.sectionTitle}>Universal Events</Text>
            {isLoading ? (
              <View style={styles.centered}><ActivityIndicator color="#6366f1" /></View>
            ) : filteredEvents.length === 0 ? (
              <EmptyState text={searchQuery ? 'No events found' : 'No public events available'} />
            ) : (
              filteredEvents.map((event) => (
                <View key={`${event.tenantId}-${event.id}`} style={styles.houseCard}>
                  <View style={styles.houseCardInner}>
                    <View style={[styles.houseIconWrap, { backgroundColor: '#10b98122' }]}>
                      <MaterialIcons name="event" size={28} color="#10b981" />
                    </View>
                    <View style={styles.houseBody}>
                      <Text style={styles.houseName} numberOfLines={1}>{event.title}</Text>
                      <Text style={styles.houseLocation} numberOfLines={1}>{event.tenantName}</Text>
                      <Text style={styles.houseDesc} numberOfLines={1}>
                        {format(new Date(event.scheduledAt), 'MMM d · h:mm a')}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#475569" />
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* --- Courses --- */}
        {activeCategory === 'Courses' && (
          <>
            <Text style={styles.sectionTitle}>Universal Courses</Text>
            {isLoading ? (
              <View style={styles.centered}><ActivityIndicator color="#6366f1" /></View>
            ) : filteredCourses.length === 0 ? (
              <EmptyState text={searchQuery ? 'No courses found' : 'No public courses available'} />
            ) : (
              filteredCourses.map((course) => (
                <TouchableOpacity
                  key={`${course.tenantId}-${course.id}`}
                  style={styles.houseCard}
                  onPress={() => router.push(`/(tabs)/lms` as never)}
                  activeOpacity={0.8}
                >
                  <View style={styles.houseCardInner}>
                    <View style={[styles.houseIconWrap, { backgroundColor: '#D946EF22' }]}>
                      <MaterialIcons name="school" size={28} color="#D946EF" />
                    </View>
                    <View style={styles.houseBody}>
                      <Text style={styles.houseName} numberOfLines={1}>{course.title}</Text>
                      <Text style={styles.houseLocation} numberOfLines={1}>{course.tenantName}</Text>
                      <Text style={styles.houseDesc} numberOfLines={1}>
                        {course.totalLessons} lessons · {course.moduleCount} modules
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#475569" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* --- Tenants / All / Programs / Staff Jobs --- */}
        {(activeCategory === 'All' || activeCategory === 'Programs' || activeCategory === 'Staff Jobs') && (
          <>
            <Text style={styles.sectionTitle}>
              {searchQuery ? `Results for "${searchQuery}"` : 'Sober Living Programs'}
            </Text>
            {isLoading ? (
              <View style={styles.centered}><ActivityIndicator color="#6366f1" /></View>
            ) : filteredTenants.length === 0 ? (
              <EmptyState text={searchQuery ? 'No results found' : 'No listings available'} />
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
                      <Text style={styles.houseName} numberOfLines={1}>{tenant.name}</Text>
                      {tenant.city ? (
                        <Text style={styles.houseLocation} numberOfLines={1}>
                          {tenant.city}{tenant.state ? `, ${tenant.state}` : ''}
                        </Text>
                      ) : null}
                      {tenant.description ? (
                        <Text style={styles.houseDesc} numberOfLines={2}>{tenant.description}</Text>
                      ) : null}
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#475569" />
                  </View>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/tenants')} activeOpacity={0.75}>
              <MaterialIcons name="business" size={18} color="#6366f1" />
              <Text style={styles.discoverBtnText}>View All Programs</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#6366f1" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <ProfileDrawer visible={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

function QuickCard({ icon, label, color, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickIcon, { backgroundColor: color + '22' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={40} color="#334155" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { paddingBottom: 120, paddingTop: 12 },
  pillsScroll: { marginBottom: 20 },
  pillsRow: { paddingHorizontal: 20, gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  pillText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  pillTextActive: { color: '#f8fafc' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  quickCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 14, padding: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: '#f8fafc', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, paddingHorizontal: 20 },
  houseCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#1e293b', borderRadius: 14, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  houseCardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  houseIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#6366f122', alignItems: 'center', justifyContent: 'center' },
  houseBody: { flex: 1, gap: 3 },
  houseName: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  houseLocation: { color: '#64748b', fontSize: 13 },
  houseDesc: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  applyBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  centered: { padding: 40, alignItems: 'center' },
  emptyState: { marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 14, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  emptyText: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  discoverBtn: { margin: 20, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  discoverBtnText: { color: '#6366f1', fontWeight: '600', fontSize: 15 },
});
```

### Part C — Add "My Houses" section to Home tab

**Step 7: Update `mobile/app/(tabs)/index.tsx`**

Add a `useQuery` call for enrollments. If the user has an active enrollment with a `tenantId`, fetch and show their tenant's houses above the feed sections.

Add imports at top:
```typescript
import { userApi, tenantApi, TenantHouse } from '@/lib/api/routes';
```

Add after the existing `useQuery` for feed data:
```typescript
// Fetch enrollment to determine if user is a resident somewhere
const { data: enrollmentData } = useQuery({
  queryKey: ['enrollments'],
  queryFn: userApi.getEnrollments,
  staleTime: 10 * 60 * 1000,
});

const activeEnrollment = enrollmentData?.enrollments?.find(
  (e) => e.status === 'active' || e.status === 'approved'
);
const enrolledTenantId = activeEnrollment?.tenantId ?? null;

// Fetch houses for the enrolled tenant
const { data: housesData } = useQuery({
  queryKey: ['myHouses', enrolledTenantId],
  queryFn: () => tenantApi.getHouses(enrolledTenantId!),
  enabled: !!enrolledTenantId,
  staleTime: 10 * 60 * 1000,
});
const myHouses: TenantHouse[] = housesData?.houses ?? [];
```

Add a "My Houses" section just before "Upcoming Events":
```typescript
{/* My Houses — only shown when user has active enrollment */}
{myHouses.length > 0 && (
  <Section title="My Houses">
    {myHouses.map((house) => (
      <TouchableOpacity
        key={house.id}
        style={styles.card}
        onPress={() => router.push(`/tenants/${enrolledTenantId}` as never)}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>{house.name}</Text>
        {house.address?.city ? (
          <Text style={styles.cardSub}>
            {[house.address.city, house.address.state].filter(Boolean).join(', ')}
          </Text>
        ) : null}
        <Text style={styles.cardMeta}>Capacity: {house.capacity}</Text>
      </TouchableOpacity>
    ))}
  </Section>
)}
```

**Step 8: Commit**

```bash
git add mobile/lib/api/routes.ts "mobile/app/(tabs)/explore.tsx" "mobile/app/(tabs)/index.tsx"
git commit -m "feat: wire Houses/Events/Courses explore pills; add My Houses to home tab"
```

---

## Task 4: Course Visibility — Rename `isPublic` → `visibility`

**Files:**
- Modify: `features/lms/services/courseService.ts`

**Step 1: Update `CourseDoc` and `courseService` in `features/lms/services/courseService.ts`**

Replace `isPublic: boolean` with `visibility: 'tenant' | 'universal'` throughout:

```typescript
export interface CourseDoc {
  id: string;
  ownerTenantId: string;
  title: string;
  description: string;
  visibility: 'tenant' | 'universal';  // was: isPublic: boolean
  published: boolean;
  curriculum: CurriculumModule[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

Update `create()`:
```typescript
async create(tenantId: string, uid: string, payload: { title: string; description: string; visibility: 'tenant' | 'universal' }): Promise<CourseDoc> {
  const now = new Date().toISOString();
  const docRef = coursesRef(tenantId).doc();
  const course: CourseDoc = {
    id: docRef.id,
    ownerTenantId: tenantId,
    title: payload.title,
    description: payload.description,
    visibility: payload.visibility,
    published: false,
    curriculum: [],
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(course);
  return course;
},
```

Update `update()`:
```typescript
async update(tenantId: string, courseId: string, updates: Partial<Pick<CourseDoc, 'title' | 'description' | 'visibility' | 'published'>>): Promise<void> {
  await coursesRef(tenantId).doc(courseId).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
},
```

**Step 2: Update course create API route** — find `app/api/tenants/[tenantId]/lms/courses/route.ts` (the POST handler). Change it to read `visibility` instead of `isPublic`:

```typescript
// In the POST handler body parsing:
const { title, description, visibility = 'tenant' } = body;
// Pass to courseService:
await courseService.create(tenantId, token.uid, { title, description, visibility });
```

**Step 3: Update course create page** — `app/(dashboard)/[tenantId]/lms/create/page.tsx`

Change the `isPublic` checkbox to a visibility selector:

```tsx
// Replace the isPublic checkbox with:
<div>
  <label className="block text-sm font-medium text-white/80 mb-2">
    Access
  </label>
  <div className="flex gap-3">
    {[
      { value: 'tenant', label: 'Tenant Only', desc: 'Only residents of your houses' },
      { value: 'universal', label: 'Universal Access', desc: 'Any logged-in user' },
    ].map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => setVisibility(opt.value as 'tenant' | 'universal')}
        className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
          visibility === opt.value
            ? 'border-cyan-500 bg-cyan-500/10 text-white'
            : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        <div className="font-medium text-sm">{opt.label}</div>
        <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
      </button>
    ))}
  </div>
</div>
```

Add `const [visibility, setVisibility] = useState<'tenant' | 'universal'>('tenant');` to the component state.

Change the submit body to send `visibility` instead of `isPublic`.

**Step 4: Commit**

```bash
git add features/lms/services/courseService.ts
git add "app/api/tenants/[tenantId]/lms/courses/route.ts"
git add "app/(dashboard)/[tenantId]/lms/create/page.tsx"
git commit -m "feat: rename course isPublic → visibility with tenant/universal options"
```

---

## Task 5: Universal Courses Endpoint

**Files:**
- Create: `app/api/mobile/courses/route.ts`

Returns all courses with `visibility: 'universal'` across all tenants.

**Step 1: Create the route**

```typescript
// app/api/mobile/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAuthToken(request);

    const tenantsSnap = await adminDb.collection('tenants').get();

    const courses: object[] = [];
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const tenantName = (tenantDoc.data().name as string) ?? tenantId;

      // Only fetch published universal courses
      const coursesSnap = await adminDb
        .collection(`tenants/${tenantId}/courses`)
        .where('visibility', '==', 'universal')
        .where('published', '==', true)
        .get();

      for (const courseDoc of coursesSnap.docs) {
        const data = courseDoc.data();
        const curriculum = (data.curriculum ?? []) as Array<{ lessons: unknown[] }>;
        const totalLessons = curriculum.reduce((sum: number, m: { lessons: unknown[] }) => sum + (m.lessons?.length ?? 0), 0);

        courses.push({
          id: courseDoc.id,
          tenantId,
          tenantName,
          title: data.title ?? '',
          description: data.description ?? '',
          totalLessons,
          moduleCount: curriculum.length,
          visibility: 'universal',
        });
      }
    }

    return NextResponse.json({ courses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 2: Commit**

```bash
git add "app/api/mobile/courses/route.ts"
git commit -m "feat: add GET /api/mobile/courses — universal courses across all tenants"
```

---

## Task 6: Course Enroll Endpoint

**Files:**
- Create: `app/api/mobile/tenants/[tenantId]/courses/[courseId]/enroll/route.ts`

**Step 1: Create the route**

```typescript
// app/api/mobile/tenants/[tenantId]/courses/[courseId]/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, courseId } = await params;
    const userId = token.uid;

    // Verify course exists and is accessible
    const courseDoc = await adminDb
      .collection(`tenants/${tenantId}/courses`)
      .doc(courseId)
      .get();

    if (!courseDoc.exists) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courseDoc.data()!;

    // Check visibility: universal courses are open to all; tenant courses require enrollment
    if (course.visibility === 'tenant') {
      // User must have an active enrollment in this tenant
      const enrollSnap = await adminDb
        .collection('users')
        .doc(userId)
        .collection('enrollments')
        .where('tenantId', '==', tenantId)
        .where('status', 'in', ['active', 'approved'])
        .limit(1)
        .get();

      if (enrollSnap.empty) {
        return NextResponse.json({ error: 'Not enrolled in this tenant' }, { status: 403 });
      }
    }

    const now = new Date().toISOString();
    // Write enrollment record to user's subcollection
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('courseEnrollments')
      .doc(courseId)
      .set({
        courseId,
        tenantId,
        status: 'enrolled',
        progress: 0,
        completedLessons: [],
        enrolledAt: now,
        updatedAt: now,
      }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 2: Commit**

```bash
git add "app/api/mobile/tenants/[tenantId]/courses/[courseId]/enroll/route.ts"
git commit -m "feat: add POST course enroll endpoint — writes to users/{uid}/courseEnrollments"
```

---

## Task 7: Lesson Complete Endpoint

**Files:**
- Create: `app/api/mobile/tenants/[tenantId]/courses/[courseId]/lessons/[lessonId]/complete/route.ts`

**Step 1: Create the route**

```typescript
// app/api/mobile/tenants/[tenantId]/courses/[courseId]/lessons/[lessonId]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; courseId: string; lessonId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, courseId, lessonId } = await params;
    const userId = token.uid;

    const enrollmentRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('courseEnrollments')
      .doc(courseId);

    const enrollmentDoc = await enrollmentRef.get();
    if (!enrollmentDoc.exists) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Add lessonId to completedLessons array (idempotent via arrayUnion)
    await enrollmentRef.update({
      completedLessons: FieldValue.arrayUnion(lessonId),
      updatedAt: new Date().toISOString(),
    });

    // Recalculate progress
    const updatedDoc = await enrollmentRef.get();
    const completed: string[] = updatedDoc.data()?.completedLessons ?? [];

    // Get total lesson count from course curriculum
    const courseDoc = await adminDb
      .collection(`tenants/${tenantId}/courses`)
      .doc(courseId)
      .get();
    const curriculum = (courseDoc.data()?.curriculum ?? []) as Array<{ lessons: unknown[] }>;
    const totalLessons = curriculum.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
    const progress = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;
    const status = progress >= 100 ? 'completed' : 'in_progress';

    await enrollmentRef.update({ progress, status, updatedAt: new Date().toISOString() });

    return NextResponse.json({ success: true, progress, status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 2: Commit**

```bash
git add "app/api/mobile/tenants/[tenantId]/courses/[courseId]/lessons/[lessonId]/complete/route.ts"
git commit -m "feat: add POST lesson complete endpoint — tracks progress per user"
```

---

## Task 8: Update Mobile LMS — Enroll Button + Progress Bar

**Files:**
- Modify: `mobile/app/(tabs)/lms/index.tsx`
- Modify or Create: `mobile/app/(tabs)/lms/[courseId]/index.tsx` (or `[courseId].tsx`)

The LMS index screen already distinguishes enrolled vs available courses. It needs an Enroll button on unenrolled courses, and a Mark Complete button in lesson view.

**Step 1: Find the course detail screen**

Check if `mobile/app/(tabs)/lms/[courseId].tsx` or `mobile/app/(tabs)/lms/[courseId]/index.tsx` exists. Read it and add:
- If `enrolled === false` → show "Enroll Now" button → calls `lmsApi.enroll(tenantId, courseId)` → on success, refetch course
- Progress bar if `progress > 0`

**Step 2: Enroll mutation pattern**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lmsApi } from '@/lib/api/routes';

const queryClient = useQueryClient();

const enrollMutation = useMutation({
  mutationFn: () => lmsApi.enroll(course.tenantId, course.id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lms', 'courses'] });
  },
});
```

**Step 3: Find the lesson screen**

Check `mobile/app/(tabs)/lms/[courseId]/[lessonId].tsx`. Add "Mark Complete" button at the bottom:

```typescript
const completeMutation = useMutation({
  mutationFn: () => lmsApi.completeLesson(tenantId, courseId, lessonId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lms', 'courses'] });
    router.back();
  },
});

// In render:
<TouchableOpacity
  style={styles.completeBtn}
  onPress={() => completeMutation.mutate()}
  disabled={completeMutation.isPending}
>
  <Text style={styles.completeBtnText}>
    {completeMutation.isPending ? 'Saving...' : '✓ Mark Complete'}
  </Text>
</TouchableOpacity>
```

**Step 4: Commit**

```bash
git add "mobile/app/(tabs)/lms/"
git commit -m "feat: add enroll button and mark-complete button in mobile LMS"
```

---

## Task 9: Event Types + Schema Updates

**Files:**
- Modify: `features/events/types/event.types.ts`
- Modify: `features/events/schemas/event.schemas.ts`

**Step 1: Update `features/events/types/event.types.ts`**

Add `visibility`, `houseId`, and expand `recurrence` to match design doc:

```typescript
import { BaseDocument } from '@/lib/firestore/types';

export type ProgramEventType =
  | 'group_meeting' | 'house_meeting' | 'class' | 'course'
  | 'na_meeting' | 'aa_meeting' | 'church' | 'bible_study'
  | 'therapy_session' | 'job_training' | 'community_service' | 'outing' | 'other';

export type EventVisibility = 'universal' | 'tenant' | 'house';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type RecurrenceDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type RecurrenceEndType = 'never' | 'after' | 'on_date';

export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  days?: RecurrenceDay[];        // used when frequency = 'custom'
  endType: RecurrenceEndType;
  endAfter?: number;             // N occurrences (when endType = 'after')
  endDate?: string;              // ISO date string (when endType = 'on_date')
}

export interface ProgramEvent extends BaseDocument {
  tenantId: string;
  title: string;
  description?: string;
  type: ProgramEventType;
  houseIds: string[];            // existing field — houses assigned to this event
  visibility: EventVisibility;   // NEW — default 'tenant'
  houseId?: string;              // NEW — required when visibility = 'house'
  scheduledAt: Date;
  duration: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;  // UPDATED shape
  attendeeIds: string[];
  createdBy: string;
  coverImageUrl?: string;
}

export interface CreateProgramEventInput {
  title: string;
  description?: string;
  type: ProgramEventType;
  houseIds?: string[];
  visibility?: EventVisibility;
  houseId?: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  coverImageUrl?: string;
}

export interface UpdateProgramEventInput {
  title?: string;
  description?: string;
  type?: ProgramEventType;
  houseIds?: string[];
  visibility?: EventVisibility;
  houseId?: string;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  facilitator?: string;
  recurrence?: EventRecurrence;
  attendeeIds?: string[];
}
```

**Step 2: Update `features/events/schemas/event.schemas.ts`**

```typescript
import { z } from 'zod';

export const EventRecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  endType: z.enum(['never', 'after', 'on_date']),
  endAfter: z.number().int().positive().optional(),
  endDate: z.string().optional(), // ISO date string
});

const EventVisibilitySchema = z.enum(['universal', 'tenant', 'house']).default('tenant');

export const CreateProgramEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['group_meeting', 'house_meeting', 'class', 'course', 'na_meeting', 'aa_meeting', 'church', 'bible_study', 'therapy_session', 'job_training', 'community_service', 'outing', 'other']),
  houseIds: z.array(z.string()).default([]),
  visibility: EventVisibilitySchema,
  houseId: z.string().optional(),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().min(1),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recurrence: EventRecurrenceSchema.optional(),
  coverImageUrl: z.string().optional(),
}).refine(
  (data) => data.visibility !== 'house' || !!data.houseId,
  { message: 'houseId is required when visibility is "house"', path: ['houseId'] }
);

export const UpdateProgramEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['group_meeting', 'house_meeting', 'class', 'course', 'na_meeting', 'aa_meeting', 'church', 'bible_study', 'therapy_session', 'job_training', 'community_service', 'outing', 'other']).optional(),
  houseIds: z.array(z.string()).optional(),
  visibility: EventVisibilitySchema.optional(),
  houseId: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().min(1).optional(),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recurrence: EventRecurrenceSchema.optional(),
  attendeeIds: z.array(z.string()).optional(),
});

export type CreateProgramEventInput = z.infer<typeof CreateProgramEventSchema>;
export type UpdateProgramEventInput = z.infer<typeof UpdateProgramEventSchema>;
```

**Step 3: Commit**

```bash
git add features/events/types/event.types.ts features/events/schemas/event.schemas.ts
git commit -m "feat: add visibility + houseId + recurrence fields to event types/schemas"
```

---

## Task 10: Event Create Form — Visibility + Recurrence UI

**Files:**
- Modify: `app/(dashboard)/[tenantId]/events/new/page.tsx`

This is the largest UI change. Add visibility selector (3 options, house picker when house-only selected) and recurrence controls below the existing form fields.

**Step 1: Extend `FormData` interface and defaults**

```typescript
interface FormData {
  title: string;
  description: string;
  type: ProgramEventType;
  scheduledAt: string;
  duration: string;
  location: string;
  facilitator: string;
  // NEW
  visibility: 'universal' | 'tenant' | 'house';
  houseId: string;
  // Recurrence
  repeats: boolean;
  recurrenceFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  recurrenceDays: string[];         // ['mon','tue',...]
  recurrenceEndType: 'never' | 'after' | 'on_date';
  recurrenceEndAfter: string;       // string for input, parse to number on submit
  recurrenceEndDate: string;
}

const DEFAULT_FORM: FormData = {
  title: '',
  description: '',
  type: 'group_meeting',
  scheduledAt: '',
  duration: '60',
  location: '',
  facilitator: '',
  visibility: 'tenant',
  houseId: '',
  repeats: false,
  recurrenceFrequency: 'weekly',
  recurrenceDays: [],
  recurrenceEndType: 'never',
  recurrenceEndAfter: '',
  recurrenceEndDate: '',
};
```

Note: Since `repeats` and `recurrenceDays` are boolean/array (not string), they need separate state. Use separate `useState` for them and for the house list:

```typescript
const [repeats, setRepeats] = useState(false);
const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
const [showAdvancedRecurrence, setShowAdvancedRecurrence] = useState(false);
const [houses, setHouses] = useState<{ id: string; name: string }[]>([]);
const [loadingHouses, setLoadingHouses] = useState(false);
```

**Step 2: Load houses when visibility = 'house' is selected**

```typescript
async function loadHouses() {
  if (houses.length > 0) return;
  setLoadingHouses(true);
  try {
    const token = await authService.getIdToken();
    const res = await fetch(`/api/tenants/${tenantId}/houses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setHouses(data.houses ?? []);
  } finally {
    setLoadingHouses(false);
  }
}
```

**Step 3: Add visibility UI section (paste below Cover Image, above submit buttons)**

```tsx
{/* Visibility */}
<div>
  <label className="block text-sm font-medium text-white/80 mb-2">Who can see this event?</label>
  <div className="flex flex-col gap-2">
    {[
      { value: 'tenant', label: 'Tenant Only', desc: 'Residents of any of your houses (default)' },
      { value: 'universal', label: 'Universal Access', desc: 'Any logged-in app user' },
      { value: 'house', label: 'House Only', desc: 'Residents of one specific house' },
    ].map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => {
          handleChange('visibility', opt.value);
          if (opt.value === 'house') loadHouses();
        }}
        className={`rounded-lg border p-3 text-left transition-colors ${
          formData.visibility === opt.value
            ? 'border-cyan-500 bg-cyan-500/10 text-white'
            : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        <div className="font-medium text-sm">{opt.label}</div>
        <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
      </button>
    ))}
  </div>

  {/* House picker when visibility = 'house' */}
  {formData.visibility === 'house' && (
    <div className="mt-3">
      {loadingHouses ? (
        <p className="text-sm text-white/50">Loading houses...</p>
      ) : (
        <Select
          label="Select House"
          options={houses.map(h => ({ value: h.id, label: h.name }))}
          value={formData.houseId}
          onChange={(e) => handleChange('houseId', e.target.value)}
        />
      )}
    </div>
  )}
</div>

{/* Recurrence */}
<div>
  <div className="flex items-center gap-3 mb-3">
    <label className="text-sm font-medium text-white/80">Repeats</label>
    <button
      type="button"
      onClick={() => setRepeats(!repeats)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        repeats ? 'bg-cyan-600' : 'bg-white/10'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        repeats ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  </div>

  {repeats && (
    <div className="space-y-3 pl-2 border-l border-white/10">
      {/* Frequency */}
      <Select
        label="Frequency"
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'biweekly', label: 'Bi-weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
        value={formData.recurrenceFrequency}
        onChange={(e) => handleChange('recurrenceFrequency', e.target.value)}
      />

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvancedRecurrence(!showAdvancedRecurrence)}
        className="text-xs text-cyan-400 hover:text-cyan-300"
      >
        {showAdvancedRecurrence ? '▲ Hide Advanced' : '▼ Advanced Options'}
      </button>

      {showAdvancedRecurrence && (
        <div className="space-y-3">
          {/* Day-of-week checkboxes */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Days</label>
            <div className="flex flex-wrap gap-2">
              {(['mon','tue','wed','thu','fri','sat','sun'] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setRecurrenceDays(prev =>
                    prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                  )}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    recurrenceDays.includes(day)
                      ? 'bg-cyan-500/20 border-cyan-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* End condition */}
          <Select
            label="Ends"
            options={[
              { value: 'never', label: 'Never' },
              { value: 'after', label: 'After N occurrences' },
              { value: 'on_date', label: 'On date' },
            ]}
            value={formData.recurrenceEndType}
            onChange={(e) => handleChange('recurrenceEndType', e.target.value)}
          />

          {formData.recurrenceEndType === 'after' && (
            <Input
              type="number"
              min="1"
              placeholder="Number of occurrences"
              value={formData.recurrenceEndAfter}
              onChange={(e) => handleChange('recurrenceEndAfter', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          )}

          {formData.recurrenceEndType === 'on_date' && (
            <Input
              type="date"
              value={formData.recurrenceEndDate}
              onChange={(e) => handleChange('recurrenceEndDate', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          )}
        </div>
      )}
    </div>
  )}
</div>
```

**Step 4: Update `handleSubmit` to include new fields**

```typescript
body: JSON.stringify({
  title: formData.title.trim(),
  description: formData.description.trim() || undefined,
  type: formData.type,
  scheduledAt: new Date(formData.scheduledAt).toISOString(),
  duration: durationNum,
  location: formData.location.trim() || undefined,
  facilitator: formData.facilitator.trim() || undefined,
  coverImageUrl: coverImageUrl || undefined,
  visibility: formData.visibility,
  houseId: formData.visibility === 'house' ? formData.houseId : undefined,
  recurrence: repeats ? {
    frequency: formData.recurrenceFrequency === 'custom' && recurrenceDays.length > 0
      ? 'custom'
      : formData.recurrenceFrequency,
    days: recurrenceDays.length > 0 ? recurrenceDays : undefined,
    endType: formData.recurrenceEndType,
    endAfter: formData.recurrenceEndType === 'after' && formData.recurrenceEndAfter
      ? parseInt(formData.recurrenceEndAfter, 10)
      : undefined,
    endDate: formData.recurrenceEndType === 'on_date' ? formData.recurrenceEndDate : undefined,
  } : undefined,
}),
```

**Step 5: Commit**

```bash
git add "app/(dashboard)/[tenantId]/events/new/page.tsx"
git commit -m "feat: add visibility selector and recurrence controls to event create form"
```

---

## Task 11: Update Mobile Events API + Universal Events Endpoint

**Files:**
- Modify: `app/api/mobile/tenants/[tenantId]/events/route.ts`
- Create: `app/api/mobile/events/route.ts`

### Part A — Update tenant events route to respect visibility

**Step 1: Update `app/api/mobile/tenants/[tenantId]/events/route.ts`**

The existing route returns all upcoming events for a tenant regardless of visibility. Update it to filter by user's access:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;
    const userId = token.uid;

    const now = new Date();

    // Fetch all upcoming events for this tenant
    const eventsSnap = await adminDb
      .collection(`tenants/${tenantId}/events`)
      .where('scheduledAt', '>=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(50)
      .get();

    // Get user's houseId (from their enrollment in this tenant)
    let userHouseId: string | null = null;
    const userEnrollSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('enrollments')
      .where('tenantId', '==', tenantId)
      .where('status', 'in', ['active', 'approved'])
      .limit(1)
      .get();

    if (!userEnrollSnap.empty) {
      userHouseId = userEnrollSnap.docs[0].data().houseId ?? null;
    }

    const userTenantId = token.tenant_id ?? null;
    const isEnrolledInTenant = !userEnrollSnap.empty || userTenantId === tenantId;

    const events = eventsSnap.docs
      .map((doc) => {
        const data = doc.data();
        const visibility = data.visibility ?? 'tenant'; // default: tenant

        // Apply access control
        if (visibility === 'universal') return data; // everyone sees it
        if (visibility === 'tenant' && isEnrolledInTenant) return data;
        if (visibility === 'house' && userHouseId && data.houseId === userHouseId) return data;
        return null; // not accessible
      })
      .filter(Boolean)
      .map((data) => ({
        id: data!.id,
        title: data!.title,
        description: data!.description ?? null,
        scheduledAt: data!.scheduledAt?.toDate?.()?.toISOString() ?? data!.scheduledAt,
        duration: data!.duration ?? null,
        location: data!.location ?? null,
        type: data!.type ?? null,
        visibility: data!.visibility ?? 'tenant',
        attendeeCount: (data!.attendeeIds ?? []).length,
      }));

    return NextResponse.json({ events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

### Part B — New universal events endpoint

**Step 2: Create `app/api/mobile/events/route.ts`**

```typescript
// app/api/mobile/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAuthToken(request);

    const now = new Date();
    const tenantsSnap = await adminDb.collection('tenants').get();

    const events: object[] = [];
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const tenantName = (tenantDoc.data().name as string) ?? tenantId;

      const eventsSnap = await adminDb
        .collection(`tenants/${tenantId}/events`)
        .where('visibility', '==', 'universal')
        .where('scheduledAt', '>=', now)
        .orderBy('scheduledAt', 'asc')
        .limit(20)
        .get();

      for (const eventDoc of eventsSnap.docs) {
        const data = eventDoc.data();
        events.push({
          id: eventDoc.id,
          tenantId,
          tenantName,
          title: data.title ?? '',
          description: data.description ?? null,
          scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() ?? data.scheduledAt,
          duration: data.duration ?? null,
          location: data.location ?? null,
          type: data.type ?? null,
          visibility: 'universal',
        });
      }
    }

    // Sort all events by scheduledAt
    events.sort((a: any, b: any) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    return NextResponse.json({ events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 3: Commit**

```bash
git add "app/api/mobile/tenants/[tenantId]/events/route.ts" "app/api/mobile/events/route.ts"
git commit -m "feat: event visibility access control in tenant events; add GET /api/mobile/events universal endpoint"
```

---

## Task 12: Push + Deploy

**Step 1: Push to GitHub**

```bash
git push origin main
```

If SSH key issue (on peteroleary not highvaluegrowth account):
```bash
read -s -p "PAT: " T && git remote set-url origin https://$T@github.com/highvaluegrowth/hvg-saas-3.git && git push origin main
```

**Step 2: Deploy mobile via Expo EAS OTA update**

```bash
cd mobile && npx eas-cli update --branch production --message "feat: houses browsing, course visibility, event visibility+recurrence" --non-interactive
```

**Step 3: Verify web deploy**

Vercel auto-deploys on push to `main`. Check https://app.hvg.app after 1–2 minutes.

**Step 4: Verify in app**

1. Open mobile app, log in as `pete.oleary@icloud.com`
2. Explore → Houses pill → should show houses from all tenants
3. Explore → Events pill → should show universal events
4. Explore → Courses pill → should show universal courses
5. Home tab → if enrolled, should show "My Houses" section
6. Web dashboard (`petergaiennie@gmail.com`) → LMS → create/edit course → see visibility toggle
7. Web dashboard → Events → create event → see visibility selector and Repeats toggle

---

## Recap: Implementation Order

| Task | Scope | Files |
|------|-------|-------|
| 1 | LMS fix: lesson stubs on save | `curriculum/route.ts` |
| 2 | Global houses API | `app/api/mobile/houses/route.ts` |
| 3 | Explore pills + Home "My Houses" | `routes.ts`, `explore.tsx`, `index.tsx` |
| 4 | Course visibility rename | `courseService.ts`, `create/page.tsx`, `lms/courses/route.ts` |
| 5 | Universal courses endpoint | `app/api/mobile/courses/route.ts` |
| 6 | Course enroll endpoint | `enroll/route.ts` |
| 7 | Lesson complete endpoint | `complete/route.ts` |
| 8 | Mobile LMS enroll + complete UI | `lms/[courseId].tsx`, `[lessonId].tsx` |
| 9 | Event types + schemas | `event.types.ts`, `event.schemas.ts` |
| 10 | Event create form (visibility + recurrence) | `events/new/page.tsx` |
| 11 | Mobile events API (access control + universal) | `events/route.ts`, `app/api/mobile/events/route.ts` |
| 12 | Push + deploy | git, EAS |

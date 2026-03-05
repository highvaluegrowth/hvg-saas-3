import { useQuery } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { lmsApi, MobileCourse } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onPress }: { course: MobileCourse; onPress: () => void }) {
  const pct = course.progress ?? 0;

  const statusLabel =
    course.enrollmentStatus === 'COMPLETED'
      ? '✓ Completed'
      : course.enrollmentStatus === 'IN_PROGRESS'
      ? `${pct}% complete`
      : course.enrolled
      ? 'Enrolled'
      : 'Available';

  const statusColor =
    course.enrollmentStatus === 'COMPLETED'
      ? '#10b981'
      : course.enrollmentStatus === 'IN_PROGRESS'
      ? '#6366f1'
      : course.enrolled
      ? '#475569'
      : '#94a3b8';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={[styles.cardStatus, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {course.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {course.description}
        </Text>
      ) : null}

      {/* Progress bar — shown only when enrolled */}
      {course.enrolled && course.enrollmentStatus !== 'COMPLETED' && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%` as `${number}%`, backgroundColor: '#6366f1' },
            ]}
          />
        </View>
      )}

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          📚 {course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.metaText}>
          📝 {course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}
        </Text>
        {course.enrolled && (
          <Text style={styles.metaText}>
            ✓ {course.completedLessons}/{course.totalLessons} done
          </Text>
        )}
      </View>

      <View style={styles.cardAction}>
        <Text style={styles.cardActionText}>
          {course.enrolled ? 'Continue →' : 'View Course →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LMSIndex() {
  const router = useRouter();
  const { appUser } = useAuth();
  const tenantId = appUser?.tenant_id;

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['mobile-courses', tenantId],
    queryFn: () => lmsApi.getCourses(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  const courses = data?.courses ?? [];
  const enrolled = courses.filter((c) => c.enrolled);
  const available = courses.filter((c) => !c.enrolled);

  if (!tenantId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No house assigned yet.</Text>
        <Text style={styles.emptySubText}>Contact your house manager to get enrolled.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.loadingText}>Loading courses…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load courses. Pull to refresh.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
      }
    >
      <Text style={styles.pageTitle}>Learning Center</Text>

      {courses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No courses published yet.</Text>
          <Text style={styles.emptySubText}>Check back soon — your house manager is setting things up.</Text>
        </View>
      )}

      {enrolled.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Courses</Text>
          {enrolled.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onPress={() => router.push(`/lms/${c.id}`)}
            />
          ))}
        </View>
      )}

      {available.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available</Text>
          {available.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onPress={() => router.push(`/lms/${c.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG = '#0a0f1e';
const SURFACE = '#1e293b';
const TEXT = '#f8fafc';
const MUTED = '#94a3b8';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 120, gap: 4 },
  centered: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  loadingText: { color: MUTED, fontSize: 14, marginTop: 8 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },

  pageTitle: { fontSize: 26, fontWeight: '700', color: TEXT, marginBottom: 20 },

  section: { marginBottom: 28, gap: 10 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },

  card: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: MUTED, lineHeight: 18 },
  progressTrack: { height: 4, backgroundColor: '#0f172a', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  cardMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#64748b' },
  cardAction: { alignItems: 'flex-end' },
  cardActionText: { fontSize: 13, fontWeight: '600', color: '#6366f1' },

  emptyState: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 6, marginTop: 20,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: TEXT, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: MUTED, textAlign: 'center' },
});

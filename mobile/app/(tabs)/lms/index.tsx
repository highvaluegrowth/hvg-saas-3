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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { lmsApi, MobileCourse } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';
import { colors } from '@/lib/constants/theme';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onPress }: { course: MobileCourse; onPress: () => void }) {
  const pct = course.progress ?? 0;

  const statusLabel =
    course.enrollmentStatus === 'COMPLETED'
      ? 'Completed'
      : course.enrollmentStatus === 'IN_PROGRESS'
      ? `${pct}% complete`
      : course.enrolled
      ? 'Enrolled'
      : 'Available';

  const statusColor =
    course.enrollmentStatus === 'COMPLETED'
      ? colors.success.DEFAULT
      : course.enrollmentStatus === 'IN_PROGRESS'
      ? colors.primary.DEFAULT
      : course.enrolled
      ? colors.text.secondary
      : colors.text.muted;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={[styles.statusBadge, { borderColor: statusColor + '55' }]}>
          {course.enrollmentStatus === 'COMPLETED' && (
            <MaterialIcons name="check-circle" size={11} color={statusColor} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {course.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {course.description}
        </Text>
      ) : null}

      {/* Progress bar — Emerald fill for in-progress, full emerald for completed */}
      {course.enrolled && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${course.enrollmentStatus === 'COMPLETED' ? 100 : pct}%` as `${number}%`,
                backgroundColor: colors.success.DEFAULT,
              },
            ]}
          />
        </View>
      )}

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          {course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>
          {course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}
        </Text>
        {course.enrolled && course.completedLessons > 0 && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={[styles.metaText, { color: colors.success.DEFAULT }]}>
              {course.completedLessons} done
            </Text>
          </>
        )}
      </View>

      <View style={styles.cardAction}>
        <Text style={styles.cardActionText}>
          {course.enrollmentStatus === 'COMPLETED'
            ? 'Review →'
            : course.enrolled
            ? 'Continue →'
            : 'View Course →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── LMS Index Screen ─────────────────────────────────────────────────────────

export default function LMSIndex() {
  const router = useRouter();
  const { appUser, firebaseUser } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 16;

  // Use tenantId from auth — support both array and singular shape
  const tenantId: string | undefined =
    (appUser as any)?.tenantIds?.[0] ?? (appUser as any)?.tenantId ?? undefined;
  const uid = firebaseUser?.uid;

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['lms', 'courses', tenantId, uid],
    queryFn: () => lmsApi.getCourses(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  const courses = data?.courses ?? [];
  const enrolled = courses.filter((c) => c.enrolled);
  const available = courses.filter((c) => !c.enrolled);

  if (!tenantId) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.centered}>
          <MaterialIcons name="school" size={40} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No house assigned yet</Text>
          <Text style={styles.emptySubText}>
            Contact your house manager to get enrolled.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
          <Text style={styles.loadingText}>Loading courses…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load courses. Pull to refresh.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        <Text style={styles.pageTitle}>Learning Center</Text>

        {courses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="auto-stories" size={36} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No courses published yet</Text>
            <Text style={styles.emptySubText}>
              Check back soon — your house manager is setting things up.
            </Text>
          </View>
        )}

        {enrolled.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MY COURSES</Text>
            {enrolled.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onPress={() => router.push(`/lms/${c.id}` as any)}
              />
            ))}
          </View>
        )}

        {available.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AVAILABLE</Text>
            {available.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onPress={() => router.push(`/lms/${c.id}` as any)}
              />
            ))}
          </View>
        )}

        {/* Events calendar link */}
        <TouchableOpacity
          style={styles.eventsLink}
          onPress={() => router.push('/events' as any)}
          activeOpacity={0.75}
        >
          <View style={styles.eventsLinkIcon}>
            <MaterialIcons name="event" size={22} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.eventsLinkBody}>
            <Text style={styles.eventsLinkTitle}>Events & Meetings</Text>
            <Text style={styles.eventsLinkSub}>View the house calendar & RSVP</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: { color: colors.text.muted, fontSize: 14, marginTop: 8 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 20,
  },

  section: { marginBottom: 28, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  // Course card
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },
  progressTrack: {
    height: 4,
    backgroundColor: colors.bg.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: colors.text.muted },
  metaDot: { fontSize: 12, color: colors.text.muted },
  cardAction: { alignItems: 'flex-end' },
  cardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },

  // Empty state
  emptyState: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubText: { fontSize: 13, color: colors.text.muted, textAlign: 'center' },

  // Events link
  eventsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  eventsLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsLinkBody: { flex: 1 },
  eventsLinkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  eventsLinkSub: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
});

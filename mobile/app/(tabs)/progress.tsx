import { useQuery } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { userApi, ProgressData, CourseProgress, MoodEntry } from '@/lib/api/routes';

// ─── Sobriety Ring ─────────────────────────────────────────────────────────────

function SobrietyRing({ days }: { days: number }) {
  const MILESTONES = [7, 14, 30, 60, 90, 120, 180, 270, 365];
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= days) ?? 0;
  const nextMilestone = MILESTONES.find(m => m > days) ?? 365;
  const pct = nextMilestone > prevMilestone
    ? Math.min(1, (days - prevMilestone) / (nextMilestone - prevMilestone))
    : 1;

  // Visual ring using nested Views + border trick
  const SIZE = 140;
  const THICKNESS = 14;
  const FILLED_DEG = Math.round(pct * 360);

  // Format days into readable string
  const label =
    days >= 365 ? `${(days / 365).toFixed(1)}yr` :
      days >= 30 ? `${Math.floor(days / 30)}mo` :
        `${days}d`;

  return (
    <View style={styles.ringContainer}>
      {/* Background ring */}
      <View style={[styles.ringOuter, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}>
        {/* Filled portion using clip trick */}
        <View style={[
          styles.ringFill,
          {
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: THICKNESS,
            borderColor: FILLED_DEG >= 360 ? '#10b981' : '#6366f1',
            opacity: 1,
          }
        ]} />
        {/* Inner circle to create donut */}
        <View style={[
          styles.ringInner,
          {
            width: SIZE - THICKNESS * 2,
            height: SIZE - THICKNESS * 2,
            borderRadius: (SIZE - THICKNESS * 2) / 2,
            top: THICKNESS,
            left: THICKNESS,
          }
        ]}>
          <Text style={styles.ringLabel}>{label}</Text>
          <Text style={styles.ringSubLabel}>sober</Text>
        </View>
      </View>
      <Text style={styles.ringFooter}>
        {days === 0
          ? 'Start your journey today'
          : `${nextMilestone - days} days to ${nextMilestone}-day milestone`}
      </Text>
    </View>
  );
}

// ─── Mood Sparkline ────────────────────────────────────────────────────────────

function MoodSparkline({ moods }: { moods: MoodEntry[] }) {
  if (moods.length === 0) {
    return (
      <View style={styles.sparklineEmpty}>
        <Text style={styles.emptyText}>No mood entries yet</Text>
      </View>
    );
  }

  const MAX_H = 40;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getMoodColor = (score: number) => {
    if (score >= 4) return '#10b981';
    if (score >= 3) return '#6366f1';
    if (score >= 2) return '#D946EF';
    return '#ef4444';
  };

  // Show last 7 moods (padded if less than 7)
  const padded: (MoodEntry | null)[] = Array(7).fill(null);
  moods.slice(-7).forEach((m, i) => { padded[i + (7 - moods.length)] = m; });

  return (
    <View style={styles.sparklineContainer}>
      {padded.map((m, i) => (
        <View key={i} style={styles.sparklineDay}>
          <View style={[
            styles.sparklineBar,
            {
              height: m ? Math.max(6, (m.score / 5) * MAX_H) : 6,
              backgroundColor: m ? getMoodColor(m.score) : '#1e293b',
              opacity: m ? 1 : 0.3,
            }
          ]} />
          <Text style={styles.sparklineDayLabel}>{days[i]}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Course Progress Bar ──────────────────────────────────────────────────────

function CourseProgressBar({ course }: { course: CourseProgress }) {
  const pct = course.progress ?? 0;
  const statusColors: Record<string, string> = {
    COMPLETED: '#10b981',
    IN_PROGRESS: '#6366f1',
    ENROLLED: '#475569',
  };
  const color = statusColors[course.status] ?? '#475569';

  return (
    <View style={styles.courseItem}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
        <Text style={[styles.courseStatus, { color }]}>
          {course.status === 'COMPLETED' ? '✓ Done' :
            course.status === 'IN_PROGRESS' ? `${pct}%` : 'Enrolled'}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.courseSubtext}>
        {course.completedLessons} of {course.totalLessons} lessons completed
      </Text>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = '#6366f1' }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { data, isLoading, refetch, isRefetching, error } = useQuery<ProgressData>({
    queryKey: ['progress'],
    queryFn: userApi.getProgress,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.loadingText}>Loading your progress…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load progress. Pull to refresh.</Text>
      </View>
    );
  }

  const { sobriety, courses, meetings, moods } = data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
      }
    >
      <Text style={styles.pageTitle}>My Progress</Text>

      {/* ── Sobriety ── */}
      <Section title="Sobriety">
        <SobrietyRing days={sobriety.days} />
      </Section>

      {/* ── Courses ── */}
      <Section title="Courses">
        <View style={styles.statRow}>
          <StatCard label="Enrolled" value={courses.enrolled} accent="#6366f1" />
          <StatCard label="In Progress" value={courses.inProgress} accent="#D946EF" />
          <StatCard label="Completed" value={courses.completed} accent="#10b981" />
        </View>
        {courses.items.length > 0 ? (
          <View style={styles.courseList}>
            {courses.items.map(c => <CourseProgressBar key={c.courseId} course={c} />)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No courses enrolled yet</Text>
          </View>
        )}
      </Section>

      {/* ── Meetings ── */}
      <Section title="Meetings">
        <View style={styles.statRow}>
          <StatCard
            label="This Month"
            value={meetings.thisMonth}
            sub="meetings attended"
            accent="#6366f1"
          />
          <StatCard
            label="Week Streak"
            value={meetings.streak}
            sub={meetings.streak === 1 ? 'week' : 'weeks'}
            accent="#10b981"
          />
        </View>
      </Section>

      {/* ── Mood ── */}
      <Section title="Mood (Last 7 Days)">
        <View style={styles.sparklineCard}>
          <MoodSparkline moods={moods} />
          <View style={styles.moodLegend}>
            {[
              { label: 'Great', color: '#10b981' },
              { label: 'Good', color: '#6366f1' },
              { label: 'Okay', color: '#D946EF' },
              { label: 'Low', color: '#ef4444' },
            ].map(({ label, color }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_BG = '#0f172a';
const SURFACE = '#1e293b';
const TEXT = '#f8fafc';
const MUTED = '#94a3b8';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  contentContainer: { padding: 20, paddingBottom: 120, gap: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1e', gap: 12 },
  loadingText: { color: MUTED, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  pageTitle: { fontSize: 26, fontWeight: '700', color: TEXT, marginBottom: 12 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Sobriety Ring
  ringContainer: { alignItems: 'center', gap: 12 },
  ringOuter: { position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE },
  ringFill: { position: 'absolute', top: 0, left: 0 },
  ringInner: { position: 'absolute', backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { fontSize: 28, fontWeight: '800', color: TEXT },
  ringSubLabel: { fontSize: 12, color: MUTED, marginTop: -2 },
  ringFooter: { fontSize: 13, color: MUTED, textAlign: 'center' },

  // Stats
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 3,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: MUTED, fontWeight: '600', textAlign: 'center' },
  statSub: { fontSize: 10, color: '#64748b', textAlign: 'center' },

  // Courses
  courseList: { marginTop: 12, gap: 10 },
  courseItem: { backgroundColor: SURFACE, borderRadius: 12, padding: 14, gap: 6 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT, marginRight: 8 },
  courseStatus: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  courseSubtext: { fontSize: 11, color: MUTED },

  emptyState: { backgroundColor: SURFACE, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: MUTED, fontSize: 14 },

  // Sparkline
  sparklineCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 16, gap: 16 },
  sparklineContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 56 },
  sparklineEmpty: { backgroundColor: SURFACE, borderRadius: 14, padding: 24, alignItems: 'center' },
  sparklineDay: { alignItems: 'center', gap: 4, flex: 1 },
  sparklineBar: { width: 20, borderRadius: 4 },
  sparklineDayLabel: { fontSize: 10, color: MUTED },
  moodLegend: { flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: MUTED },
});

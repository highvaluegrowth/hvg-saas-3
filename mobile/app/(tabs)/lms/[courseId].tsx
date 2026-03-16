import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { lmsApi, MobileCourseModule, MobileLessonContent } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOfflineCourse } from '@/lib/hooks/useOfflineCourse';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// ─── Lesson Type Icon ──────────────────────────────────────────────────────────

function lessonIcon(type: string) {
  switch (type) {
    case 'VIDEO':  return '▶';
    case 'TEXT':   return '📄';
    case 'QUIZ':   return '❓';
    case 'SLIDES': return '🖼';
    default:       return '📝';
  }
}

// ─── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  onPress,
}: {
  lesson: MobileLessonContent;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.lessonRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.lessonIcon}>
        <Text style={styles.lessonIconText}>{lessonIcon(lesson.type)}</Text>
      </View>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle} numberOfLines={1}>
          {lesson.title || '(Untitled lesson)'}
        </Text>
        <Text style={styles.lessonType}>{lesson.type}</Text>
      </View>
      <Text style={styles.lessonChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Module Section ────────────────────────────────────────────────────────────

function ModuleSection({
  module,
  courseId,
  onLessonPress,
}: {
  module: MobileCourseModule;
  courseId: string;
  onLessonPress: (lessonId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.moduleContainer}>
      <TouchableOpacity
        style={styles.moduleHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.75}
      >
        <Text style={styles.moduleTitle}>{module.title}</Text>
        <Text style={styles.moduleChevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded && module.lessons.map((lesson) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          onPress={() => onLessonPress(lesson.id)}
        />
      ))}
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { appUser } = useAuth();
  const tenantId = appUser?.tenantIds?.[0];
  const queryClient = useQueryClient();

  const { isDownloaded, isDownloading, downloadCourse, removeDownload } = useOfflineCourse(courseId!);

  // Fetch full course detail (modules + lessons)
  const { data, isLoading, error } = useQuery({
    queryKey: ['mobile-course', tenantId, courseId],
    queryFn: () => lmsApi.getCourse(tenantId!, courseId!),
    enabled: !!tenantId && !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch courses list to get enrolled + progress for this course
  const { data: coursesData } = useQuery({
    queryKey: ['lms', 'courses', tenantId],
    queryFn: () => lmsApi.getCourses(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  const enrollMutation = useMutation({
    mutationFn: () => lmsApi.enroll(tenantId!, courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms', 'courses'] });
    },
  });

  const course = data?.course;
  const courseListItem = coursesData?.courses.find((c) => c.id === courseId);
  const enrolled = courseListItem?.enrolled ?? false;
  const progress = courseListItem?.progress ?? 0;
  const totalLessons = course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.loadingText}>Loading course…</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load course. Go back and try again.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: course.title, headerBackTitle: 'Courses' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          {course.description ? (
            <Text style={styles.courseDesc}>{course.description}</Text>
          ) : null}
          <View style={styles.courseMeta}>
            <Text style={styles.metaChip}>📚 {course.modules.length} modules</Text>
            <Text style={styles.metaChip}>📝 {totalLessons} lessons</Text>
          </View>
        </View>

        {/* Progress bar (only when enrolled and progress > 0) */}
        {enrolled && progress > 0 && (
          <ProgressBar progress={progress} />
        )}

        {/* Enroll Now button (only when not yet enrolled) */}
        {!enrolled && (
          <TouchableOpacity
            style={[styles.enrollBtn, enrollMutation.isPending && styles.enrollBtnDisabled]}
            onPress={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.enrollBtnText}>
              {enrollMutation.isPending ? 'Enrolling…' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Offline Support */}
        {enrolled && course && (
          <TouchableOpacity
            style={[styles.offlineBtn, isDownloaded && styles.offlineBtnActive]}
            onPress={() => (isDownloaded ? removeDownload() : downloadCourse(course))}
            disabled={isDownloading}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : (
              <View style={styles.offlineBtnInner}>
                <MaterialIcons
                  name={isDownloaded ? 'cloud-done' : 'cloud-download'}
                  size={20}
                  color={isDownloaded ? '#10b981' : '#6366f1'}
                />
                <Text style={[styles.offlineBtnText, isDownloaded && styles.offlineBtnTextActive]}>
                  {isDownloaded ? 'Downloaded Offline' : 'Download for Offline'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Modules + Lessons */}
        {course.modules.map((mod) => (
          <ModuleSection
            key={mod.id}
            module={mod}
            courseId={course.id}
            onLessonPress={(lessonId) =>
              router.push(`/lms/${course.id}/${lessonId}` as never)
            }
          />
        ))}

        {course.modules.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No lessons yet.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG = '#0a0f1e';
const SURFACE = '#1e293b';
const TEXT = '#f8fafc';
const MUTED = '#94a3b8';
const BORDER = '#334155';
const CYAN = '#06b6d4';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 120, gap: 16 },
  centered: {
    flex: 1, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8,
  },
  loadingText: { color: MUTED, fontSize: 14, marginTop: 8 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },

  courseHeader: { gap: 8, marginBottom: 4 },
  courseTitle: { fontSize: 24, fontWeight: '800', color: TEXT },
  courseDesc: { fontSize: 14, color: MUTED, lineHeight: 20 },
  courseMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaChip: {
    fontSize: 12, color: '#6366f1', fontWeight: '600',
    backgroundColor: '#1e1b4b', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },

  // Progress bar
  progressWrapper: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 13, fontWeight: '600', color: MUTED },
  progressPct: { fontSize: 13, fontWeight: '700', color: CYAN },
  progressTrack: {
    height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: CYAN, borderRadius: 4,
  },

  // Enroll button
  enrollBtn: {
    backgroundColor: CYAN, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  enrollBtnDisabled: { opacity: 0.5 },
  enrollBtnText: { fontSize: 16, fontWeight: '700', color: '#0a0f1e' },

  // Offline button
  offlineBtn: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  offlineBtnActive: { borderColor: '#10b98122' },
  offlineBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offlineBtnText: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
  offlineBtnTextActive: { color: '#10b981' },

  moduleContainer: {
    backgroundColor: SURFACE, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
  },
  moduleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  moduleTitle: { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1 },
  moduleChevron: { fontSize: 16, color: MUTED },

  lessonRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: BORDER,
    gap: 12,
  },
  lessonIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#1e1b4b', alignItems: 'center', justifyContent: 'center',
  },
  lessonIconText: { fontSize: 16 },
  lessonInfo: { flex: 1, gap: 2 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: TEXT },
  lessonType: { fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  lessonChevron: { fontSize: 20, color: '#475569' },

  emptyState: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 32,
    alignItems: 'center',
  },
  emptyText: { color: MUTED, fontSize: 14 },
});

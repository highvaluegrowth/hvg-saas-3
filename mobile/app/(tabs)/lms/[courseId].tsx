import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { appUser } = useAuth();
  const tenantId = appUser?.tenant_id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['mobile-course', tenantId, courseId],
    queryFn: () => lmsApi.getCourse(tenantId!, courseId!),
    enabled: !!tenantId && !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  const course = data?.course;
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { lmsApi } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Video Lesson ─────────────────────────────────────────────────────────────

function VideoLesson({ videoUrl, thumbnailUrl }: { videoUrl?: string; thumbnailUrl?: string }) {
  if (!videoUrl) {
    return (
      <View style={styles.emptyContent}>
        <Text style={styles.emptyText}>No video URL configured for this lesson.</Text>
      </View>
    );
  }

  // Extract YouTube/Vimeo ID for embed hint; otherwise show URL
  const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isVimeo = videoUrl.includes('vimeo.com');

  return (
    <View style={styles.videoContainer}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoIcon}>▶</Text>
        </View>
      )}
      <View style={styles.videoMeta}>
        <Text style={styles.videoType}>
          {isYoutube ? '🎬 YouTube' : isVimeo ? '🎬 Vimeo' : '🎬 Video'}
        </Text>
        <Text style={styles.videoUrl} numberOfLines={2}>
          {videoUrl}
        </Text>
        <Text style={styles.videoHint}>
          Open in browser or video app to watch.
        </Text>
      </View>
    </View>
  );
}

// ─── Text Lesson ──────────────────────────────────────────────────────────────

function TextLesson({ content }: { content?: string }) {
  if (!content) {
    return (
      <View style={styles.emptyContent}>
        <Text style={styles.emptyText}>No content for this lesson yet.</Text>
      </View>
    );
  }

  // Strip basic HTML tags for plain text rendering
  const plainText = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .trim();

  return (
    <View style={styles.textContent}>
      <Text style={styles.lessonText}>{plainText}</Text>
    </View>
  );
}

// ─── Slides Lesson ────────────────────────────────────────────────────────────

function SlidesLesson({ slides }: { slides?: { id: string; imageUrl: string; caption?: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!slides || slides.length === 0) {
    return (
      <View style={styles.emptyContent}>
        <Text style={styles.emptyText}>No slides for this lesson yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.slidesContainer}>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_W - 40 }]}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.slideImage}
              resizeMode="contain"
            />
            {item.caption ? (
              <Text style={styles.slideCaption}>{item.caption}</Text>
            ) : null}
          </View>
        )}
      />
      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>
      <Text style={styles.slideCounter}>
        {currentIndex + 1} / {slides.length}
      </Text>
    </View>
  );
}

// ─── Quiz Lesson (read-only view) ─────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  options?: { id: string; text: string }[];
}

function QuizLesson({ questions }: { questions?: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.emptyContent}>
        <Text style={styles.emptyText}>No questions for this quiz yet.</Text>
      </View>
    );
  }

  function selectOption(questionId: string, optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  const mcQuestions = questions.filter(
    (q) => q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE'
  );

  return (
    <View style={styles.quizContainer}>
      {questions.map((q, qi) => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>Q{qi + 1}</Text>
          <Text style={styles.questionText}>{q.text}</Text>

          {(q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') && q.options && (
            <View style={styles.options}>
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => selectOption(q.id, opt.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {opt.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {(q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
            <View style={styles.openAnswerHint}>
              <Text style={styles.openAnswerText}>Written response required</Text>
            </View>
          )}

          {q.type === 'LIKERT_SCALE' && (
            <View style={styles.likertRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.likertBtn, answers[q.id] === String(n) && styles.likertBtnSelected]}
                  onPress={() => !submitted && setAnswers((p) => ({ ...p, [q.id]: String(n) }))}
                >
                  <Text style={[styles.likertNum, answers[q.id] === String(n) && styles.likertNumSelected]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      {!submitted && mcQuestions.length > 0 && (
        <TouchableOpacity
          style={[styles.submitBtn, Object.keys(answers).length === 0 && styles.submitBtnDisabled]}
          onPress={() => setSubmitted(true)}
          disabled={Object.keys(answers).length === 0}
        >
          <Text style={styles.submitBtnText}>Submit Answers</Text>
        </TouchableOpacity>
      )}

      {submitted && (
        <View style={styles.submittedBanner}>
          <Text style={styles.submittedText}>✓ Answers submitted!</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LessonViewerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const { appUser } = useAuth();
  const tenantId = appUser?.tenantIds?.[0];
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch the full course to find this lesson
  const { data, isLoading, error } = useQuery({
    queryKey: ['mobile-course', tenantId, courseId],
    queryFn: () => lmsApi.getCourse(tenantId!, courseId!),
    enabled: !!tenantId && !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  const completeMutation = useMutation({
    mutationFn: () => lmsApi.completeLesson(tenantId!, courseId!, lessonId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms', 'courses'] });
      router.back();
    },
  });

  // Find the specific lesson across all modules
  const lesson = data?.course?.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === lessonId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.loadingText}>Loading lesson…</Text>
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load lesson. Go back and try again.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: lesson.title || 'Lesson', headerBackTitle: 'Course' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Lesson Header */}
        <View style={styles.lessonHeader}>
          <View style={styles.lessonTypeBadge}>
            <Text style={styles.lessonTypeBadgeText}>{lesson.type}</Text>
          </View>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>

        {/* Content by type */}
        {lesson.type === 'VIDEO' && (
          <VideoLesson videoUrl={lesson.videoUrl} thumbnailUrl={lesson.thumbnailUrl} />
        )}
        {lesson.type === 'TEXT' && (
          <TextLesson content={lesson.content} />
        )}
        {lesson.type === 'SLIDES' && (
          <SlidesLesson slides={lesson.slides} />
        )}
        {lesson.type === 'QUIZ' && (
          <QuizLesson questions={lesson.questions as QuizQuestion[] | undefined} />
        )}

        {/* Mark Complete button */}
        <TouchableOpacity
          style={[styles.completeBtn, completeMutation.isPending && styles.completeBtnDisabled]}
          onPress={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.completeBtnText}>
            {completeMutation.isPending ? 'Saving…' : '✓ Mark Complete'}
          </Text>
        </TouchableOpacity>
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
const INDIGO = '#6366f1';
const CYAN = '#06b6d4';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 120, gap: 20 },
  centered: {
    flex: 1, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8,
  },
  loadingText: { color: MUTED, fontSize: 14, marginTop: 8 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },

  lessonHeader: { gap: 8 },
  lessonTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e1b4b', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  lessonTypeBadgeText: { fontSize: 11, fontWeight: '700', color: INDIGO, textTransform: 'uppercase', letterSpacing: 0.5 },
  lessonTitle: { fontSize: 22, fontWeight: '800', color: TEXT },

  emptyContent: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 32, alignItems: 'center',
  },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center' },

  // Video
  videoContainer: { backgroundColor: SURFACE, borderRadius: 14, overflow: 'hidden' },
  thumbnail: { width: '100%', height: 200 },
  videoPlaceholder: {
    width: '100%', height: 200, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
  },
  videoIcon: { fontSize: 48, color: INDIGO },
  videoMeta: { padding: 16, gap: 6 },
  videoType: { fontSize: 13, fontWeight: '700', color: INDIGO },
  videoUrl: { fontSize: 12, color: MUTED, fontFamily: 'monospace' },
  videoHint: { fontSize: 12, color: '#475569' },

  // Text
  textContent: { backgroundColor: SURFACE, borderRadius: 14, padding: 20 },
  lessonText: { fontSize: 15, color: TEXT, lineHeight: 24 },

  // Slides
  slidesContainer: { gap: 12, alignItems: 'center' },
  slide: {
    gap: 12, alignItems: 'center',
  },
  slideImage: { width: '100%', height: 280, borderRadius: 14 },
  slideCaption: {
    fontSize: 14, color: MUTED, textAlign: 'center',
    backgroundColor: SURFACE, padding: 12, borderRadius: 10, width: '100%',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  dotActive: { backgroundColor: INDIGO, width: 20 },
  slideCounter: { fontSize: 12, color: MUTED },

  // Quiz
  quizContainer: { gap: 16 },
  questionCard: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 16, gap: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  questionNumber: { fontSize: 11, fontWeight: '700', color: INDIGO, textTransform: 'uppercase' },
  questionText: { fontSize: 15, fontWeight: '600', color: TEXT, lineHeight: 22 },
  options: { gap: 8 },
  option: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  optionSelected: { borderColor: INDIGO, backgroundColor: '#1e1b4b' },
  optionText: { fontSize: 14, color: MUTED },
  optionTextSelected: { color: TEXT, fontWeight: '600' },
  openAnswerHint: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 12,
  },
  openAnswerText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },
  likertRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  likertBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  likertBtnSelected: { backgroundColor: INDIGO, borderColor: INDIGO },
  likertNum: { fontSize: 16, fontWeight: '700', color: MUTED },
  likertNumSelected: { color: '#fff' },
  submitBtn: {
    backgroundColor: INDIGO, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  submittedBanner: {
    backgroundColor: '#064e3b', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  submittedText: { fontSize: 15, fontWeight: '700', color: '#10b981' },

  // Mark Complete
  completeBtn: {
    backgroundColor: '#0f172a', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    borderWidth: 1, borderColor: CYAN,
  },
  completeBtnDisabled: { opacity: 0.5 },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: CYAN },
});

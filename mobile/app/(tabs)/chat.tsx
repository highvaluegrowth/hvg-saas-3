import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { useChatSession } from '@/features/ai-chat/useChatSession';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTabBarHeight } from '@/lib/constants/layout';
import type { ChatMessage } from '@/lib/api/routes';

// ─── Recovery-focused quick action suggestions ───────────────────────────────
const SUGGESTIONS = [
  { icon: '🏆', text: 'How long have I been sober?' },
  { icon: '💭', text: 'Log how I\'m feeling right now' },
  { icon: '📋', text: 'What chores do I have today?' },
  { icon: '🗺️', text: 'Find an AA or NA meeting nearby' },
  { icon: '📅', text: "What's on my schedule this week?" },
  { icon: '🧠', text: 'I need to talk to someone' },
];

// ─── Rich component cards ─────────────────────────────────────────────────────

function SobrietyCard({ data }: { data: unknown }) {
  const d = data as {
    days?: number;
    months?: number;
    years?: number;
    nextMilestone?: string;
    daysUntilMilestone?: number;
  };
  const days = d?.days ?? 0;
  return (
    <View style={cards.sobriety}>
      <Text style={cards.sobrietyLabel}>🏆 You've been sober</Text>
      <Text style={cards.sobrietyDays}>{days.toLocaleString()}</Text>
      <Text style={cards.sobrietyUnit}>days</Text>
      {(d?.years || d?.months) ? (
        <Text style={cards.sobrietyBreakdown}>
          {[
            d.years ? `${d.years} yr${d.years !== 1 ? 's' : ''}` : null,
            d.months ? `${d.months} mo${d.months !== 1 ? 's' : ''}` : null,
          ]
            .filter(Boolean)
            .join(', ')}
        </Text>
      ) : null}
      {d?.nextMilestone ? (
        <View style={cards.sobrietyMilestone}>
          <Text style={cards.sobrietyMilestoneText}>
            🎯 Next: {d.nextMilestone}
            {d.daysUntilMilestone ? ` — ${d.daysUntilMilestone} days away` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CrisisCard({ data }: { data: unknown }) {
  const d = data as { resources?: { name: string; number?: string; text?: string }[] };
  const resources = d?.resources ?? [
    { name: '988 Suicide & Crisis Lifeline', number: '988' },
    { name: 'Crisis Text Line', text: 'Text HOME to 741741' },
    { name: 'SAMHSA Helpline', number: '1-800-662-4357' },
  ];
  return (
    <View style={cards.crisis}>
      <Text style={cards.crisisTitle}>🆘 Crisis Resources</Text>
      <Text style={cards.crisisSub}>You're not alone. Help is available 24/7.</Text>
      {resources.map((r, i) => (
        <View key={i} style={cards.crisisRow}>
          <View style={{ flex: 1 }}>
            <Text style={cards.crisisName}>{r.name}</Text>
            {r.text ? <Text style={cards.crisisDetail}>{r.text}</Text> : null}
          </View>
          {r.number ? (
            <TouchableOpacity
              style={cards.callBtn}
              onPress={() => Linking.openURL(`tel:${r.number}`)}
            >
              <Text style={cards.callBtnText}>📞 Call</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function MoodCard({ data }: { data: unknown }) {
  const d = data as { mood?: string; note?: string };
  const moodEmoji: Record<string, string> = {
    great: '😄', good: '🙂', okay: '😐', struggling: '😔', crisis: '🆘',
  };
  const mood = d?.mood ?? 'okay';
  return (
    <View style={cards.mood}>
      <Text style={cards.moodEmoji}>{moodEmoji[mood] ?? '😐'}</Text>
      <Text style={cards.moodLabel}>Mood logged: {mood}</Text>
      {d?.note ? <Text style={cards.moodNote}>{d.note}</Text> : null}
      <Text style={cards.moodCheck}>✓ Saved to your wellness log</Text>
    </View>
  );
}

function ChoreCard({ data }: { data: unknown }) {
  const d = data as { chores?: { title: string; status: string; dueDate?: string }[] };
  const chores = d?.chores ?? [];
  const statusIcon: Record<string, string> = {
    pending: '⏳', 'in-progress': '🔄', in_progress: '🔄', completed: '✅', done: '✅',
  };
  if (chores.length === 0) {
    return (
      <View style={cards.chore}>
        <Text style={cards.choreTitle}>📋 Chores</Text>
        <Text style={cards.choreEmpty}>No chores assigned right now 🎉</Text>
      </View>
    );
  }
  return (
    <View style={cards.chore}>
      <Text style={cards.choreTitle}>📋 Your Chores</Text>
      {chores.map((c, i) => (
        <View key={i} style={cards.choreRow}>
          <Text style={cards.choreIcon}>{statusIcon[c.status] ?? '⏳'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={cards.choreName}>{c.title}</Text>
            {c.dueDate ? (
              <Text style={cards.choreDate}>
                Due: {new Date(c.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function EventCard({ data }: { data: unknown }) {
  const d = data as { events?: { title: string; scheduledAt: string; location?: string; type?: string }[] };
  const events = d?.events ?? [];
  if (events.length === 0) {
    return (
      <View style={cards.event}>
        <Text style={cards.eventTitle}>📅 Upcoming Events</Text>
        <Text style={cards.choreEmpty}>No events scheduled this week</Text>
      </View>
    );
  }
  return (
    <View style={cards.event}>
      <Text style={cards.eventTitle}>📅 Upcoming Events</Text>
      {events.slice(0, 5).map((e, i) => (
        <View key={i} style={cards.eventRow}>
          <Text style={cards.eventName}>{e.title}</Text>
          <Text style={cards.eventTime}>
            {new Date(e.scheduledAt).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })}{e.location ? ` · ${e.location}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

function MeetingLoggedCard({ data }: { data: unknown }) {
  const d = data as { type?: string; location?: string };
  return (
    <View style={cards.mood}>
      <Text style={cards.moodEmoji}>🤝</Text>
      <Text style={cards.moodLabel}>Meeting logged{d?.type ? `: ${d.type}` : ''}</Text>
      {d?.location ? <Text style={cards.moodNote}>{d.location}</Text> : null}
      <Text style={cards.moodCheck}>✓ Added to your attendance record</Text>
    </View>
  );
}

function JournalCard({ data }: { data: unknown }) {
  const d = data as { title?: string };
  return (
    <View style={cards.mood}>
      <Text style={cards.moodEmoji}>📓</Text>
      <Text style={cards.moodLabel}>Journal entry saved{d?.title ? `: "${d.title}"` : ''}</Text>
      <Text style={cards.moodCheck}>✓ Private — only you can see this</Text>
    </View>
  );
}

/** Renders the appropriate rich card for a given component name */
function ComponentCard({ component, data }: { component: string; data: unknown }) {
  switch (component) {
    case 'sobriety_stats':
    case 'get_sobriety_stats':
      return <SobrietyCard data={data} />;
    case 'crisis_resources':
    case 'get_crisis_resources':
      return <CrisisCard data={data} />;
    case 'mood_logged':
    case 'log_mood':
      return <MoodCard data={data} />;
    case 'chore_status':
    case 'get_chore_status':
      return <ChoreCard data={data} />;
    case 'upcoming_events':
    case 'get_upcoming_events':
      return <EventCard data={data} />;
    case 'meeting_logged':
    case 'log_meeting_attendance':
      return <MeetingLoggedCard data={data} />;
    case 'journal_entry':
    case 'create_journal_entry':
      return <JournalCard data={data} />;
    default:
      return null;
  }
}

// ─── Typing indicator dots ────────────────────────────────────────────────────
function TypingDots() {
  return (
    <View style={styles.typingBubble}>
      <ActivityIndicator size="small" color="#6366f1" />
      <Text style={styles.typingText}>HVG Guide is thinking…</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { appUser } = useAuth();
  const { messages, sendMessage, isSending, isLoadingHistory, error } = useChatSession();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const tabBarHeight = useTabBarHeight();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    sendMessage(text);
  }

  const firstName = appUser?.displayName?.split(' ')[0] ?? 'there';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HVG Guide</Text>
          <Text style={styles.headerSub}>Powered by Gemini 2.5</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* ── History loading spinner ── */}
      {isLoadingHistory && messages.length === 0 ? (
        <View style={styles.historyLoading}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.historyLoadingText}>Loading your conversation…</Text>
        </View>
      ) : messages.length === 0 ? (
        /* ── Welcome / empty state ── */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.welcome, { paddingBottom: tabBarHeight + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.welcomeEmoji}>🌱</Text>
          <Text style={styles.welcomeTitle}>Hi, {firstName}!</Text>
          <Text style={styles.welcomeText}>
            I'm your HVG Guide — here to support your recovery journey.
            Ask me anything, log your mood, or just talk.
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s.text}
                style={styles.suggestion}
                onPress={() => sendMessage(s.text)}
                disabled={isSending}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionIcon}>{s.icon}</Text>
                <Text style={styles.suggestionText}>{s.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* ── Message list ── */
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[styles.messages, { paddingBottom: tabBarHeight + 16 }]}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: m }) => (
            <View style={m.role === 'user' ? styles.userRow : styles.aiRow}>
              {m.role === 'user' ? (
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{m.content}</Text>
                </View>
              ) : (
                <View style={styles.aiGroup}>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiText}>{m.content}</Text>
                  </View>
                  {m.component && m.componentData !== undefined ? (
                    <ComponentCard component={m.component} data={m.componentData} />
                  ) : null}
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* ── Typing indicator ── */}
      {isSending && <TypingDots />}

      {/* ── Error bar ── */}
      {!!error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* ── Input bar ── */}
      <View style={[styles.inputBar, { paddingBottom: 12 + (Platform.OS === 'ios' ? 0 : 0) }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your HVG Guide…"
          placeholderTextColor="#475569"
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isSending || !input.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#475569', fontSize: 12 },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },

  historyLoading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  historyLoadingText: { color: '#475569', fontSize: 14 },

  welcome: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeEmoji: { fontSize: 52, marginBottom: 16 },
  welcomeTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  suggestions: { width: '100%', gap: 10 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionIcon: { fontSize: 20 },
  suggestionText: { color: '#c7d2fe', fontSize: 14, flex: 1 },

  messages: { padding: 16 },

  userRow: { alignItems: 'flex-end', marginBottom: 8 },
  aiRow: { alignItems: 'flex-start', marginBottom: 8 },

  userBubble: {
    backgroundColor: '#6366f1',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },

  aiGroup: { maxWidth: '88%', gap: 8 },
  aiBubble: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  aiText: { color: '#e2e8f0', fontSize: 15, lineHeight: 21 },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typingText: { color: '#475569', fontSize: 13 },

  errorBar: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#991b1b',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },

  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#0f172a',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendText: { color: '#fff', fontSize: 22, fontWeight: '700' },
});

// ─── Card styles ──────────────────────────────────────────────────────────────
const cards = StyleSheet.create({
  // Sobriety
  sobriety: {
    backgroundColor: '#134e4a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0d9488',
  },
  sobrietyLabel: { color: '#99f6e4', fontSize: 13, marginBottom: 4 },
  sobrietyDays: { color: '#f0fdf4', fontSize: 56, fontWeight: '800', lineHeight: 64 },
  sobrietyUnit: { color: '#6ee7b7', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  sobrietyBreakdown: { color: '#99f6e4', fontSize: 14, marginBottom: 8 },
  sobrietyMilestone: {
    backgroundColor: '#0f3d3a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  sobrietyMilestoneText: { color: '#6ee7b7', fontSize: 13 },

  // Crisis
  crisis: {
    backgroundColor: '#450a0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dc2626',
    gap: 10,
  },
  crisisTitle: { color: '#fca5a5', fontSize: 16, fontWeight: '700' },
  crisisSub: { color: '#f87171', fontSize: 13, marginTop: -4 },
  crisisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#7f1d1d',
  },
  crisisName: { color: '#fee2e2', fontSize: 14, fontWeight: '600' },
  crisisDetail: { color: '#fca5a5', fontSize: 13, marginTop: 2 },
  callBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  callBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Mood
  mood: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4338ca',
    gap: 4,
  },
  moodEmoji: { fontSize: 36, marginBottom: 4 },
  moodLabel: { color: '#c7d2fe', fontSize: 15, fontWeight: '600' },
  moodNote: { color: '#a5b4fc', fontSize: 13, textAlign: 'center' },
  moodCheck: { color: '#6ee7b7', fontSize: 12, marginTop: 4 },

  // Chores
  chore: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#44403c',
    gap: 8,
  },
  choreTitle: { color: '#e7e5e4', fontSize: 15, fontWeight: '700' },
  choreEmpty: { color: '#78716c', fontSize: 14 },
  choreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  choreIcon: { fontSize: 18 },
  choreName: { color: '#d6d3d1', fontSize: 14, fontWeight: '500' },
  choreDate: { color: '#78716c', fontSize: 12, marginTop: 1 },

  // Events
  event: {
    backgroundColor: '#0c1a2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e40af',
    gap: 8,
  },
  eventTitle: { color: '#bfdbfe', fontSize: 15, fontWeight: '700' },
  eventRow: { paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1e3a5f' },
  eventName: { color: '#dbeafe', fontSize: 14, fontWeight: '500' },
  eventTime: { color: '#60a5fa', fontSize: 12, marginTop: 2 },
});

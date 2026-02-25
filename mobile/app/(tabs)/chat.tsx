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
} from 'react-native';
import { useChatSession } from '@/features/ai-chat/useChatSession';
import { useAuth } from '@/lib/auth/AuthContext';
import type { ChatMessage } from '@/lib/api/routes';

const SUGGESTIONS = [
  "How am I doing on my chores?",
  "What's coming up this week?",
  "I'm feeling grateful today",
];

export default function ChatScreen() {
  const { appUser } = useAuth();
  const { messages, sendMessage, isSending } = useChatSession();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recovery Guide</Text>
        <Text style={styles.headerSub}>Powered by Gemini 2.5</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.welcome}>
          <Text style={styles.welcomeEmoji}>🌱</Text>
          <Text style={styles.welcomeTitle}>Hi, {firstName}!</Text>
          <Text style={styles.welcomeText}>
            I'm your recovery guide. Ask me about your schedule, chores,
            sobriety stats, or how you're feeling today.
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestion}
                onPress={() => sendMessage(s)}
                disabled={isSending}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item: m }) => (
            <View
              style={[
                styles.bubble,
                m.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.role === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {m.content}
              </Text>
            </View>
          )}
        />
      )}

      {isSending && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.typingText}>Guide is thinking…</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your recovery guide…"
          placeholderTextColor="#475569"
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={isSending || !input.trim()}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#475569', fontSize: 12 },
  welcome: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },
  welcomeEmoji: { fontSize: 48, marginBottom: 16 },
  welcomeTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  suggestions: { width: '100%', gap: 8 },
  suggestion: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12 },
  suggestionText: { color: '#6366f1', fontSize: 14 },
  messages: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  userBubble: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  userText: { color: '#fff' },
  aiText: { color: '#e2e8f0' },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  typingText: { color: '#475569', fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});

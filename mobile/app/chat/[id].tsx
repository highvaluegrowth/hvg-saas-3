import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';

import { useAuth } from '@/lib/auth/AuthContext';
import { chatApi } from '@/lib/api/routes';
import { colors } from '@/lib/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date | null;
  component?: string;
  componentData?: unknown;
  isPending?: boolean;
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const timeStr = msg.createdAt ? format(msg.createdAt, 'h:mm a') : '';

  return (
    <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
          {msg.text}
        </Text>
        {msg.isPending ? (
          <ActivityIndicator
            size={10}
            color={isOwn ? 'rgba(255,255,255,0.6)' : colors.text.muted}
            style={{ marginTop: 4, alignSelf: 'flex-end' }}
          />
        ) : timeStr ? (
          <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther]}>
            {timeStr}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Chat Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const uid = firebaseUser?.uid ?? '';
  const isAiChat = type === 'ai_chat';

  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [conversationTitle, setConversationTitle] = useState(
    isAiChat ? 'HVG Outlet' : 'Conversation'
  );

  const flatListRef = useRef<FlatList>(null);

  // ── Fetch conversation title ──────────────────────────────────
  useEffect(() => {
    if (!id) return;
    firestore()
      .collection('conversations')
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data?.title) setConversationTitle(data.title);
        }
      })
      .catch(() => {});
  }, [id]);

  // ── Real-time messages listener ───────────────────────────────
  useEffect(() => {
    if (!id) return;

    const unsub = firestore()
      .collection('conversations')
      .doc(id)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(60)
      .onSnapshot(
        (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          const msgs: Message[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            const createdAt: Date | null = d.createdAt?.toDate?.() ?? null;
            return {
              id: doc.id,
              senderId: d.senderId ?? '',
              text: d.text ?? '',
              createdAt,
              component: d.component,
              componentData: d.componentData,
            };
          });
          setMessages(msgs);
          setLoadingMessages(false);

          // Clear pending messages that have been confirmed in Firestore
          if (msgs.length > 0) {
            setPendingMessages((prev) =>
              prev.filter(
                (p) =>
                  !msgs.some(
                    (m) =>
                      m.senderId === uid &&
                      m.text === p.text &&
                      m.createdAt != null &&
                      p.createdAt != null &&
                      Math.abs(m.createdAt.getTime() - p.createdAt.getTime()) < 10_000
                  )
              )
            );
          }
        },
        () => {
          setLoadingMessages(false);
        }
      );

    return () => unsub();
  }, [id, uid]);

  // ── Send ──────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending || !uid) return;

    setInputText('');
    setIsSending(true);

    // Optimistic message
    const tempId = `pending-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: uid,
      text,
      createdAt: new Date(),
      isPending: true,
    };
    setPendingMessages((prev) => [optimisticMsg, ...prev]);

    try {
      if (isAiChat) {
        // AI flow: backend writes both user msg + AI reply to Firestore
        await chatApi.send({ message: text, conversationId: id });
        // Firestore listener will surface both; clear the optimistic message
        setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        // Human conversation: write directly to Firestore
        const batch = firestore().batch();
        const msgRef = firestore()
          .collection('conversations')
          .doc(id)
          .collection('messages')
          .doc();
        batch.set(msgRef, {
          senderId: uid,
          text,
          createdAt: firestore.FieldValue.serverTimestamp(),
          readBy: [uid],
        });
        const convoRef = firestore().collection('conversations').doc(id);
        batch.update(convoRef, {
          lastMessage: {
            text,
            senderId: uid,
            createdAt: firestore.FieldValue.serverTimestamp(),
          },
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Error', 'Message failed to send. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, uid, id, isAiChat]);

  // Combined display list: pending (newest first) + Firestore messages (newest first)
  // FlatList is inverted, so index 0 = bottom of screen = newest
  const displayMessages: Message[] = [...pendingMessages, ...messages];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ───────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isAiChat && (
            <View style={styles.aiDot}>
              <MaterialIcons name="auto-awesome" size={14} color={colors.primary.DEFAULT} />
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversationTitle}
          </Text>
        </View>

        {/* Spacer to balance back button */}
        <View style={{ width: 40 }} />
      </View>

      {/* ── Messages ─────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        {loadingMessages ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Bubble msg={item} isOwn={item.senderId === uid} />
            )}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChatWrap}>
                <MaterialIcons
                  name="auto-awesome"
                  size={36}
                  color={colors.primary.DEFAULT}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.emptyChatText}>
                  {isAiChat
                    ? 'Say hello to HVG Outlet. Ask anything about your recovery journey.'
                    : 'No messages yet. Start the conversation.'}
                </Text>
              </View>
            }
          />
        )}

        {/* ── Input bar ──────────────────────────────── */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isAiChat ? 'Ask HVG Outlet…' : 'Type a message…'}
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendBtn,
              (!inputText.trim() || isSending) && styles.sendBtnDisabled,
            ]}
            disabled={!inputText.trim() || isSending}
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  aiDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primary.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Messages
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  emptyChatWrap: {
    // For inverted FlatList, this renders at the "visual top" (logical bottom)
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 4,
  },
  emptyChatText: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bubbles
  bubbleWrap: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  bubbleWrapOwn: {
    alignSelf: 'flex-end',
  },
  bubbleWrapOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  bubbleOwn: {
    backgroundColor: colors.primary.dark,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextOwn: {
    color: '#fff',
  },
  bubbleTextOther: {
    color: colors.text.primary,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  bubbleTimeOwn: {
    color: 'rgba(255,255,255,0.55)',
  },
  bubbleTimeOther: {
    color: colors.text.muted,
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.primary,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bg.elevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});

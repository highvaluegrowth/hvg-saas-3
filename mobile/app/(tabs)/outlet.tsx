import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isToday, isYesterday } from 'date-fns';

import { useAuth } from '@/lib/auth/AuthContext';
import { colors } from '@/lib/constants/theme';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationDoc {
  id: string;
  type: 'ai_chat' | 'dm' | 'group' | 'course' | 'event' | 'application_thread' | 'system_alert';
  participants: string[];
  title?: string;
  lastMessage?: { text: string; senderId: string; createdAt: FirebaseFirestoreTypes.Timestamp | null };
  updatedAt?: FirebaseFirestoreTypes.Timestamp | null;
  metadata?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatThreadTime(ts: FirebaseFirestoreTypes.Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

const TYPE_ICONS: Record<string, string> = {
  ai_chat: 'auto-awesome',
  dm: 'person',
  group: 'group',
  course: 'school',
  event: 'event',
  application_thread: 'assignment',
  system_alert: 'notifications',
};

const TYPE_LABELS: Record<string, string> = {
  ai_chat: 'HVG Outlet',
  dm: 'Direct Message',
  group: 'Group',
  course: 'Course',
  event: 'Event',
  application_thread: 'Application',
  system_alert: 'System',
};

// ─── Thread Row ───────────────────────────────────────────────────────────────

function ThreadRow({
  convo,
  uid,
  onPress,
}: {
  convo: ConversationDoc;
  uid: string;
  onPress: () => void;
}) {
  const isAi = convo.type === 'ai_chat';
  const iconName = TYPE_ICONS[convo.type] ?? 'chat';
  const title = convo.title ?? TYPE_LABELS[convo.type] ?? 'Conversation';
  const lastText = convo.lastMessage?.text ?? 'No messages yet';
  const timeStr = formatThreadTime(convo.updatedAt);
  const isLastMine = convo.lastMessage?.senderId === uid;

  return (
    <TouchableOpacity
      style={styles.threadRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.threadIcon, isAi && styles.threadIconAi]}>
        <MaterialIcons
          name={iconName as any}
          size={22}
          color={isAi ? colors.primary.DEFAULT : colors.text.secondary}
        />
      </View>

      {/* Body */}
      <View style={styles.threadBody}>
        <View style={styles.threadHeaderRow}>
          <Text style={styles.threadTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.threadTime}>{timeStr}</Text>
        </View>
        <Text style={styles.threadPreview} numberOfLines={1}>
          {isLastMine && <Text style={styles.youPrefix}>You: </Text>}
          {lastText}
        </Text>
      </View>

      <MaterialIcons name="chevron-right" size={18} color={colors.text.muted} />
    </TouchableOpacity>
  );
}

// ─── Outlet Screen ────────────────────────────────────────────────────────────

export default function OutletScreen() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 80; // space for FAB

  const uid = firebaseUser?.uid ?? null;

  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOutlet, setCreatingOutlet] = useState(false);

  // ── Real-time conversations listener ─────────────────────────
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsub = firestore()
      .collection('conversations')
      .where('participants', 'array-contains', uid)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(
        (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          const docs: ConversationDoc[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ConversationDoc, 'id'>),
          }));
          setConversations(docs);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

    return () => unsub();
  }, [uid]);

  // ── Outlet AI trigger ─────────────────────────────────────────
  const handleOutletPress = async () => {
    if (!uid || creatingOutlet) return;

    // Re-use existing ai_chat if one exists
    const existing = conversations.find((c) => c.type === 'ai_chat');
    if (existing) {
      router.push({ pathname: '/chat/[id]', params: { id: existing.id, type: 'ai_chat' } });
      return;
    }

    // Create new ai_chat conversation (sentinel pattern)
    setCreatingOutlet(true);
    try {
      const docRef = firestore().collection('conversations').doc();
      await docRef.set({
        type: 'ai_chat',
        participants: [uid, 'system_ai'],
        tenantId: null,
        title: 'HVG Outlet',
        lastMessage: null,
        metadata: {},
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      router.push({ pathname: '/chat/[id]', params: { id: docRef.id, type: 'ai_chat' } });
    } catch {
      Alert.alert('Error', 'Could not start Outlet. Please try again.');
    } finally {
      setCreatingOutlet(false);
    }
  };

  const handleThreadPress = (convo: ConversationDoc) => {
    router.push({ pathname: '/chat/[id]', params: { id: convo.id, type: convo.type } });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Outlet</Text>
          <Text style={styles.headerSubtitle}>Messages & AI Chat</Text>
        </View>
      </View>

      {/* Thread list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="chat-bubble-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Tap the Outlet button below to start chatting with AI.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThreadRow
              convo={item}
              uid={uid ?? ''}
              onPress={() => handleThreadPress(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}

      {/* Outlet FAB */}
      <View style={[styles.fabContainer, { bottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOutletPress}
          activeOpacity={0.85}
          disabled={creatingOutlet}
          accessibilityLabel="Chat with HVG Outlet AI"
          accessibilityRole="button"
        >
          {creatingOutlet ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              <Text style={styles.fabLabel}>Chat with Outlet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 1,
  },

  // Empty / Loading
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Thread row
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    minHeight: 72,
  },
  threadIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadIconAi: {
    backgroundColor: colors.primary.glow,
    borderColor: colors.primary.dark + '55',
  },
  threadBody: {
    flex: 1,
    gap: 3,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  threadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  threadTime: {
    fontSize: 11,
    color: colors.text.muted,
    flexShrink: 0,
  },
  threadPreview: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  youPrefix: {
    color: colors.text.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.DEFAULT,
    marginLeft: 72,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    minWidth: 200,
    backgroundColor: colors.primary.dark,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

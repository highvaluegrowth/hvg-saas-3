import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { GiftedChat, Bubble, Send, IMessage } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { inboxApi, type ChatMessage as APIMessage } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { appUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => inboxApi.getMessages(chatId!),
    refetchInterval: 5000, // Poll for new messages every 5s
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => inboxApi.sendMessage(chatId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const messages: IMessage[] = useMemo(() => {
    return (messagesData?.messages ?? []).map((m: APIMessage) => ({
      _id: m.id,
      text: m.content,
      createdAt: new Date(m.createdAt),
      user: {
        _id: m.senderId,
        name: m.senderName,
        avatar: m.senderImage || undefined,
      },
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [messagesData]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    if (newMessages.length > 0) {
      sendMutation.mutate(newMessages[0].text);
    }
  }, [sendMutation]);

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <GiftedChat
        messages={messages}
        onSend={(msgs) => onSend(msgs)}
        user={{
          _id: appUser?.uid || '',
          name: appUser?.displayName || 'Me',
          avatar: appUser?.photoURL || undefined,
        }}
        renderBubble={(props) => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: '#6366f1' },
              left: { backgroundColor: '#1e293b' },
            }}
            textStyle={{
              right: { color: '#fff' },
              left: { color: '#f8fafc' },
            }}
          />
        )}
        renderSend={(props) => (
          <Send {...props}>
            <View style={styles.sendBtn}>
              <MaterialIcons name="send" size={24} color="#6366f1" />
            </View>
          </Send>
        )}
        backgroundColor="#0a0f1e"
        messagesContainerStyle={{ backgroundColor: '#0a0f1e' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#0a0f1e',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  sendBtn: { marginRight: 10, marginBottom: 5 },
});

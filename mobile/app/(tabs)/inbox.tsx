import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { inboxApi, type Chat } from '@/lib/api/routes';
import { AppHeader } from '@/components/AppHeader';
import { formatDistanceToNow } from 'date-fns';

export default function InboxScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['chats'],
    queryFn: inboxApi.getChats,
  });

  const chats = data?.chats ?? [];

  const renderChatItem = ({ item }: { item: Chat }) => {
    const isGroup = ['house', 'course', 'event', 'group'].includes(item.type);
    const displayName = item.metadata?.name || 'Private Chat';
    const lastMsg = item.lastMessage?.content || 'No messages yet';
    const time = item.updatedAt ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true }) : '';

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push({ pathname: '/inbox/[chatId]', params: { chatId: item.id } })}
      >
        <View style={styles.avatarWrap}>
          {item.metadata?.image ? (
            <Image 
              source={{ uri: item.metadata.image }} 
              style={styles.avatar} 
              alt={displayName}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isGroup ? '#6366f1' : '#10b981' }]}>
              <MaterialIcons name={isGroup ? 'groups' : 'person'} size={24} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.chatBody}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.chatTime}>{time}</Text>
          </View>
          <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Inbox" />
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="forum" size={64} color="#1e293b" />
              <Text style={styles.emptyTitle}>Your Inbox is empty</Text>
              <Text style={styles.emptySub}>Messages and updates will appear here.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  listContent: { paddingBottom: 100 },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    alignItems: 'center',
  },
  avatarWrap: { marginRight: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBody: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { color: '#f8fafc', fontSize: 16, fontWeight: '600', flex: 1 },
  chatTime: { color: '#64748b', fontSize: 12 },
  lastMsg: { color: '#94a3b8', fontSize: 14 },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8 },
});

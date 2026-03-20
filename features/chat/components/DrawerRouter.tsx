'use client';

import { useChatStore } from '@/lib/stores/useChatStore';
import { ThreadList } from './ThreadList';
import { ActiveThread } from './ActiveThread';
import type { Conversation } from '../schemas/chat.schemas';

interface DrawerRouterProps {
  conversations: Conversation[];
  conversationsLoading?: boolean;
  currentUserId: string;
}

export function DrawerRouter({
  conversations,
  conversationsLoading,
  currentUserId,
}: DrawerRouterProps) {
  const { activeConversationId } = useChatStore();

  if (activeConversationId) {
    const active = conversations.find((c) => c.id === activeConversationId);
    return (
      <ActiveThread
        conversationId={activeConversationId}
        title={active?.title ?? null}
        conversationType={active?.type ?? 'dm'}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <ThreadList
      conversations={conversations}
      loading={conversationsLoading}
    />
  );
}

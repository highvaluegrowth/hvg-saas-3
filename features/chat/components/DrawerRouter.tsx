'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/stores/useChatStore';
import { createConversation } from '../services/chatService';
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
  const { activeConversationId, setActiveConversation } = useChatStore();

  // Handle __new_outlet__ sentinel — create a real ai_chat conversation then navigate into it
  useEffect(() => {
    if (activeConversationId !== '__new_outlet__' || !currentUserId) return;
    let cancelled = false;
    createConversation({
      type: 'ai_chat',
      participants: [currentUserId, 'system_ai'],
      tenantId: null,
      title: 'Outlet Chat',
      lastMessage: null,
      metadata: {},
    }).then((newId) => {
      if (!cancelled) setActiveConversation(newId);
    }).catch((err) => {
      console.error('Failed to create outlet chat:', err);
      if (!cancelled) setActiveConversation(null);
    });
    return () => { cancelled = true; };
  }, [activeConversationId, currentUserId, setActiveConversation]);

  if (activeConversationId && activeConversationId !== '__new_outlet__') {
    const active = conversations.find((c) => c.id === activeConversationId);
    // Default to 'ai_chat' when conversation not yet in subscription (newly created)
    const conversationType = active?.type ?? 'ai_chat';
    return (
      <ActiveThread
        conversationId={activeConversationId}
        title={active?.title ?? 'Outlet Chat'}
        conversationType={conversationType}
        currentUserId={currentUserId}
      />
    );
  }

  // Show spinner while __new_outlet__ sentinel is being resolved
  if (activeConversationId === '__new_outlet__') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThreadList
      conversations={conversations}
      loading={conversationsLoading}
    />
  );
}

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi, type ChatMessage } from '@/lib/api/routes';

export function useChatSession(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (text: string) =>
      chatApi.send({ message: text, conversationId }),
    onSuccess: (data, userMessage) => {
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'user',
          content: userMessage,
          createdAt: now,
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          createdAt: now,
        },
      ]);
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      mutation.mutate(text);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId]
  );

  return {
    messages,
    sendMessage,
    isSending: mutation.isPending,
    conversationId,
    error: mutation.error,
  };
}

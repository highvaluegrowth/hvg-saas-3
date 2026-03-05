import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi, type ChatMessage } from '@/lib/api/routes';

export function useChatSession(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (text: string) =>
      chatApi.send({ message: text, conversationId }),
    onSuccess: (data) => {
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      // Append AI reply — user message was already added optimistically
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply || '(No response)',
          createdAt: new Date().toISOString(),
        },
      ]);
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to reach HVG Guide. Check your connection and try again.';
      setErrorMessage(msg);
      // Roll back the optimistic user message so user can retry
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setErrorMessage(null);
      // Optimistic update: show user message immediately
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);
      mutation.mutate(trimmed);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId]
  );

  return {
    messages,
    sendMessage,
    isSending: mutation.isPending,
    conversationId,
    error: errorMessage,
  };
}

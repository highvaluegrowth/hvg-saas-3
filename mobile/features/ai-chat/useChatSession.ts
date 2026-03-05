import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi, type ChatMessage } from '@/lib/api/routes';

export function useChatSession(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load most recent conversation history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const { conversations } = await chatApi.getHistory();
        if (conversations && conversations.length > 0) {
          const latestId = conversations[0].id;
          setConversationId(latestId);
          const { messages: history } = await chatApi.getHistory(latestId);
          if (history && history.length > 0) {
            setMessages(history);
          }
        }
      } catch {
        // No history or network error — start fresh
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (text: string) =>
      chatApi.send({ message: text, conversationId }),
    onSuccess: (data) => {
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      // Append AI reply with optional rich card data
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply || '(No response)',
          createdAt: new Date().toISOString(),
          component: data.component,
          componentData: data.componentData,
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
    isLoadingHistory,
    conversationId,
    error: errorMessage,
  };
}

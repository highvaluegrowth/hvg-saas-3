import { getAuth } from 'firebase/auth';

import { ChatMessage } from '@/lib/stores/aiSidebarStore';

export async function fetchChatHistory(conversationId: string): Promise<ChatMessage[]> {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`/api/ai/chat/history?conversationId=${conversationId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error('Failed to fetch history');
    }

    const data = await res.json();
    return data.messages as ChatMessage[];
}

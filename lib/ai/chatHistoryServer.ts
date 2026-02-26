import { adminDb } from '@/lib/firebase/admin';

export interface SerializedMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    component?: string;
    componentData?: unknown;
    createdAt: number;
}

export async function getConversationHistoryServer(conversationId: string): Promise<SerializedMessage[]> {
    try {
        const messagesSnap = await adminDb
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .limit(50)
            .get();

        return messagesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                role: data.role as 'user' | 'assistant',
                content: data.content,
                component: data.component,
                componentData: data.componentData,
                createdAt: data.createdAt?.toMillis() ?? Date.now(),
            };
        });
    } catch (error) {
        console.error('Failed to fetch conversation history:', error);
        return [];
    }
}

import { getAuth } from 'firebase/auth';
import { ChatMessage } from '@/lib/stores/aiSidebarStore';

export async function fetchChatHistory(conversationId: string, userRole?: string): Promise<ChatMessage[]> {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const isSuperAdmin = userRole === 'super_admin';
    const isOperator = ['tenant_admin', 'staff_admin', 'admin', 'house_manager', 'staff'].includes(userRole || '');
    
    let endpoint = '/api/ai/outlet/resident/history';
    if (isSuperAdmin) endpoint = '/api/ai/outlet/director/history';
    else if (isOperator) endpoint = '/api/ai/outlet/operator/history';

    const res = await fetch(`${endpoint}?conversationId=${conversationId}`, {
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

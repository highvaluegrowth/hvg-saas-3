import { ChatMessage } from '@/lib/stores/aiSidebarStore';
import { slashCommandToPrompt } from '@/lib/ai/commandParser';
import { getRouteContext } from '@/lib/ai/routeContextMap';

interface SendChatParams {
    message: string;
    conversationId: string | null;
    pathname: string;
    userRole: string; // From auth hook
}

interface ChatResponse {
    reply: string;
    conversationId: string;
    error?: string;
    component?: string;
    componentData?: unknown;
}

export async function sendChatMessage({ message, conversationId, pathname, userRole }: SendChatParams): Promise<ChatResponse> {
    const isOperator = ['admin', 'house_manager', 'staff', 'super_admin'].includes(userRole);

    // Transform the message if it's a known slash command
    let processedMessage = message;
    const trimmed = message.trim();
    if (trimmed.startsWith('/')) {
        const rawCmd = trimmed.slice(1).split(' ')[0].toLowerCase();
        processedMessage = slashCommandToPrompt(
            { command: rawCmd, args: trimmed.slice(rawCmd.length + 1).trim() },
            isOperator ? 'operator' : 'resident'
        );
    }

    const routeContext = getRouteContext(pathname);

    const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: processedMessage,
            conversationId: conversationId || undefined,
            routeContext,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    return res.json() as Promise<ChatResponse>;
}

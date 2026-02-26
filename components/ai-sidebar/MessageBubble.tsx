'use client';

import type { ChatMessage } from '@/lib/stores/aiSidebarStore';
import { CommandCard } from './commands/CommandCard';

interface MessageBubbleProps {
    message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
            <div
                className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                    }`}
                style={
                    isUser
                        ? { background: '#FEF3C7', color: '#1C1917', border: '1px solid rgba(245,158,11,0.2)' }
                        : { background: '#ECEDE8', color: '#1C1917', border: '1px solid rgba(113,131,85,0.15)' }
                }
            >
                {message.content}
            </div>

            {message.component && !!message.componentData && (
                <div className={`w-full ${isUser ? 'pr-2' : 'pl-2'}`}>
                    <CommandCard type={message.component} data={message.componentData as any} />
                </div>
            )}

            <span className="text-xs px-1" style={{ color: '#78716C' }}>{time}</span>
        </div>
    );
}

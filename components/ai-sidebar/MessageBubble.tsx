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
                        ? {
                            background: 'linear-gradient(135deg, rgba(8,145,178,0.35) 0%, rgba(6,78,100,0.5) 100%)',
                            color: '#E0F7FC',
                            border: '1px solid rgba(8,145,178,0.35)',
                        }
                        : {
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.88)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }
                }
            >
                {message.content}
            </div>

            {message.component && !!message.componentData && (
                <div className={`w-full ${isUser ? 'pr-2' : 'pl-2'}`}>
                    <CommandCard type={message.component} data={message.componentData as Record<string, unknown>} />
                </div>
            )}

            <span className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{time}</span>
        </div>
    );
}

'use client';

import { forwardRef } from 'react';
import type { ChatMessage } from '@/lib/stores/aiSidebarStore';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isDirector?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
    function MessageList({ messages, isLoading, isDirector }, ref) {
        return (
            <div
                ref={ref}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
                style={{ fontFamily: 'inherit' }}
            >
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center pt-12 gap-3">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{
                                background: isDirector
                                    ? 'linear-gradient(135deg, rgba(217,70,239,0.2) 0%, rgba(139,92,246,0.1) 100%)'
                                    : 'linear-gradient(135deg, rgba(8,145,178,0.2) 0%, rgba(52,211,153,0.1) 100%)',
                                border: isDirector ? '1px solid rgba(217,70,239,0.25)' : '1px solid rgba(8,145,178,0.25)',
                            }}
                        >
                            <svg className="w-6 h-6" style={{ color: isDirector ? '#E879F9' : '#67E8F9' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {isDirector ? 'Strategic System Intelligence is ready.' : 'Your AI assistant is ready.'}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Type a message or try <span className="font-mono" style={{ color: isDirector ? '#E879F9' : '#67E8F9' }}>/help</span>
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isDirector={isDirector} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="flex gap-1 items-center px-4 py-3 rounded-2xl rounded-bl-sm"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: isDirector ? '#D946EF' : '#67E8F9', animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: isDirector ? '#D946EF' : '#67E8F9', animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: isDirector ? '#D946EF' : '#67E8F9', animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

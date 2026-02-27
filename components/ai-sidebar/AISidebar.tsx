'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAISidebarStore } from '@/lib/stores/aiSidebarStore';
import { sendChatMessage } from '@/lib/ai/chatService';
import { fetchChatHistory } from '@/lib/ai/chatHistoryClient';

import { SidebarHeader } from './SidebarHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function AISidebar() {
    const { user } = useAuth();
    const pathname = usePathname();

    const {
        isOpen,
        persona,
        messages,
        conversationId,
        isLoading,
        setOpen,
        addMessage,
        setLoading,
        setConversationId,
        clearHistory,
        setPersona,
        hydrateMessages,
    } = useAISidebarStore();

    const listRef = useRef<HTMLDivElement>(null);
    const [hasHydrated, setHasHydrated] = useState(false);

    // Auto-set persona based on role
    useEffect(() => {
        if (user?.role) {
            const isOperator = ['admin', 'house_manager', 'staff', 'super_admin'].includes(user.role);
            setPersona(isOperator ? 'operator' : 'recovery');
        }
    }, [user?.role, setPersona]);

    // Hydrate history from Firestore on mount if we have a conversationId
    useEffect(() => {
        if (conversationId && !hasHydrated && isOpen) {
            setLoading(true);
            fetchChatHistory(conversationId)
                .then(history => {
                    if (history.length > 0) {
                        hydrateMessages(history);
                    }
                })
                .catch(console.error)
                .finally(() => {
                    setLoading(false);
                    setHasHydrated(true);
                });
        }
    }, [conversationId, hasHydrated, isOpen, hydrateMessages, setLoading]);

    // Auto-scroll logic
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages.length, isLoading]);

    // Resizing logic
    const isResizing = useRef(false);
    const { sidebarWidth, setSidebarWidth } = useAISidebarStore();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = window.innerWidth - e.clientX;
            // constraints
            if (newWidth > 320 && newWidth < window.innerWidth * 0.5) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [setSidebarWidth]);

    const handleMouseDown = () => {
        isResizing.current = true;
    };

    if (!isOpen) {
        return null;
    }

    async function handleSend(text: string) {
        if (!text.trim() || isLoading) return;

        // Optimistic UI update
        addMessage({ role: 'user', content: text });
        setLoading(true);

        try {
            const res = await sendChatMessage({
                message: text,
                conversationId,
                pathname: pathname ?? '/dashboard',
                userRole: user?.role ?? 'resident',
            });

            setConversationId(res.conversationId);

            // Attach component card if the agent returned structured data
            addMessage({
                role: 'assistant',
                content: res.reply,
                ...(res.component && res.componentData ? {
                    component: res.component,
                    componentData: res.componentData
                } : {})
            });

        } catch (err) {
            addMessage({
                role: 'assistant',
                content: `Error: ${err instanceof Error ? err.message : 'Failed to connect to AI.'}`,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden transition-opacity"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={`flex flex-col shadow-2xl transition-transform duration-300 z-50 lg:z-40
                    fixed right-0 
                    bottom-0 h-[85vh] w-full rounded-t-3xl border-t  /* Mobile bottom drawer */
                    lg:top-0 lg:h-screen lg:rounded-none lg:border-t-0 lg:border-l /* Desktop side panel */
                `}
                style={{
                    width: typeof window !== 'undefined' && window.innerWidth >= 1024
                        ? `${sidebarWidth}px`
                        : '100%',
                    background: 'rgba(248, 250, 252, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(8, 145, 178, 0.15)',
                    transform: isOpen ? 'translate(0, 0)' : 'translate(0, 100%)',
                }}
            >
                {/* Drag Handle for desktop */}
                <div
                    className="hidden lg:block absolute left-0 top-0 w-2 h-full cursor-col-resize -translate-x-1/2 bg-transparent hover:bg-cyan-500/20 transition-colors z-50"
                    onMouseDown={handleMouseDown}
                />
                {/* Visual handle for mobile drawer */}
                <div className="w-full flex justify-center pt-3 pb-1 lg:hidden">
                    <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
                </div>

                <SidebarHeader
                    persona={persona}
                    onClose={() => setOpen(false)}
                    onClear={() => {
                        if (confirm('Clear this conversation?')) clearHistory();
                    }}
                />

                <MessageList
                    ref={listRef}
                    messages={messages}
                    isLoading={isLoading}
                />

                <ChatInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    userRole={user?.role}
                />
            </div>
        </>
    );
}

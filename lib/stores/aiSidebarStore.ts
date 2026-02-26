import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentPersona = 'recovery' | 'operator';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    component?: string;      // e.g. 'EventsMiniCard' — triggers rendering a card
    componentData?: unknown; // props for the command component
    createdAt: number;       // epoch ms
}

interface AISidebarState {
    isOpen: boolean;
    persona: AgentPersona;
    messages: ChatMessage[];
    conversationId: string | null;
    isLoading: boolean;

    // Actions
    setOpen: (open: boolean) => void;
    toggleOpen: () => void;
    setPersona: (persona: AgentPersona) => void;
    addMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => ChatMessage;
    setLoading: (loading: boolean) => void;
    setConversationId: (id: string) => void;
    clearHistory: () => void;
    hydrateMessages: (msgs: ChatMessage[]) => void;
}

export const useAISidebarStore = create<AISidebarState>()(
    persist(
        (set, get) => ({
            isOpen: false,
            persona: 'recovery',
            messages: [],
            conversationId: null,
            isLoading: false,

            setOpen: (open) => set({ isOpen: open }),
            toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

            setPersona: (persona) => set({ persona }),

            addMessage: (msg) => {
                const message: ChatMessage = {
                    ...msg,
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    createdAt: Date.now(),
                };
                set((s) => ({ messages: [...s.messages, message] }));
                return message;
            },

            setLoading: (isLoading) => set({ isLoading }),

            setConversationId: (conversationId) => set({ conversationId }),

            clearHistory: () => set({ messages: [], conversationId: null }),

            hydrateMessages: (messages) => set({ messages }),
        }),
        {
            name: 'hvg-ai-sidebar',
            // Only persist conversationId + isOpen — messages rehydrate from Firestore
            partialize: (state) => ({
                conversationId: state.conversationId,
                isOpen: state.isOpen,
            }),
        }
    )
);

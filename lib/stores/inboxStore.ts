import { create } from 'zustand';

interface InboxState {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    incrementUnreadCount: (amount?: number) => void;
    decrementUnreadCount: (amount?: number) => void;
    clearUnreadCount: () => void;
}

export const useInboxStore = create<InboxState>((set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
    incrementUnreadCount: (amount = 1) =>
        set((state) => ({ unreadCount: state.unreadCount + amount })),
    decrementUnreadCount: (amount = 1) =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),
    clearUnreadCount: () => set({ unreadCount: 0 }),
}));

import { create } from 'zustand';

export type ChatFilterType = 'all' | 'ai' | 'alerts' | 'dms';

interface ChatStore {
  isOpen: boolean;
  activeConversationId: string | null;
  filterType: ChatFilterType;
  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveConversation: (id: string | null) => void;
  setFilterType: (type: ChatFilterType) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  activeConversationId: null,
  filterType: 'all',

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setFilterType: (type) => set({ filterType: type }),
}));

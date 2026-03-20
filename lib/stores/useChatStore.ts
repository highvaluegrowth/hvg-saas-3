import { create } from 'zustand';

export type ChatFilterType = 'all' | 'outlet' | 'dms' | 'applications' | 'requests' | 'incidents' | 'system';

interface ChatStore {
  isOpen: boolean;
  activeConversationId: string | null;
  filterType: ChatFilterType;
  isVoiceMode: boolean;
  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveConversation: (id: string | null) => void;
  setFilterType: (type: ChatFilterType) => void;
  setVoiceMode: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  activeConversationId: null,
  filterType: 'all',
  isVoiceMode: false,

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setFilterType: (type) => set({ filterType: type }),
  setVoiceMode: (v) => set({ isVoiceMode: v }),
}));

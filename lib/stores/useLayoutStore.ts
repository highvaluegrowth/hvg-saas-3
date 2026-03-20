import { create } from 'zustand';

interface LayoutStore {
  sidebarWidth: number; // px — used when sidebar is expanded (min 240, max 400)
  drawerWidth: number;  // px — comms drawer width (min 320, max 800)
  setSidebarWidth: (w: number) => void;
  setDrawerWidth: (w: number) => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarWidth: 256,
  drawerWidth: 380,
  setSidebarWidth: (w) => set({ sidebarWidth: Math.min(400, Math.max(240, w)) }),
  setDrawerWidth: (w) => set({ drawerWidth: Math.min(800, Math.max(320, w)) }),
}));

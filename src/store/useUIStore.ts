import { create } from "zustand";

interface UIStore {
  isSidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarExpanded: false,
  setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
}));

import { create } from "zustand";
import { TaskStatus } from "@/lib/types";

interface UIStore {
  // Sidebar state
  isSidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;

  // Drag state for status sidebar
  isDragging: boolean;
  draggedTaskId: string | null;
  hoveredStatus: TaskStatus | null;
  mousePosition: { x: number; y: number } | null;
  setDragging: (isDragging: boolean, taskId?: string | null) => void;
  setHoveredStatus: (status: TaskStatus | null) => void;
  setMousePosition: (pos: { x: number; y: number } | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Sidebar
  isSidebarExpanded: false,
  setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),

  // Drag state
  isDragging: false,
  draggedTaskId: null,
  hoveredStatus: null,
  mousePosition: null,
  setDragging: (isDragging, taskId = null) =>
    set({
      isDragging,
      draggedTaskId: taskId,
      hoveredStatus: isDragging ? null : null,
      mousePosition: isDragging ? null : null,
    }),
  setHoveredStatus: (status) => set({ hoveredStatus: status }),
  setMousePosition: (pos) => set({ mousePosition: pos }),
}));

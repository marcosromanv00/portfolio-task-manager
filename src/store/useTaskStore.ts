import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Task, TaskStore, TaskStatus } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (taskInput) =>
        set((state) => {
          const newTask: Task = {
            ...taskInput,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            // Ensure default visual properties if missing
            bubble: {
              x: taskInput.bubble.x,
              y: taskInput.bubble.y,
              radius: taskInput.bubble.radius,
              color: taskInput.bubble.color || "#3b82f6", // Default blue-500
              velocity: { x: 0, y: 0 },
            },
          };
          return { tasks: [...state.tasks, newTask] };
        }),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t,
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      moveTask: (id, position) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, bubble: { ...t.bubble, x: position.x, y: position.y } }
              : t,
          ),
        })),

      updateTaskStatus: (id, status) =>
        set((state) => {
          const colors: Record<TaskStatus, string> = {
            todo: "#3b82f6", // blue
            "in-progress": "#f59e0b", // amber
            done: "#10b981", // emerald
            discarded: "#ef4444", // red
            backlog: "#64748b", // slate
            archived: "#f43f5e", // rose-500
          };
          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status,
                    updatedAt: new Date(),
                    bubble: {
                      ...t.bubble,
                      color: colors[status] || t.bubble.color,
                    },
                  }
                : t,
            ),
          };
        }),
    }),
    {
      name: "bubble-task-storage", // key in localStorage
      storage: createJSONStorage(() => localStorage), // default is localStorage but being explicit
      partialize: (state) => ({ tasks: state.tasks }), // only persist tasks
    },
  ),
);

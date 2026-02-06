import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Task, TaskStore, TaskStatus } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabaseClient";
import { SEED_TASKS } from "@/lib/seeds";

// Helper to handle dates that might be strings (from hydration/localStorage) or Date objects
const toISO = (date: Date | string | number | null | undefined) => {
  if (!date) return undefined;
  if (date instanceof Date) return date.toISOString();
  // Ensure it's a valid date before calling toISOString
  const d = new Date(date);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

// Helper to map Task to Supabase format (snake_case)
const mapToDB = (task: Task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  category: task.category,
  relation: task.relation,
  tags: task.tags,
  due_at: toISO(task.dueAt),
  start_at: toISO(task.startAt),
  duration_min: task.durationMin,
  is_group: task.isGroup,
  parent_id: task.parentId,
  created_at: toISO(task.createdAt),
  updated_at: toISO(task.updatedAt),
  bubble: task.bubble,
});

type PostgrestTask = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Task["priority"];
  category?: Task["category"];
  relation?: string;
  tags: string[];
  due_at?: string;
  start_at?: string;
  duration_min?: number;
  is_group: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  bubble: Task["bubble"];
};

// Helper to map Supabase format to Task (camelCase)
const mapFromDB = (data: PostgrestTask): Task => ({
  id: data.id,
  title: data.title,
  description: data.description,
  status: data.status,
  priority: data.priority,
  category: data.category,
  relation: data.relation,
  tags: data.tags || [],
  dueAt: data.due_at ? new Date(data.due_at) : undefined,
  startAt: data.start_at ? new Date(data.start_at) : undefined,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  durationMin: data.duration_min,
  isGroup: data.is_group,
  parentId: data.parent_id,
  bubble: data.bubble,
});

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      initialized: false,

      fetchTasks: async () => {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching tasks from Supabase:", error);
          return;
        }

        const localTasks = get().tasks;

        // Caso 1: Supabase vacío
        if (data && data.length === 0) {
          // Si hay tareas locales, migrar
          if (localTasks.length > 0) {
            console.log("Migrating local tasks to Supabase...");
            const { error: insertError } = await supabase
              .from("tasks")
              .insert(localTasks.map(mapToDB));

            if (insertError) console.error("Error migrating:", insertError);
            else console.log("Migration successful.");
          }
          // Si no hay nada de nada, usar SEED_TASKS
          else {
            console.log("Initializing with Seed tasks...");
            const tasksWithIds: Task[] = SEED_TASKS.map((task) => ({
              ...task,
              id: uuidv4(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            const { error: seedError } = await supabase
              .from("tasks")
              .insert(tasksWithIds.map(mapToDB));

            if (seedError) console.error("Error seeding:", seedError);
            else set({ tasks: tasksWithIds });
          }
        }
        // Caso 2: Ya hay datos en Supabase (Fuente de verdad)
        else if (data) {
          set({ tasks: data.map(mapFromDB) });
        }

        set({ initialized: true });
      },

      addTask: async (taskInput) => {
        const newTask: Task = {
          ...taskInput,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bubble: {
            x: taskInput.bubble.x,
            y: taskInput.bubble.y,
            radius: taskInput.bubble.radius,
            color: taskInput.bubble.color || "#3b82f6",
            velocity: { x: 0, y: 0 },
          },
        };

        // Optimistic update
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        const { error } = await supabase.from("tasks").insert(mapToDB(newTask));
        if (error) console.error("Error adding task to Supabase:", error);
      },

      updateTask: async (id, updates) => {
        const updatedAt = new Date();

        // Optimistic update
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt } : t,
          ),
        }));

        const { error } = await supabase
          .from("tasks")
          .update({
            ...updates,
            updated_at: updatedAt.toISOString(),
            // Map specific camelCase fields if they exist in updates
            ...(updates.dueAt && { due_at: updates.dueAt.toISOString() }),
            ...(updates.startAt && { start_at: updates.startAt.toISOString() }),
          })
          .eq("id", id);

        if (error) console.error("Error updating task in Supabase:", error);
      },

      deleteTask: async (id) => {
        // Optimistic update
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));

        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) console.error("Error deleting task from Supabase:", error);
      },

      moveTask: async (id, position) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, bubble: { ...t.bubble, x: position.x, y: position.y } }
              : t,
          ),
        }));

        // We only move in the store frequently, we should debounce the DB update
        // for performance, but for now we'll do it directly or wait for a "drag end"
        // Actually, let's update color and bubble state
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          const { error } = await supabase
            .from("tasks")
            .update({ bubble: task.bubble })
            .eq("id", id);
          if (error) console.error("Error moving task in Supabase:", error);
        }
      },

      updateTaskStatus: async (id, status) => {
        const colors: Record<TaskStatus, string> = {
          todo: "#3b82f6",
          "in-progress": "#f59e0b",
          done: "#10b981",
          discarded: "#ef4444",
          backlog: "#64748b",
          archived: "#f43f5e",
          "-": "#94a3b8",
        };

        const updatedAt = new Date();

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  updatedAt,
                  bubble: {
                    ...t.bubble,
                    color: colors[status] || t.bubble.color,
                  },
                }
              : t,
          ),
        }));

        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          const { error } = await supabase
            .from("tasks")
            .update({
              status,
              updated_at: updatedAt.toISOString(),
              bubble: task.bubble,
            })
            .eq("id", id);
          if (error) console.error("Error updating status in Supabase:", error);
        }
      },
    }),
    {
      name: "bubble-task-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    },
  ),
);

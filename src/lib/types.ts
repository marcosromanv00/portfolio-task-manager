import { z } from "zod";

export type TaskStatus =
  | "todo"
  | "in-progress"
  | "done"
  | "discarded"
  | "backlog"
  | "archived";
export type Priority = "low" | "medium" | "high" | "critical";

export type TaskCategory =
  | "Activos (Portafolio Plantillas)"
  | "Trabajo Estable"
  | "MCPs/Automatización"
  | "Tesis"
  | "Admin/Personal";

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum([
    "todo",
    "in-progress",
    "done",
    "discarded",
    "backlog",
    "archived",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  category: z
    .enum([
      "Activos (Portafolio Plantillas)",
      "Trabajo Estable",
      "MCPs/Automatización",
      "Tesis",
      "Admin/Personal",
    ])
    .optional(),
  relation: z.string().optional(),
  tags: z.array(z.string()).default([]),
  dueAt: z.date().optional(),
  startAt: z.date().optional(),
  durationMin: z.number().optional(),
  isGroup: z.boolean().default(false),
  parentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Visual/Physics State
  bubble: z.object({
    x: z.number(),
    y: z.number(),
    radius: z.number(),
    color: z.string().optional(),
    velocity: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
  }),
});

export type Task = z.infer<typeof TaskSchema>;

export interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, position: { x: number; y: number }) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
}

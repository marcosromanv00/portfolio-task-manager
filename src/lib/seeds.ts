import { Task } from "@/lib/types";
import { getBubbleRadius, getTaskColor } from "@/lib/utils";

export const SEED_TASKS: Omit<Task, "id" | "createdAt" | "updatedAt">[] = [
  {
    title: "Configurar Supabase",
    description: "Crear tabla, políticas RLS y conectar con el cliente",
    status: "in-progress",
    priority: "high",
    category: "MCPs/Automatización",
    tags: ["mcp", "supabase", "database"],
    isGroup: false,
    bubble: {
      x: 400,
      y: 300,
      radius: getBubbleRadius("high"),
      color: getTaskColor("in-progress", "MCPs/Automatización"),
    },
  },
  {
    title: "Probar Migración",
    description: "Verificar que las tareas locales se suben a la nube",
    status: "todo",
    priority: "critical",
    category: "MCPs/Automatización",
    tags: ["testing"],
    isGroup: false,
    bubble: {
      x: 200,
      y: 200,
      radius: getBubbleRadius("critical"),
      color: getTaskColor("todo", "MCPs/Automatización"),
    },
  },
  {
    title: "Escribir Tesis",
    description: "Avanzar con el capítulo de metodología",
    status: "todo",
    priority: "medium",
    category: "Tesis",
    tags: ["academic"],
    isGroup: false,
    bubble: {
      x: 600,
      y: 400,
      radius: getBubbleRadius("medium"),
      color: getTaskColor("todo", "Tesis"),
    },
  },
];

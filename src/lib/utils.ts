import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Priority } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { radius: number; label: string }
> = {
  low: { radius: 61, label: "Low" },
  medium: { radius: 79, label: "Medium" },
  high: { radius: 105, label: "High" },
  critical: { radius: 131, label: "Critical" },
  "-": { radius: 50, label: "-" },
};

export function getBubbleRadius(priority: Priority) {
  return PRIORITY_CONFIG[priority]?.radius || 79;
}

export const STATUS_COLORS = {
  todo: "#3b82f6", // blue-500
  "in-progress": "#f59e0b", // amber-500
  done: "#10b981", // emerald-500
  discarded: "#ef4444", // red-500
  backlog: "#64748b", // slate-500
  archived: "#fb7185", // rose-400
  "-": "#94a3b8", // slate-400
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Activos (Portafolio Plantillas)": "#10b981", // Emerald
  "Trabajo Estable": "#f59e0b", // Amber
  "MCPs/Automatización": "#06b6d4", // Cyan
  Tesis: "#d946ef", // Fuchsia
  "Admin/Personal": "#f97316", // Orange
};

export function getTaskColor(status: string, category?: string) {
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#cbd5e1";
}

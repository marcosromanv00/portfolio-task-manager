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
  low: { radius: 35, label: "Low" },
  medium: { radius: 45, label: "Medium" },
  high: { radius: 60, label: "High" },
  critical: { radius: 75, label: "Critical" },
};

export function getBubbleRadius(priority: Priority) {
  return PRIORITY_CONFIG[priority]?.radius || 45;
}

export const STATUS_COLORS = {
  todo: "#3b82f6", // blue-500
  "in-progress": "#f59e0b", // amber-500
  done: "#10b981", // emerald-500
  discarded: "#ef4444", // red-500
  backlog: "#64748b", // slate-500
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Activos (Portafolio Plantillas)": "#8b5cf6", // violet-500
  "Trabajo Estable": "#3b82f6", // blue-500
  "MCPs/Automatización": "#06b6d4", // cyan-500
  Tesis: "#f59e0b", // amber-500
  "Admin/Personal": "#10b981", // emerald-500
};

export function getTaskColor(status: string, category?: string) {
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#cbd5e1";
}

"use client";

import { Download } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { downloadICS } from "@/lib/exportUtils";

export function ExportButton() {
  const { tasks } = useTaskStore();

  const handleExport = () => {
    if (tasks.length === 0) {
      alert("No hay tareas para exportar.");
      return;
    }
    const withDueDate = tasks.filter((t) => t.dueAt || t.startAt).length;
    const confirmMsg = `¿Exportar ${tasks.length} tareas (${withDueDate} programadas) a ICS?`;
    if (confirm(confirmMsg)) {
      downloadICS(tasks, "mis-tareas-burbuja.ics");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 active:scale-95 text-sm font-medium"
    >
      <Download size={16} />
      Exportar a Calendario
    </button>
  );
}

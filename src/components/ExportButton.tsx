"use client";

import { Download } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { downloadICS } from "@/lib/exportUtils";

export function ExportButton() {
  const { tasks } = useTaskStore();

  const handleExport = () => {
    if (tasks.length === 0) {
      alert("No tasks to export.");
      return;
    }
    const withDueDate = tasks.filter((t) => t.dueAt || t.startAt).length;
    const confirmMsg = `Exporting ${tasks.length} tasks (${withDueDate} scheduled) to ICS?`;
    if (confirm(confirmMsg)) {
      downloadICS(tasks, "my-bubble-tasks.ics");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 active:scale-95 text-sm font-medium"
    >
      <Download size={16} />
      Export to Calendar
    </button>
  );
}

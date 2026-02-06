"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskStatus, Task, TaskCategory } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import TaskModal from "@/components/TaskModal";

import { getTaskColor } from "@/lib/utils";

// Dynamic import for BubbleCanvas to avoid SSR issues with Matter.js
const BubbleCanvas = dynamic(() => import("@/components/BubbleCanvas"), {
  ssr: false,
});

export default function Home() {
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const clearSeedData = () => {
    const seedTasks = tasks.filter((t) => t.relation === "Seed Data");
    seedTasks.forEach((t) => deleteTask(t.id));
  };

  // Seed Data function
  const seedData = () => {
    const statuses: TaskStatus[] = ["todo", "in-progress", "done"];
    const priorities = ["low", "medium", "high", "critical"] as const;
    const categories: TaskCategory[] = [
      "Activos (Portafolio Plantillas)",
      "Trabajo Estable",
      "MCPs/Automatización",
      "Tesis",
      "Admin/Personal",
    ];

    for (let i = 0; i < 5; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const category =
        categories[Math.floor(Math.random() * categories.length)];

      addTask({
        title: `Task ${Math.floor(Math.random() * 1000)}`,
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        category: category,
        relation: "Seed Data",
        tags: [],
        isGroup: false,
        bubble: {
          x: 200 + Math.random() * 500,
          y: 200 + Math.random() * 500,
          radius: 30 + Math.random() * 30,
          color: getTaskColor(status, category),
        },
      });
    }
  };

  const hasSeedData = tasks.some((t) => t.relation === "Seed Data");

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header / Zones */}
      <header className="h-24 w-full flex border-b border-white/10 z-10 glass-header">
        <div className="flex-1 border-r border-white/10 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-blue-200">Todo</h2>
        </div>
        <div className="flex-1 border-r border-white/10 flex items-center justify-center bg-amber-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-amber-200">In Progress</h2>
        </div>
        <div className="flex-1 border-r border-white/10 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-emerald-200">Done</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-rose-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-rose-200">Archive</h2>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative w-full overflow-hidden">
        <BubbleCanvas onTaskClick={handleTaskClick} />

        {/* Overlay UI */}
        <div className="absolute bottom-8 right-8 flex gap-4 z-20">
          {hasSeedData && (
            <button
              onClick={clearSeedData}
              className="px-4 py-2 bg-rose-900/50 hover:bg-rose-800 text-rose-100 rounded-full border border-rose-500/50 transition-colors flex items-center gap-2"
              title="Clear Seed Data"
            >
              <Trash2 size={16} />
              <span>Clear Seed</span>
            </button>
          )}
          <button
            onClick={seedData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/20 transition-colors"
          >
            Seed Data ({tasks.filter((t) => t.relation === "Seed Data").length})
          </button>
          <button
            onClick={handleCreateNew}
            className="w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <TaskModal
        key={selectedTask?.id ?? "new"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={selectedTask}
      />
    </div>
  );
}

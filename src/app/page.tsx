"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskStatus, Task, TaskCategory } from "@/lib/types";
import { Plus, Trash2, Database } from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false);
  };

  const clearSeedData = () => {
    const seedTasks = tasks.filter((t) => t.relation === "Seed Data");
    seedTasks.forEach((t) => deleteTask(t.id));
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  const hasSeedData = tasks.some((t) => t.relation === "Seed Data");

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Main Canvas Area - Full height now */}
      <div className="flex-1 relative w-full overflow-hidden">
        <BubbleCanvas onTaskClick={handleTaskClick} />

        {/* Overlay backdrop for menu */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Overlay UI - Speed Dial Menu */}
        <div className="absolute bottom-6 md:bottom-8 right-6 md:right-32 flex flex-col items-end gap-3 z-30">
          {/* Menu Items */}
          {isMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
              {hasSeedData && (
                <button
                  onClick={clearSeedData}
                  className="flex items-center gap-3 px-4 py-2 bg-rose-900/90 text-rose-100 rounded-full border border-rose-500/30 shadow-lg backdrop-blur-md hover:scale-105 transition-transform"
                >
                  <span className="text-sm font-medium">Clear Seed</span>
                  <Trash2 size={18} />
                </button>
              )}

              <button
                onClick={seedData}
                className="flex items-center gap-3 px-4 py-2 bg-indigo-900/90 text-indigo-100 rounded-full border border-indigo-500/30 shadow-lg backdrop-blur-md hover:scale-105 transition-transform"
              >
                <span className="text-sm font-medium">Add Seed Data</span>
                <Database size={18} />
              </button>

              <button
                onClick={handleCreateNew}
                className="flex items-center gap-3 px-4 py-2 bg-cyan-900/90 text-cyan-100 rounded-full border border-cyan-500/30 shadow-lg backdrop-blur-md hover:scale-105 transition-transform"
              >
                <span className="text-sm font-medium">New Task</span>
                <Plus size={18} />
              </button>
            </div>
          )}

          {/* Main Floating Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isMenuOpen
                ? "bg-slate-700 text-white rotate-45"
                : "bg-white text-slate-900 hover:scale-110"
            }`}
          >
            <Plus size={28} />
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

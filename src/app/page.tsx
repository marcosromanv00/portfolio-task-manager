"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskStatus, Task } from "@/lib/types";
import { Plus } from "lucide-react";
import TaskModal from "@/components/TaskModal";

// Dynamic import for BubbleCanvas to avoid SSR issues with Matter.js
const BubbleCanvas = dynamic(() => import("@/components/BubbleCanvas"), {
  ssr: false,
});

export default function Home() {
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);
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

  // Seed Data function
  const seedData = () => {
    const statuses: TaskStatus[] = ["todo", "in-progress", "done"];
    const priorities = ["low", "medium", "high", "critical"] as const;

    for (let i = 0; i < 5; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      addTask({
        title: `Task ${Math.floor(Math.random() * 1000)}`,
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        tags: [],
        isGroup: false,
        bubble: {
          x: 200 + Math.random() * 500,
          y: 200 + Math.random() * 500,
          radius: 30 + Math.random() * 30,
          color:
            status === "done"
              ? "#10b981"
              : status === "in-progress"
                ? "#f59e0b"
                : "#3b82f6",
        },
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header / Zones */}
      <header className="h-24 w-full flex border-b border-white/10 z-10 glass-header">
        <div className="flex-1 border-r border-white/10 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-blue-200">Todo</h2>
        </div>
        <div className="flex-1 border-r border-white/10 flex items-center justify-center bg-amber-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-amber-200">In Progress</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-emerald-200">Done</h2>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative w-full h-full">
        <BubbleCanvas onTaskClick={handleTaskClick} />

        {/* Overlay UI */}
        <div className="absolute bottom-8 right-8 flex gap-4 z-20">
          <button
            onClick={seedData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/20 transition-colors"
          >
            Seed Data ({tasks.length})
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={selectedTask}
      />
    </main>
  );
}

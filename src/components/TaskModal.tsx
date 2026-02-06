"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { Priority, TaskStatus, Task } from "@/lib/types";
import { getBubbleRadius, STATUS_COLORS } from "@/lib/utils";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export default function TaskModal({
  isOpen,
  onClose,
  taskToEdit,
}: TaskModalProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");

  // Reset or populate form when opening
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
      } else {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setStatus("todo");
      }
    }
  }, [isOpen, taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const radius = getBubbleRadius(priority);

    if (taskToEdit) {
      // Update existing
      updateTask(taskToEdit.id, {
        title,
        description,
        status,
        priority,
        bubble: {
          ...taskToEdit.bubble,
          radius,
          color: STATUS_COLORS[status],
        },
      });
    } else {
      // Create new
      const centerX =
        typeof window !== "undefined" ? window.innerWidth / 2 : 500;
      const centerY =
        typeof window !== "undefined" ? window.innerHeight / 2 : 500;

      const x = centerX + (Math.random() - 0.5) * 100;
      const y = centerY + (Math.random() - 0.5) * 100;

      addTask({
        title,
        description,
        status,
        priority,
        tags: [],
        isGroup: false,
        bubble: {
          x,
          y,
          radius,
          color: STATUS_COLORS[status],
        },
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {taskToEdit ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-4 py-2 bg-slate-800 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            {taskToEdit ? "Update Task" : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}

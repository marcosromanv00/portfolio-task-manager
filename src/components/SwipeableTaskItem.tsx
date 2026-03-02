"use client";

import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Pencil, Trash2, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/types";

interface SwipeableTaskItemProps {
  task: Task;
  toggleStatus: (id: string, status: string) => void;
  deleteTask: (id: string) => void;
  setEditingTask: (task: Task) => void;
}

export function SwipeableTaskItem({
  task,
  toggleStatus,
  deleteTask,
  setEditingTask,
}: SwipeableTaskItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isScrollingRef = useRef<boolean | null>(null);

  const threshold = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
    isScrollingRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;

    if (isScrollingRef.current === null) {
      if (Math.abs(diffY) > Math.abs(diffX)) {
        isScrollingRef.current = true;
      } else {
        isScrollingRef.current = false;
      }
    }

    if (isScrollingRef.current) return;

    // Optional: add some resistance if swiping too far
    setOffsetX(diffX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!isScrollingRef.current) {
      if (offsetX > threshold) {
        toggleStatus(task.id, task.status);
      } else if (offsetX < -threshold) {
        deleteTask(task.id);
      }
    }
    setOffsetX(0);
  };

  const isDone = task.status === "done";
  const isDiscarded = task.status === "discarded";

  // When swipe is greater than threshold, change appearance to indicate action ready
  const readyToToggle = offsetX > threshold;
  const readyToDelete = offsetX < -threshold;

  return (
    <div className="relative overflow-hidden w-full group border-b border-white/5">
      {/* Background Actions */}
      <div className="absolute inset-0 flex justify-between items-center -z-10">
        {/* Left Side (Swipe Right) - Toggle Status */}
        <div
          className={cn(
            "h-full flex items-center px-6 w-1/2 justify-start font-medium text-sm transition-colors duration-200",
            readyToToggle
              ? isDone || isDiscarded
                ? "bg-amber-500/80 text-white"
                : "bg-emerald-500/80 text-white"
              : isDone || isDiscarded
                ? "bg-amber-500/20 text-amber-500"
                : "bg-emerald-500/20 text-emerald-500",
            offsetX > 0 ? "opacity-100" : "opacity-0",
          )}
        >
          <CheckCircle
            className={cn(
              "w-5 h-5 mr-2 transition-transform",
              readyToToggle && "scale-125",
            )}
          />
          {isDiscarded ? "Restaurar" : isDone ? "Deshacer" : "Completar"}
        </div>

        {/* Right Side (Swipe Left) - Delete */}
        <div
          className={cn(
            "h-full flex items-center px-6 w-1/2 justify-end font-medium text-sm transition-colors duration-200",
            readyToDelete
              ? "bg-red-500/80 text-white"
              : "bg-red-500/20 text-red-500",
            offsetX < 0 ? "opacity-100" : "opacity-0",
          )}
        >
          Eliminar
          <Trash2
            className={cn(
              "w-5 h-5 ml-2 transition-transform",
              readyToDelete && "scale-125",
            )}
          />
        </div>
      </div>

      {/* Foreground Task Row */}
      <div
        className={cn(
          "grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center bg-[#0a1120] md:bg-transparent md:hover:bg-white/5 touch-pan-y",
          !isDragging && "transition-transform duration-300 ease-out",
        )}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={() => toggleStatus(task.id, task.status)}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
            isDone || isDiscarded
              ? "bg-green-500 border-green-500"
              : "border-gray-500 hover:border-cyan-400",
          )}
        >
          {(isDone || isDiscarded) && (
            <CheckCircle className="w-4 h-4 text-white" />
          )}
        </button>

        <div className="min-w-0">
          <h3
            className={cn(
              "font-medium text-lg truncate transition-colors",
              isDone || isDiscarded
                ? "text-gray-500 line-through"
                : "text-gray-200",
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-500 text-sm truncate max-w-md">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 md:hidden">
            {task.dueAt && (
              <span className="text-xs text-gray-500 shrink-0">
                {format(new Date(task.dueAt), "d MMM", {
                  locale: es,
                })}
              </span>
            )}
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0 whitespace-nowrap",
                task.priority === "critical"
                  ? "bg-red-500/20 text-red-400"
                  : task.priority === "high"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-blue-500/20 text-blue-400",
              )}
            >
              {task.priority === "critical"
                ? "crítica"
                : task.priority === "high"
                  ? "alta"
                  : task.priority === "medium"
                    ? "media"
                    : "baja"}
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-start text-sm text-gray-400 shrink-0">
          {task.dueAt ? (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <CalIcon className="w-4 h-4 shrink-0" />
              <span>
                {format(new Date(task.dueAt), "d 'de' MMMM, yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          ) : (
            <span className="text-center w-full">-</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 justify-end">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full uppercase hidden md:inline-block whitespace-nowrap",
              task.priority === "critical"
                ? "bg-red-500/20 text-red-400"
                : task.priority === "high"
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-blue-500/20 text-blue-400",
            )}
          >
            {task.priority === "critical"
              ? "crítica"
              : task.priority === "high"
                ? "alta"
                : task.priority === "medium"
                  ? "media"
                  : "baja"}
          </span>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingTask(task)}
              className="p-2 hover:bg-white/10 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

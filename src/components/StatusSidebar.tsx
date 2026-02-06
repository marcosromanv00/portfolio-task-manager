"use client";

import React, { useMemo } from "react";
import {
  Circle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Archive,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@/lib/types";
import { useUIStore } from "@/store/useUIStore";

interface StatusItem {
  status: TaskStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  bgHover: string;
  bgActive: string;
}

const statusItems: StatusItem[] = [
  {
    status: "todo",
    label: "To Do",
    icon: Circle,
    color: "text-blue-400",
    bgHover: "hover:bg-blue-500/20",
    bgActive: "bg-blue-500/30 ring-2 ring-blue-400",
  },
  {
    status: "in-progress",
    label: "In Progress",
    icon: PlayCircle,
    color: "text-amber-400",
    bgHover: "hover:bg-amber-500/20",
    bgActive: "bg-amber-500/30 ring-2 ring-amber-400",
  },
  {
    status: "done",
    label: "Done",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgHover: "hover:bg-emerald-500/20",
    bgActive: "bg-emerald-500/30 ring-2 ring-emerald-400",
  },
  {
    status: "backlog",
    label: "Backlog",
    icon: Clock,
    color: "text-slate-400",
    bgHover: "hover:bg-slate-500/20",
    bgActive: "bg-slate-500/30 ring-2 ring-slate-400",
  },
  {
    status: "discarded",
    label: "Discarded",
    icon: XCircle,
    color: "text-red-400",
    bgHover: "hover:bg-red-500/20",
    bgActive: "bg-red-500/30 ring-2 ring-red-400",
  },
  {
    status: "archived",
    label: "Archived",
    icon: Archive,
    color: "text-rose-400",
    bgHover: "hover:bg-rose-500/20",
    bgActive: "bg-rose-500/30 ring-2 ring-rose-400",
  },
];

export function StatusSidebar() {
  const { isDragging, mousePosition } = useUIStore();

  // Calculate which status is being hovered based on mouse position
  const hoveredStatusIndex = useMemo(() => {
    if (!isDragging || !mousePosition) return -1;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = windowWidth < 768;
    const sidebarSize = 100; // Expected size in pixels

    if (isMobile) {
      // Check if mouse is over the top bar
      if (mousePosition.y >= sidebarSize) return -1;

      // Calculate status index based on X position
      const barWidth = windowWidth - 32; // padding
      const itemWidth = barWidth / 6;
      const relativeX = mousePosition.x - 16;
      const index = Math.floor(relativeX / itemWidth);
      return index >= 0 && index < 6 ? index : -1;
    } else {
      // Desktop - Right Sidebar
      // Check if mouse is over the sidebar
      if (mousePosition.x <= windowWidth - sidebarSize) return -1;

      // Calculate status index based on Y position
      const sidebarHeight = windowHeight - 32;
      const itemHeight = sidebarHeight / 6;
      const relativeY = mousePosition.y - 16;
      const index = Math.floor(relativeY / itemHeight);

      return index >= 0 && index < 6 ? index : -1;
    }
  }, [isDragging, mousePosition]);

  return (
    <aside
      className={cn(
        "fixed z-50 transition-all duration-300 group overflow-hidden glass rounded-2xl flex items-center justify-center",
        // Desktop
        "md:left-auto md:right-4 md:top-4 md:bottom-4 md:flex-col md:w-24 md:py-8 md:h-auto",
        // Mobile
        "left-4 right-4 top-4 flex-row h-16 py-2 px-2",
        isDragging && "ring-2 ring-white/20 shadow-lg shadow-cyan-500/10",
      )}
    >
      <div className="flex-1 flex flex-row md:flex-col gap-1 md:gap-3 w-full px-1 md:px-2 justify-around items-center">
        {statusItems.map((item, index) => {
          const isHovered = hoveredStatusIndex === index;
          const IconComponent = item.icon;

          return (
            <div
              key={item.status}
              data-status={item.status}
              className={cn(
                "flex flex-col items-center justify-center h-12 md:h-14 w-full rounded-xl transition-all duration-200 cursor-pointer relative",
                item.color,
                item.bgHover,
                isHovered && isDragging && item.bgActive,
                isDragging && "scale-105",
              )}
            >
              <IconComponent
                className={cn(
                  "w-5 h-5 md:w-6 md:h-6 transition-transform duration-200",
                  isHovered && isDragging && "scale-125",
                )}
              />

              {/* Tooltip on hover when dragging */}
              <span
                className={cn(
                  "absolute px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 pointer-events-none",
                  "bg-slate-800/90 backdrop-blur-sm border border-white/10",
                  // Desktop tooltip position
                  "md:right-full md:mr-3 md:top-1/2 md:-translate-y-1/2",
                  // Mobile tooltip position
                  "top-full mt-3 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0",
                  isHovered && isDragging
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 md:translate-y-0 md:translate-x-2",
                )}
              >
                {item.label}
              </span>

              {/* Glow effect when dragging over */}
              {isHovered && isDragging && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl animate-pulse",
                    `shadow-lg`,
                    item.status === "todo" && "shadow-blue-400/50",
                    item.status === "in-progress" && "shadow-amber-400/50",
                    item.status === "done" && "shadow-emerald-400/50",
                    item.status === "backlog" && "shadow-slate-400/50",
                    item.status === "discarded" && "shadow-red-400/50",
                    item.status === "archived" && "shadow-rose-400/50",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Drag indicator at bottom/side */}
      {isDragging && (
        <div className="hidden md:block mt-4 px-2">
          <div className="text-xs text-white/40 text-center font-medium">
            Drop here
          </div>
        </div>
      )}
    </aside>
  );
}

export { statusItems };

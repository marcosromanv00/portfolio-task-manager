"use client";

import { useTaskStore } from "@/store/useTaskStore";
import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalIcon,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const { tasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const getCalendarDays = () => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const startDate = startOfWeek(currentDate);
      const endDate = endOfWeek(currentDate);
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
  };

  const days = getCalendarDays();

  const next = () => {
    setCurrentDate(
      viewMode === "month"
        ? addMonths(currentDate, 1)
        : addWeeks(currentDate, 1),
    );
  };

  const prev = () => {
    setCurrentDate(
      viewMode === "month"
        ? subMonths(currentDate, 1)
        : subWeeks(currentDate, 1),
    );
  };

  const today = () => setCurrentDate(new Date());

  const getTasksForDay = (date: Date) => {
    return tasks.filter(
      (task) => task.dueAt && isSameDay(new Date(task.dueAt), date),
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Calendar</h1>
          <p className="text-gray-400">Schedule at a glance</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/5 p-1 rounded-xl glass flex">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                viewMode === "month"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                viewMode === "week"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white",
              )}
            >
              <CalIcon className="w-4 h-4" />
              Week
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl glass">
            <button
              onClick={prev}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={today}
              className="px-4 py-2 font-medium text-white hover:bg-white/10 rounded-lg transition-colors min-w-[140px] text-center"
            >
              {format(
                currentDate,
                viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d",
              )}
            </button>
            <button
              onClick={next}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="glass rounded-3xl flex-1 flex flex-col overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-4 text-center text-sm font-medium text-gray-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          className={cn(
            "grid grid-cols-7 flex-1 bg-white/5",
            viewMode === "week" ? "grid-rows-1" : "auto-rows-fr",
          )}
        >
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "border-b border-r border-white/5 p-3 flex flex-col gap-1 transition-colors hover:bg-white/5 group relative",
                  viewMode === "month" &&
                    !isCurrentMonth &&
                    "bg-black/20 opacity-50",
                  isDayToday &&
                    "bg-cyan-500/5 ring-1 ring-inset ring-cyan-500/20",
                  viewMode === "week" ? "min-h-[400px]" : "min-h-[100px]",
                )}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      isDayToday ? "bg-cyan-500 text-white" : "text-gray-400",
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Add button on hover */}
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-full text-gray-400 transition-all">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-1 mt-2 overflow-y-auto scrollbar-hide">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md truncate cursor-pointer",
                        task.status === "done"
                          ? "bg-white/5 text-gray-500 line-through"
                          : task.priority === "critical"
                            ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            : task.priority === "high"
                              ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                              : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
                      )}
                    >
                      {task.dueAt && (
                        <span className="font-semibold mr-1">
                          {format(new Date(task.dueAt), "HH:mm")}
                        </span>
                      )}
                      {task.title}
                    </div>
                  ))}
                  {viewMode === "month" && dayTasks.length > 3 && (
                    <div className="text-[10px] text-gray-500 pl-1">
                      + {dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

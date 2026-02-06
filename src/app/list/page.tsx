"use client";

import { useTaskStore } from "@/store/useTaskStore";
import { useState } from "react";
import {
  Search,
  Filter,
  Calendar as CalIcon,
  Trash2,
  CheckCircle,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ListPage() {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : task.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleStatus = (id: string, currentStatus: string) => {
    updateTask(id, { status: currentStatus === "done" ? "todo" : "done" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Task List</h1>
          <p className="text-gray-400">Manage your tasks in detail</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all w-64 md:w-80"
            />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {["all", "todo", "in-progress", "done", "high-priority"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
              filter === f
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10",
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden min-h-[500px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Filter className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks found matching your criteria</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-500 uppercase tracking-wider">
              <div className="w-8"></div>
              <div>Task</div>
              <div className="hidden md:block">Due Date</div>
              <div>Actions</div>
            </div>
            <div>
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 items-center group"
                >
                  <button
                    onClick={() => toggleStatus(task.id, task.status)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      task.status === "done"
                        ? "bg-green-500 border-green-500"
                        : "border-gray-500 hover:border-cyan-400",
                    )}
                  >
                    {task.status === "done" && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <div>
                    <h3
                      className={cn(
                        "font-medium text-lg",
                        task.status === "done"
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
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.dueAt), "MMM d")}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full uppercase",
                          task.priority === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : task.priority === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-blue-500/20 text-blue-400",
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end text-sm text-gray-400">
                    {task.dueAt ? (
                      <div className="flex items-center gap-1.5">
                        <CalIcon className="w-4 h-4" />
                        <span>
                          {format(new Date(task.dueAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

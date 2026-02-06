"use client";

import { useTaskStore } from "@/store/useTaskStore";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar as CalIcon,
  Trash2,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import TaskModal from "@/components/TaskModal";
import { Task } from "@/lib/types";

type SortField = "title" | "status" | "priority" | "dueAt";
type SortOrder = "asc" | "desc";

const SortIcon = ({
  field,
  currentSortField,
  sortOrder,
}: {
  field: SortField;
  currentSortField: SortField;
  sortOrder: SortOrder;
}) => {
  if (currentSortField !== field)
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
  return sortOrder === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1 text-cyan-400" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 text-cyan-400" />
  );
};

export default function ListPage() {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("dueAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredAndSortedTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());

      let matchesFilter = true;
      if (filter !== "all") {
        const statusList = [
          "todo",
          "in-progress",
          "done",
          "discarded",
          "backlog",
          "archived",
        ];
        const priorityList = ["low", "medium", "high", "critical"];

        if (statusList.includes(filter)) {
          matchesFilter = task.status === filter;
        } else if (priorityList.includes(filter)) {
          matchesFilter = task.priority === filter;
        }
      }

      return matchesSearch && matchesFilter;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority": {
          const priorityOrder: Record<string, number> = {
            "-": 0,
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
          };
          comparison =
            (priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0);
          break;
        }
        case "dueAt":
          if (!a.dueAt && !b.dueAt) comparison = 0;
          else if (!a.dueAt)
            comparison = 1; // No date goes last
          else if (!b.dueAt) comparison = -1;
          else
            comparison =
              new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, search, filter, sortField, sortOrder]);

  const toggleStatus = (id: string, currentStatus: string) => {
    updateTask(id, { status: currentStatus === "done" ? "todo" : "done" });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Lista de Tareas
          </h1>
          <p className="text-gray-400">Gestiona tus tareas en detalle</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all w-64 md:w-80"
            />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          "all",
          "todo",
          "in-progress",
          "done",
          "high",
          "critical",
          "backlog",
          "archived",
        ].map((f) => (
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
            {f === "all"
              ? "Todas"
              : f === "in-progress"
                ? "En Progreso"
                : f === "todo"
                  ? "Por Hacer"
                  : f === "done"
                    ? "Hecho"
                    : f === "backlog"
                      ? "Pendientes"
                      : f === "archived"
                        ? "Archivado"
                        : f === "high"
                          ? "Prioridad Alta"
                          : f === "critical"
                            ? "Prioridad Crítica"
                            : f.charAt(0).toUpperCase() +
                              f.slice(1).replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden min-h-[500px]">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Filter className="w-12 h-12 mb-4 opacity-20" />
            <p>No se encontraron tareas que coincidan con tu búsqueda</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-500 uppercase tracking-wider bg-white/5">
              <div className="w-8"></div>
              <button
                onClick={() => handleSort("title")}
                className="flex items-center hover:text-white transition-colors text-left"
              >
                Tarea{" "}
                <SortIcon
                  field="title"
                  currentSortField={sortField}
                  sortOrder={sortOrder}
                />
              </button>
              <button
                onClick={() => handleSort("dueAt")}
                className="hidden md:flex items-center hover:text-white transition-colors"
              >
                Fecha Límite{" "}
                <SortIcon
                  field="dueAt"
                  currentSortField={sortField}
                  sortOrder={sortOrder}
                />
              </button>
              <button
                onClick={() => handleSort("priority")}
                className="flex items-center hover:text-white transition-colors justify-end pr-8"
              >
                Prioridad{" "}
                <SortIcon
                  field="priority"
                  currentSortField={sortField}
                  sortOrder={sortOrder}
                />
              </button>
            </div>
            <div>
              {filteredAndSortedTasks.map((task) => (
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
                          {format(new Date(task.dueAt), "d MMM", {
                            locale: es,
                          })}
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

                  <div className="hidden md:flex flex-col items-start text-sm text-gray-400">
                    {task.dueAt ? (
                      <div className="flex items-center gap-1.5">
                        <CalIcon className="w-4 h-4" />
                        <span>
                          {format(new Date(task.dueAt), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full uppercase hidden md:inline-block",
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ))}
            </div>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        taskToEdit={editingTask}
        key={editingTask?.id ?? "closed"}
      />
    </div>
  );
}

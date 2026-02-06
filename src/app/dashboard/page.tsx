"use client";

import { useTaskStore } from "@/store/useTaskStore";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

import { ExportButton } from "@/components/ExportButton";

export default function DashboardPage() {
  const { tasks } = useTaskStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "in-progress",
  ).length;
  const highPriorityTasks = tasks.filter(
    (t) => t.priority === "high" || t.priority === "critical",
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Panel de Control
          </h1>
          <p className="text-gray-400">Resumen de tu productividad</p>
        </div>
        <ExportButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Tareas Totales"
          value={totalTasks}
          icon={Circle}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard
          label="Completadas"
          value={completedTasks}
          icon={CheckCircle2}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <StatCard
          label="Pendientes"
          value={pendingTasks}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
        <StatCard
          label="Prioridad Alta"
          value={highPriorityTasks}
          icon={AlertCircle}
          color="text-red-400"
          bg="bg-red-400/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity / Chart Placeholder */}
        <div className="glass p-6 rounded-3xl min-h-[300px]">
          <h3 className="text-xl font-semibold text-white mb-6">
            Actividad Reciente
          </h3>
          <div className="flex items-center justify-center h-full text-gray-500">
            Visualización de gráfico próximamente
          </div>
        </div>

        {/* Quick Tasks List */}
        <div className="glass p-6 rounded-3xl min-h-[300px]">
          <h3 className="text-xl font-semibold text-white mb-6">
            Próximos Vencimientos
          </h3>
          {tasks.filter((t) => t.dueAt).length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              No hay vencimientos próximos.
            </p>
          ) : (
            <div className="space-y-4">
              {tasks
                .filter((t) => t.dueAt)
                .sort(
                  (a, b) =>
                    new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
                )
                .slice(0, 5)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-200">{task.title}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(task.dueAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        task.priority === "critical"
                          ? "bg-red-500"
                          : task.priority === "high"
                            ? "bg-orange-500"
                            : "bg-blue-500"
                      }`}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="glass p-6 rounded-3xl flex items-start justify-between relative overflow-hidden group">
      <div className="relative z-10">
        <p className="text-gray-400 font-medium mb-1">{label}</p>
        <h2 className="text-4xl font-bold text-white">{value}</h2>
      </div>
      <div
        className={`p-3 rounded-2xl ${bg} ${color} group-hover:scale-110 transition-transform`}
      >
        <Icon size={24} />
      </div>
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} opacity-50 blur-2xl group-hover:opacity-75 transition-opacity`}
      />
    </div>
  );
}

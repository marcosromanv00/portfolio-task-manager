"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import { useUIStore } from "@/store/useUIStore";
import { useTaskStore } from "@/store/useTaskStore";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSidebarExpanded } = useUIStore();
  const { fetchTasks, initialized } = useTaskStore();

  React.useEffect(() => {
    if (!initialized) {
      fetchTasks();
    }
  }, [fetchTasks, initialized]);

  return (
    <>
      <Navigation />
      <main
        className={cn(
          "h-screen transition-all duration-300",
          isSidebarExpanded ? "pl-68" : "pl-24",
        )}
      >
        {children}
      </main>
    </>
  );
}

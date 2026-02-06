"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import { StatusSidebar } from "@/components/StatusSidebar";
import { PWAInstall } from "@/components/PWAInstall";
import { useUIStore } from "@/store/useUIStore";
import { useTaskStore } from "@/store/useTaskStore";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isBubblePage = pathname === "/";
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
      {isBubblePage && <StatusSidebar />}
      <PWAInstall />
      <main
        className={cn(
          "h-screen transition-all duration-300",
          // Desktop padding
          "md:pl-24",
          isSidebarExpanded && "md:pl-64",
          // Mobile padding (navigation and status bar are at bottom/top)
          // Only show top padding on mobile if the StatusSidebar is visible
          "pb-20 md:pb-0",
          isBubblePage ? "pt-20 md:pt-0" : "pt-4 md:pt-0",
        )}
      >
        {children}
      </main>
    </>
  );
}

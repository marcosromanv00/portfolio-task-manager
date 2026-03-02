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
          "h-dvh flex flex-col transition-all duration-300",
          // Base padding
          "p-4 md:p-0",
          // Desktop sidebar padding (Left)
          "md:pl-24 md:py-4",
          isSidebarExpanded && "md:pl-68",
          // Status sidebar padding (Desktop Right / Mobile Top)
          isBubblePage ? "pt-20 md:pt-4 md:pr-32" : "pt-4 md:pt-4 md:pr-4",
          // Bottom navigation padding (Mobile)
          "pb-24 md:pb-4",
        )}
      >
        {children}
      </main>
    </>
  );
}

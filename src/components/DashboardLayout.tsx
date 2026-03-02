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
          // Fixed positioning to stay inside the viewport regardless of content
          "fixed inset-0 flex flex-col overflow-hidden transition-all duration-300",
          // Desktop: offset from left nav + 16px gap (collapsed=112px, expanded=288px) and right status sidebar
          isSidebarExpanded
            ? "md:left-72 md:right-32"
            : "md:left-28 md:right-32",
          // On non-bubble pages there's no status sidebar on the right
          !isBubblePage && "md:right-0",
          // Mobile: offset from top status bar and bottom nav
          isBubblePage ? "top-20 md:top-0" : "top-0",
          "bottom-20 md:bottom-0",
        )}
      >
        {children}
      </main>
    </>
  );
}

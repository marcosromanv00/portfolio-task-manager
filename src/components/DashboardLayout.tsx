"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSidebarExpanded } = useUIStore();

  return (
    <>
      <Navigation />
      <main
        className={cn(
          "pr-4 py-4 h-screen overflow-y-auto scroll-smooth transition-all duration-300",
          isSidebarExpanded ? "pl-68" : "pl-24",
        )}
      >
        {children}
      </main>
    </>
  );
}

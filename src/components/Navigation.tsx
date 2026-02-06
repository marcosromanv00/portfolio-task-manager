"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  ListTodo,
  CircleDashed,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Bubble",
    href: "/",
    icon: CircleDashed,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarIcon,
  },
  {
    label: "List",
    href: "/list",
    icon: ListTodo,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

import { useUIStore } from "@/store/useUIStore";

export function Navigation() {
  const pathname = usePathname();
  const { isSidebarExpanded, setSidebarExpanded } = useUIStore();

  return (
    <nav
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 flex flex-col items-center py-8 glass rounded-2xl z-50 transition-all duration-300 group overflow-hidden",
        isSidebarExpanded ? "w-64" : "w-20",
      )}
    >
      <div className="mb-12 flex items-center justify-center w-full relative">
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 shrink-0 w-20 text-center">
          B
        </div>
        <span className="absolute left-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xl font-bold text-white whitespace-nowrap">
          Bubble
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-12 px-4 rounded-xl transition-all duration-300 relative group/item",
                isActive
                  ? "bg-white/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon
                className={cn(
                  "w-6 h-6 shrink-0 transition-transform duration-300",
                  isActive && "scale-110",
                )}
              />
              <span
                className={cn(
                  "absolute left-14 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap font-medium",
                  isActive ? "text-white" : "text-gray-300",
                )}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#22d3ee]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="w-full px-2">
        <button className="flex items-center h-12 w-full px-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-6 h-6 shrink-0" />
          <span className="absolute left-14 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium ml-4">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}

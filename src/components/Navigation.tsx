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
        "fixed z-50 transition-all duration-300 group overflow-hidden glass rounded-2xl flex items-center",
        // Desktop
        "md:left-4 md:right-auto md:top-4 md:bottom-4 md:flex-col md:py-8 md:px-0",
        isSidebarExpanded ? "md:w-64" : "md:w-20",
        // Mobile
        "left-4 right-4 bottom-4 flex-row py-2 px-4 h-16 md:h-auto",
      )}
    >
      <div className="md:mb-12 flex items-center justify-center relative shrink-0">
        <div className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 w-12 md:w-20 text-center">
          B
        </div>
        <span className="absolute left-16 md:left-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-lg md:text-xl font-bold text-white whitespace-nowrap hidden md:block">
          Bubble
        </span>
      </div>

      <div className="flex-1 flex flex-row md:flex-col justify-around md:justify-start gap-2 md:gap-4 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center md:justify-start h-12 md:px-4 rounded-xl transition-all duration-300 relative group/item",
                "w-12 md:w-full",
                isActive
                  ? "bg-white/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 md:w-6 md:h-6 shrink-0 transition-transform duration-300",
                  isActive && "scale-110",
                )}
              />
              <span
                className={cn(
                  "absolute left-14 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap font-medium hidden md:block",
                  isActive ? "text-white" : "text-gray-300",
                )}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="absolute bottom-0 md:bottom-auto md:left-0 w-6 md:w-1 h-1 md:h-6 bg-cyan-400 rounded-t-full md:rounded-r-full shadow-[0_0_10px_#22d3ee]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="md:w-full px-2 shrink-0">
        <button className="flex items-center justify-center md:justify-start h-12 w-12 md:w-full md:px-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
          <span className="absolute left-14 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium ml-4 hidden md:block">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}

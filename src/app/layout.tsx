import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bubble Task Manager",
  description:
    "A physics-based task manager for a more organic productivity flow",
};

import { Navigation } from "@/components/Navigation";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isSidebarExpanded } = useUIStore();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative`}
      >
        <Navigation />
        <main
          className={cn(
            "pr-4 py-4 h-screen overflow-y-auto scroll-smooth transition-all duration-300",
            isSidebarExpanded ? "pl-68" : "pl-24",
          )}
        >
          {children}
        </main>
      </body>
    </html>
  );
}

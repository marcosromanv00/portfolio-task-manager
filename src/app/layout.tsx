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
  manifest: "/manifest.json",
  themeColor: "#22d3ee",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

import { DashboardLayout } from "@/components/DashboardLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative bg-slate-950`}
      >
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}

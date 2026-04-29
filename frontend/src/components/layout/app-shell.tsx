"use client";

import { Sidebar } from "./sidebar";
import { useSidebar } from "./sidebar-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-[#080f0d]">
      <Sidebar />
      <main className={`flex-1 min-h-screen transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"} max-lg:ml-0`}>
        {children}
      </main>
    </div>
  );
}

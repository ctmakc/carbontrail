"use client";

import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#080f0d]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

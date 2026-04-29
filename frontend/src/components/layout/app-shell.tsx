"use client";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { Footer } from "./footer";
import { Breadcrumbs } from "./breadcrumbs";
import { useSidebar } from "./sidebar-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-[#080f0d]">
      <Sidebar />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${collapsed ? "ml-16" : "ml-56"} max-lg:ml-0`}>
        <TopBar />
        <main className="min-h-[calc(100vh-8rem)]">
          <div className="px-6 pt-4 lg:px-8"><Breadcrumbs /></div>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

"use client";

import { CommandSearch } from "./command-search";
import { usePathname } from "next/navigation";
import { Database, Clock } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/flow": "Green Money Flow",
  "/recipients": "Top Recipients",
  "/loops": "Lobby ↔ Funding Loops",
  "/network": "Network Graph",
  "/greenwash": "Greenwash Radar",
  "/gaps": "Funding Gaps",
  "/search": "Search",
  "/methodology": "Methodology",
  "/about": "About",
};

export function TopBar() {
  const pathname = usePathname();
  const pageName = routeNames[pathname] || pathname.split("/").pop() || "";

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-emerald-900/20 bg-[#080f0d]/80 backdrop-blur-xl px-6 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-emerald-100/70">{pageName}</span>
      </div>
      <div className="flex items-center gap-3">
        <CommandSearch />
        <ThemeToggle />
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-emerald-700">
          <Database className="h-3 w-3" />
          <span>5.2M records</span>
          <span className="mx-1">·</span>
          <Clock className="h-3 w-3" />
          <span>Data: Apr 2025</span>
        </div>
      </div>
    </div>
  );
}

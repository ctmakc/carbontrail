"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Leaf,
  ArrowRightLeft,
  ShieldAlert,
  MapPin,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  TreePine,
  BookOpen,
  Info,
} from "lucide-react";
import { useState } from "react";

const navMain = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/flow", label: "Green Money Flow", icon: ArrowRightLeft },
  { href: "/recipients", label: "Top Recipients", icon: Users },
  { href: "/loops", label: "Lobby ↔ Funding Loops", icon: Leaf },
  { href: "/greenwash", label: "Greenwash Radar", icon: ShieldAlert },
  { href: "/gaps", label: "Funding Gaps", icon: MapPin },
  { href: "/search", label: "Search", icon: Search },
];

const navSecondary = [
  { href: "/methodology", label: "Methodology", icon: BookOpen },
  { href: "/about", label: "About & Disclaimers", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderLink = (item: typeof navMain[0], isActive: boolean) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/5"
          : "text-emerald-100/50 hover:bg-emerald-500/8 hover:text-emerald-100/80"
      )}
    >
      <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-emerald-400")} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-emerald-900/30 bg-[#0a1210] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-emerald-900/30 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <TreePine className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-emerald-50">CarbonTrail</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-500/70">
              Follow the Green Money
            </span>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {navMain.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return renderLink(item, isActive);
          })}
        </div>

        {/* Divider */}
        {!collapsed && <div className="my-4 border-t border-emerald-900/20" />}

        <div className="space-y-1">
          {navSecondary.map((item) => {
            const isActive = pathname === item.href;
            return renderLink(item, isActive);
          })}
        </div>
      </nav>

      {/* Mission */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg border border-emerald-800/40 bg-emerald-950/50 p-3">
          <p className="text-[10px] leading-relaxed text-emerald-400/70">
            <span className="font-semibold text-emerald-400">🌍 Our Mission:</span> Make climate
            spending transparent. Every dollar accountable. Every pattern visible.
          </p>
        </div>
      )}

      {/* Collapse */}
      <div className="border-t border-emerald-900/30 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-emerald-100/30 hover:bg-emerald-500/8 hover:text-emerald-100/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-3 text-[10px] text-emerald-800">
          v0.1.0 · Open Data · Open Source
        </div>
      )}
    </aside>
  );
}

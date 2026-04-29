"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Leaf, ArrowRightLeft, ShieldAlert, MapPin, Search,
  Users, ChevronLeft, ChevronRight, TreePine, BookOpen, Info, Network, Menu, X, Scale, Eye, Layers,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

const navMain = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/flow", label: "Green Money Flow", icon: ArrowRightLeft },
  { href: "/recipients", label: "Top Recipients", icon: Users },
  { href: "/loops", label: "Lobby ↔ Funding", icon: Leaf },
  { href: "/network", label: "Network Graph", icon: Network },
  { href: "/greenwash", label: "Greenwash Radar", icon: ShieldAlert },
  { href: "/gaps", label: "Funding Gaps", icon: MapPin },
  { href: "/programs", label: "Climate Programs", icon: Layers },
  { href: "/search", label: "Search", icon: Search },
  { href: "/compare", label: "Compare Orgs", icon: Scale },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
];

const navSecondary = [
  { href: "/methodology", label: "Methodology", icon: BookOpen },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const renderLink = (item: typeof navMain[0], isActive: boolean) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMobileOpen(false)}
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
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden rounded-lg p-2 bg-emerald-950/80 border border-emerald-800/30 text-emerald-400"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-emerald-900/30 bg-[#0a1210] transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          "max-lg:translate-x-[-100%]",
          mobileOpen && "max-lg:translate-x-0 max-lg:w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-emerald-900/30 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <TreePine className="h-5 w-5" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-emerald-50">CarbonTrail</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-500/70">Follow the Green Money</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navMain.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return renderLink(item, isActive);
            })}
          </div>
          {(!collapsed || mobileOpen) && <div className="my-4 border-t border-emerald-900/20" />}
          <div className="space-y-1">
            {navSecondary.map((item) => renderLink(item, pathname === item.href))}
          </div>
        </nav>

        {/* Mission */}
        {(!collapsed || mobileOpen) && (
          <div className="mx-3 mb-3 rounded-lg border border-emerald-800/40 bg-emerald-950/50 p-3">
            <p className="text-[10px] leading-relaxed text-emerald-400/70">
              <span className="font-semibold text-emerald-400">🌍</span> Transparent climate spending. Every dollar accountable.
            </p>
          </div>
        )}

        {/* Collapse (desktop only) */}
        <div className="border-t border-emerald-900/30 p-2 max-lg:hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-emerald-100/30 hover:bg-emerald-500/8 hover:text-emerald-100/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {(!collapsed || mobileOpen) && (
          <div className="px-4 pb-3 text-[10px] text-emerald-800 max-lg:hidden">v0.1.0 · Open Data</div>
        )}
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Leaf, ArrowRightLeft, ShieldAlert, MapPin, Search,
  Users, ChevronLeft, ChevronRight, TreePine, BookOpen, Info, Network,
  Menu, X, Scale, Eye, Layers, MessageCircle, AlertTriangle, Building,
  Database, BookMarked, Upload, History,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

const sections = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/flow", label: "Green Money Flow", icon: ArrowRightLeft },
      { href: "/gaps", label: "Funding Gaps", icon: MapPin },
    ],
  },
  {
    label: "Investigation",
    items: [
      { href: "/loops", label: "Lobby ↔ Funding", icon: Leaf },
      { href: "/greenwash", label: "Greenwash Radar", icon: ShieldAlert },
      { href: "/anomalies", label: "Anomalies", icon: AlertTriangle },
      { href: "/network", label: "Network Graph", icon: Network },
      { href: "/stories", label: "Data Stories", icon: BookMarked },
    ],
  },
  {
    label: "Browse",
    items: [
      { href: "/recipients", label: "Recipients", icon: Users },
      { href: "/departments", label: "Departments", icon: Building },
      { href: "/programs", label: "Programs", icon: Layers },
      { href: "/search", label: "Search", icon: Search },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/explorer", label: "Data Explorer", icon: Database },
      { href: "/compare", label: "Compare", icon: Scale },
      { href: "/watchlist", label: "Watchlist", icon: Eye },
      { href: "/bulk", label: "Bulk Lookup", icon: Upload },
      { href: "/chat", label: "AI Chat", icon: MessageCircle },
    ],
  },
  {
    label: "Info",
    items: [
      { href: "/methodology", label: "Methodology", icon: BookOpen },
      { href: "/about", label: "About", icon: Info },
      { href: "/changelog", label: "Changelog", icon: History },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden rounded-lg p-2 bg-emerald-950/80 border border-emerald-800/30 text-emerald-400">
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-emerald-900/30 bg-[#0a1210] transition-all duration-300",
        collapsed ? "w-16" : "w-56",
        "max-lg:translate-x-[-100%]",
        mobileOpen && "max-lg:translate-x-0 max-lg:w-56"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-emerald-900/30 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <TreePine className="h-4 w-4" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div>
              <span className="text-sm font-semibold text-emerald-50">CarbonTrail</span>
              <p className="text-[9px] text-emerald-600 -mt-0.5">Follow the Green Money</p>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-3">
          {sections.map((section) => (
            <div key={section.label}>
              {(!collapsed || mobileOpen) && (
                <p className="px-2.5 mb-1 text-[9px] font-semibold uppercase tracking-widest text-emerald-700">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all",
                        isActive
                          ? "bg-emerald-500/12 text-emerald-300"
                          : "text-emerald-100/40 hover:bg-emerald-500/6 hover:text-emerald-100/70"
                      )}>
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-400" : "opacity-60")} />
                      {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Mission + Collapse */}
        {(!collapsed || mobileOpen) && (
          <div className="mx-2 mb-2 rounded-md border border-emerald-800/30 bg-emerald-950/40 p-2">
            <p className="text-[9px] leading-relaxed text-emerald-500/60">🌍 Transparent climate spending. Every dollar accountable.</p>
          </div>
        )}

        <div className="border-t border-emerald-900/30 p-1.5 max-lg:hidden">
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-md p-1.5 text-emerald-100/20 hover:bg-emerald-500/6 hover:text-emerald-100/50 transition-colors">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  flow: "Green Money Flow",
  recipients: "Recipients",
  loops: "Lobby Loops",
  network: "Network",
  greenwash: "Greenwash Radar",
  gaps: "Funding Gaps",
  programs: "Programs",
  departments: "Departments",
  anomalies: "Anomalies",
  search: "Search",
  compare: "Compare",
  watchlist: "Watchlist",
  chat: "AI Chat",
  explorer: "Data Explorer",
  entity: "Entity",
  methodology: "Methodology",
  about: "About",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = LABELS[part] || decodeURIComponent(part).slice(0, 40);
    const isLast = i === parts.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-[11px] text-emerald-600 mb-4">
      <Link href="/" className="hover:text-emerald-400 transition-colors">
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-40" />
          {c.isLast ? (
            <span className="text-emerald-400">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-emerald-400 transition-colors">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

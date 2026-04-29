"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { fetchAPI, formatCurrency } from "@/lib/api";
import {
  Search, Building2, Building, ArrowRightLeft, Leaf, ShieldAlert, MapPin,
  LayoutDashboard, Users, Network, BookOpen, Info,
} from "lucide-react";

interface SearchResult {
  name: string;
  name_norm: string;
  value: number;
  province: string;
  dual_recipient: boolean;
  grant_count: number;
  contract_count: number;
}

const pages = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview stats" },
  { href: "/flow", label: "Green Money Flow", icon: ArrowRightLeft, keywords: "programs provinces spending" },
  { href: "/recipients", label: "Top Recipients", icon: Users, keywords: "organizations companies" },
  { href: "/loops", label: "Lobby ↔ Funding Loops", icon: Leaf, keywords: "lobbying conflicts" },
  { href: "/network", label: "Network Graph", icon: Network, keywords: "visualization connections" },
  { href: "/greenwash", label: "Greenwash Radar", icon: ShieldAlert, keywords: "signals anomalies" },
  { href: "/gaps", label: "Funding Gaps", icon: MapPin, keywords: "provinces equity distribution" },
  { href: "/departments", label: "Departments", icon: Building, keywords: "government ministry" },
  { href: "/explorer", label: "Data Explorer", icon: Search, keywords: "query sql data" },
  { href: "/search", label: "Full Search", icon: Search, keywords: "find entities" },
  { href: "/methodology", label: "Methodology", icon: BookOpen, keywords: "scoring algorithms" },
  { href: "/about", label: "About & Disclaimers", icon: Info, keywords: "mission data sources" },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Cmd+K handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search entities on type
  const doSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const r = await fetchAPI<SearchResult[]>("/search/", { q, limit: 8 });
      setResults(r);
    } catch { setResults([]); }
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  return (
    <>
      {/* Trigger button in top bar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-emerald-800/30 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-500/50 hover:text-emerald-400 hover:border-emerald-700/40 transition-all"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex items-center rounded border border-emerald-800/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-600">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search entities, pages, or type a command..."
          value={query}
          onValueChange={doSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Entity results */}
          {results.length > 0 && (
            <CommandGroup heading="Climate Entities">
              {results.map((r, i) => (
                <CommandItem
                  key={i}
                  value={r.name_norm}
                  onSelect={() => go(`/entity/${encodeURIComponent(r.name_norm)}`)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <span className="text-sm truncate block">{r.name || r.name_norm}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {r.province || "—"} · {r.grant_count}G · {r.contract_count}C
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 shrink-0 ml-2">{formatCurrency(r.value)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Navigation */}
          <CommandGroup heading="Pages">
            {pages.map(p => (
              <CommandItem key={p.href} value={`${p.label} ${p.keywords}`} onSelect={() => go(p.href)}>
                <p.icon className="mr-2 h-4 w-4 text-emerald-500" />
                <span>{p.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

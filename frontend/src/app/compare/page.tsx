"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, Search, X } from "lucide-react";

interface Profile {
  entity_name: string; entity_name_norm: string; province: string;
  grant_count: number; grant_value: number; grant_programs: number;
  contract_count: number; contract_value: number; sole_source_count: number;
  total_climate_value: number; dual_recipient: boolean; business_number: string;
}
interface SearchResult { name: string; name_norm: string; value: number; province: string }

export default function ComparePage() {
  const [orgA, setOrgA] = useState<Profile | null>(null);
  const [orgB, setOrgB] = useState<Profile | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [resultsA, setResultsA] = useState<SearchResult[]>([]);
  const [resultsB, setResultsB] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<"a" | "b" | null>(null);

  const doSearch = async (q: string, side: "a" | "b") => {
    if (side === "a") {
      setSearchA(q);
    } else {
      setSearchB(q);
    }
    if (q.length < 2) {
      if (side === "a") {
        setResultsA([]);
      } else {
        setResultsB([]);
      }
      return;
    }
    const r = await fetchAPI<SearchResult[]>("/search/", { q, limit: 6 });
    if (side === "a") {
      setResultsA(r);
    } else {
      setResultsB(r);
    }
  };

  const selectOrg = async (name_norm: string, side: "a" | "b") => {
    setLoading(side);
    if (side === "a") { setResultsA([]); setSearchA(""); } else { setResultsB([]); setSearchB(""); }
    try {
      const detail = await fetchAPI<{profile: Profile}>(`/recipients/detail/${encodeURIComponent(name_norm)}`);
      if (side === "a") setOrgA(detail.profile); else setOrgB(detail.profile);
    } catch {}
    setLoading(null);
  };

  const metrics = [
    { label: "Total Climate Funding", key: "total_climate_value", fmt: formatCurrency },
    { label: "Grant Value", key: "grant_value", fmt: formatCurrency },
    { label: "Grant Count", key: "grant_count", fmt: formatNumber },
    { label: "Grant Programs", key: "grant_programs", fmt: formatNumber },
    { label: "Contract Value", key: "contract_value", fmt: formatCurrency },
    { label: "Contract Count", key: "contract_count", fmt: formatNumber },
    { label: "Sole-Source Contracts", key: "sole_source_count", fmt: formatNumber },
  ];

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Compare Organizations</h1>
            <p className="text-sm text-emerald-400/60">Side-by-side climate funding comparison</p>
          </div>
        </div>

        {/* Search panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {(["a", "b"] as const).map((side) => {
            const org = side === "a" ? orgA : orgB;
            const search = side === "a" ? searchA : searchB;
            const results = side === "a" ? resultsA : resultsB;
            return (
              <Card key={side} className="border-emerald-900/30 bg-[#0a1210]">
                <CardContent className="pt-4">
                  {org ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-100">{org.entity_name || org.entity_name_norm}</p>
                          <div className="flex gap-1 mt-0.5">
                            {org.province && <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-800/40">{org.province}</Badge>}
                            {org.dual_recipient && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">dual</Badge>}
                          </div>
                        </div>
                        <button onClick={() => side === "a" ? setOrgA(null) : setOrgB(null)}
                          className="p-1 rounded text-emerald-700 hover:text-red-400 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700" />
                      <input
                        className="w-full rounded-lg border border-emerald-800/30 bg-emerald-950/30 pl-10 pr-4 py-2.5 text-sm text-emerald-100 placeholder:text-emerald-700/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        placeholder={`Search organization ${side.toUpperCase()}...`}
                        value={search}
                        onChange={e => doSearch(e.target.value, side)}
                      />
                      {results.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-emerald-800/30 bg-[#0a1210] shadow-xl z-10 overflow-hidden">
                          {results.map((r, i) => (
                            <button key={i} onClick={() => selectOrg(r.name_norm, side)}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-500/10 transition-colors">
                              <span className="text-xs text-emerald-100 truncate">{r.name || r.name_norm}</span>
                              <span className="text-[10px] font-mono text-emerald-500/50 shrink-0 ml-2">{formatCurrency(r.value)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {loading === side && <Skeleton className="h-4 w-full mt-2 rounded" />}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison table */}
        {orgA && orgB && (
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <CardTitle className="text-base text-emerald-50">Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 px-3 py-2 text-[10px] uppercase tracking-wider text-emerald-500/40 border-b border-emerald-900/20">
                  <span>Metric</span>
                  <span className="text-right">{(orgA.entity_name || "Org A").slice(0, 30)}</span>
                  <span className="text-right">{(orgB.entity_name || "Org B").slice(0, 30)}</span>
                </div>
                {/* Rows */}
                {metrics.map((m) => {
                  const vA = (orgA as unknown as Record<string, number>)[m.key] || 0;
                  const vB = (orgB as unknown as Record<string, number>)[m.key] || 0;
                  const winner = vA > vB ? "a" : vB > vA ? "b" : null;
                  return (
                    <div key={m.key} className="grid grid-cols-3 gap-4 px-3 py-2.5 rounded-lg hover:bg-emerald-500/5 transition-colors">
                      <span className="text-xs text-emerald-400/70">{m.label}</span>
                      <span className={`text-xs font-mono text-right ${winner === "a" ? "text-emerald-300 font-bold" : "text-emerald-500/60"}`}>
                        {m.fmt(vA)}
                        {winner === "a" && <span className="ml-1 text-emerald-400">▲</span>}
                      </span>
                      <span className={`text-xs font-mono text-right ${winner === "b" ? "text-emerald-300 font-bold" : "text-emerald-500/60"}`}>
                        {m.fmt(vB)}
                        {winner === "b" && <span className="ml-1 text-emerald-400">▲</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {!orgA && !orgB && (
          <div className="text-center py-16">
            <Scale className="h-16 w-16 mx-auto mb-4 text-emerald-900" />
            <p className="text-emerald-500/40">Search and select two organizations to compare their climate funding profiles</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

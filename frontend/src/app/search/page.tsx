"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface Result { name: string; name_norm: string; source: string; value: number; province: string; dual_recipient: boolean; grant_count: number; contract_count: number }

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (query.length < 2) return;
    const r = await fetchAPI<Result[]>("/search/", { q: query, limit: 30 });
    setResults(r);
    setSearched(true);
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><Search className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Search Climate Entities</h1>
            <p className="text-sm text-emerald-400/60">Find any organization in the climate funding dataset</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            className="flex-1 rounded-xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            placeholder="Search by organization name (e.g. Shell, Enbridge, Nature Conservancy)..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
          />
          <button onClick={doSearch} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">Search</button>
        </div>

        {searched && (
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardContent className="pt-4">
              {results.length === 0 ? (
                <p className="text-sm text-emerald-500/50 text-center py-8">No results found for &ldquo;{query}&rdquo;</p>
              ) : (
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-100 truncate">{r.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          <span className="text-[10px] text-emerald-500/50">{r.province || "—"}</span>
                          {r.dual_recipient && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">dual</Badge>}
                          {r.grant_count > 0 && <span className="text-[10px] text-emerald-500/50">{r.grant_count} grants</span>}
                          {r.contract_count > 0 && <span className="text-[10px] text-teal-500/50">{r.contract_count} contracts</span>}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-300">{formatCurrency(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

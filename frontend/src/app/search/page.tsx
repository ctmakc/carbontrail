"use client";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

interface Result {
  name: string;
  name_norm: string;
  source: string;
  value: number;
  province: string;
  dual_recipient: boolean;
  grant_count: number;
  contract_count: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetchAPI<Result[]>("/search/", { q: query, limit: 30 });
        setResults(r);
        setSearched(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Search Climate Entities</h1>
            <p className="text-sm text-emerald-400/60">Find any organization in $321B of climate funding data</p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-700" />
          <input
            className="w-full rounded-xl border border-emerald-800/40 bg-emerald-950/30 pl-12 pr-12 py-4 text-base text-emerald-100 placeholder:text-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            placeholder="Search by organization name (e.g. Shell, Enbridge, Nature Conservancy)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 animate-spin" />
          )}
        </div>

        {/* Quick stats */}
        {searched && (
          <div className="flex items-center gap-2 text-xs text-emerald-500/40">
            <span>{results.length} results</span>
            {results.length > 0 && (
              <span>· Total tracked: {formatCurrency(results.reduce((s, r) => s + (r.value || 0), 0))}</span>
            )}
          </div>
        )}

        {/* Results */}
        {searched && (
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardContent className="pt-4">
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-10 w-10 mx-auto mb-3 text-emerald-800" />
                  <p className="text-sm text-emerald-500/50">No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-emerald-500/30 mt-1">Try a different name or broader search term</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <a
                      key={i}
                      href={`/entity/${encodeURIComponent(r.name_norm)}`}
                      className="flex items-center justify-between py-3 px-3 rounded-lg border border-emerald-900/10 hover:bg-emerald-500/5 hover:border-emerald-800/30 transition-all group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-emerald-100 truncate group-hover:text-emerald-300 transition-colors">
                          {r.name || r.name_norm}
                        </p>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {r.province && <span className="text-[10px] text-emerald-500/50">{r.province}</span>}
                          {r.dual_recipient && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">dual</Badge>}
                          {r.grant_count > 0 && <span className="text-[10px] text-emerald-500/40">{r.grant_count} grants</span>}
                          {r.contract_count > 0 && <span className="text-[10px] text-teal-500/40">{r.contract_count} contracts</span>}
                        </div>
                      </div>
                      <span className="text-sm font-mono text-emerald-300 shrink-0 ml-4">{formatCurrency(r.value)}</span>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!searched && (
          <div className="text-center py-16">
            <TreePine className="h-16 w-16 mx-auto mb-4 text-emerald-900" />
            <p className="text-emerald-500/40">Start typing to search 84,000+ climate funding recipients</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["Enbridge", "Shell Canada", "Nature Conservancy", "University of Toronto", "SNC-Lavalin"].map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 rounded-lg border border-emerald-800/30 text-xs text-emerald-500/60 hover:text-emerald-400 hover:border-emerald-600/30 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TreePine(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/>
      <path d="M12 22v-3"/>
    </svg>
  );
}

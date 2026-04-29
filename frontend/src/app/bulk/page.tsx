/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportCSV } from "@/components/ui/export-button";
import { Upload, Loader2, Search } from "lucide-react";

interface LookupResult {
  query: string;
  found: boolean;
  data?: any;
}

export default function BulkPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const names = input.split("\n").map(s => s.trim()).filter(Boolean);
    if (!names.length) return;
    setLoading(true);
    const results: LookupResult[] = [];

    for (const name of names.slice(0, 50)) {
      try {
        const res = await fetchAPI<any[]>("/search/", { q: name, limit: 1 });
        if (res.length > 0) {
          results.push({ query: name, found: true, data: res[0] });
        } else {
          results.push({ query: name, found: false });
        }
      } catch {
        results.push({ query: name, found: false });
      }
    }

    setResults(results);
    setLoading(false);
  };

  const exportData = results.filter(r => r.found).map(r => ({
    query: r.query,
    entity_name: r.data?.name || "",
    province: r.data?.province || "",
    total_value: r.data?.value || 0,
    grants: r.data?.grant_count || 0,
    contracts: r.data?.contract_count || 0,
    dual: r.data?.dual_recipient || false,
  }));

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Bulk Lookup</h1>
            <p className="text-sm text-emerald-400/60">Check multiple organizations at once — paste names, one per line (max 50)</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-sm text-emerald-50">Paste Organization Names</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full h-48 rounded-lg border border-emerald-800/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100 placeholder:text-emerald-700/60 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
                placeholder="Shell Canada&#10;Enbridge&#10;SNC-Lavalin&#10;Nature Conservancy of Canada&#10;..."
                value={input} onChange={e => setInput(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-500/40">{input.split("\n").filter(Boolean).length} names</span>
                <button onClick={run} disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-all">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Lookup All
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Results summary */}
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-emerald-50">Results</CardTitle>
                {exportData.length > 0 && <ExportCSV data={exportData} filename="carbontrail-bulk-lookup" />}
              </div>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-xs text-emerald-500/40 text-center py-8">Paste names on the left and click Lookup</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-600/30">
                      ✓ {results.filter(r => r.found).length} found
                    </Badge>
                    <Badge variant="outline" className="text-red-400 border-red-600/30">
                      ✗ {results.filter(r => !r.found).length} not found
                    </Badge>
                  </div>
                  {results.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded text-xs ${r.found ? "hover:bg-emerald-500/5" : "opacity-50"}`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={r.found ? "text-emerald-400" : "text-red-400"}>{r.found ? "✓" : "✗"}</span>
                        {r.found ? (
                          <a href={`/entity/${encodeURIComponent(r.data.name_norm)}`} className="text-emerald-100 hover:text-emerald-300 truncate">{r.data.name || r.query}</a>
                        ) : (
                          <span className="text-emerald-500/40 truncate">{r.query}</span>
                        )}
                      </div>
                      {r.found && <span className="text-xs font-mono text-emerald-300 shrink-0">{formatCurrency(r.data.value)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

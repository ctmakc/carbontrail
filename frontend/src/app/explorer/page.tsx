/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportCSV } from "@/components/ui/export-button";
import { Database, Play, Loader2 } from "lucide-react";

interface Template {
  id: string; name: string; description: string;
  params: { name: string; type: string; default: string }[];
}

function getInitialParams(template: Template) {
  const params: Record<string, string> = {};
  template.params.forEach(param => { params[param.name] = param.default || ""; });
  return params;
}

export default function ExplorerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any[]>([]);
  const [resultName, setResultName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAPI<Template[]>("/explorer/templates").then(t => {
      setTemplates(t);
      if (t.length) {
        setSelected(t[0]);
        setParamValues(getInitialParams(t[0]));
      }
    });
  }, []);

  const initParams = (t: Template) => {
    setParamValues(getInitialParams(t));
  };

  const selectTemplate = (t: Template) => {
    setSelected(t);
    initParams(t);
    setResults([]);
  };

  const run = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/explorer/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selected.id,
          params: selected.params.map(p => paramValues[p.name] || p.default || ""),
        }),
      });
      const data = await res.json();
      setResults(data.data || []);
      setResultName(data.template || selected.name);
    } catch { setResults([]); }
    setLoading(false);
  };

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400"><Database className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Data Explorer</h1>
            <p className="text-sm text-emerald-400/60">Run curated queries against 5.2M climate spending records</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Template list */}
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-sm text-emerald-50">Query Templates</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {templates.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selected?.id === t.id ? "bg-emerald-500/15 text-emerald-300" : "text-emerald-400/60 hover:bg-emerald-500/5"}`}>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">{t.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Query + Results */}
          <div className="lg:col-span-3 space-y-4">
            {selected && (
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-end gap-3">
                    {selected.params.map(p => (
                      <div key={p.name}>
                        <label className="text-[10px] text-emerald-500/50 uppercase tracking-wider">{p.name}</label>
                        <input
                          value={paramValues[p.name] || ""}
                          onChange={e => setParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                          className="block mt-1 rounded-lg border border-emerald-800/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100 w-32 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                      </div>
                    ))}
                    <button onClick={run} disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-all">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Run Query
                    </button>
                    {results.length > 0 && <ExportCSV data={results} filename={`carbontrail-${selected.id}`} />}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results table */}
            {results.length > 0 && (
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader>
                  <CardTitle className="text-sm text-emerald-400/60">{resultName} — {results.length} rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-emerald-900/20">
                          {columns.map(c => (
                            <th key={c} className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-emerald-500/40 font-medium">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr key={i} className="border-b border-emerald-900/10 hover:bg-emerald-500/5 transition-colors">
                            {columns.map(c => {
                              const val = row[c];
                              const isNum = typeof val === "number";
                              const isLargeNum = isNum && Math.abs(val) > 1000;
                              return (
                                <td key={c} className={`px-2 py-1.5 ${isNum ? "font-mono text-right" : ""} ${isLargeNum ? "text-emerald-300" : "text-emerald-200/70"}`}>
                                  {isLargeNum ? formatCurrency(val) : val === null ? "—" : typeof val === "boolean" ? (val ? "✓" : "✗") : String(val).slice(0, 60)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

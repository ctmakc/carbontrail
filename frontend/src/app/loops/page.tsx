"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportCSV } from "@/components/ui/export-button";
import { Leaf, AlertTriangle } from "lucide-react";

interface Loop { org_name: string; org_name_norm: string; lobby_registration_count: number; grant_count: number; grant_value: number; contract_count: number; contract_value: number; sole_source_count: number; total_climate_value: number; loop_signal_score: number; receives_govt_funding: boolean }
interface LoopStats { total_orgs_with_loops: number; high_signal: number; medium_signal: number; low_signal: number; total_value_in_loops: number; avg_lobby_registrations: number }

export default function LoopsPage() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [stats, setStats] = useState<LoopStats | null>(null);
  useEffect(() => {
    fetchAPI<Loop[]>("/loops/top", { limit: 40 }).then(setLoops).catch(() => {});
    fetchAPI<LoopStats>("/loops/stats").then(setStats).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Leaf className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Lobby ↔ Funding Loops</h1>
            <p className="text-sm text-emerald-400/60">Organizations that lobby climate departments AND receive their funding</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-amber-800/30 bg-amber-500/5 p-4">
              <p className="text-[11px] text-amber-400/60">Orgs in loops</p>
              <p className="text-xl font-bold text-amber-300">{formatNumber(stats.total_orgs_with_loops)}</p>
            </div>
            <div className="rounded-xl border border-red-800/30 bg-red-500/5 p-4">
              <p className="text-[11px] text-red-400/60">High signal (&gt;50)</p>
              <p className="text-xl font-bold text-red-300">{formatNumber(stats.high_signal)}</p>
            </div>
            <div className="rounded-xl border border-amber-800/30 bg-amber-500/5 p-4">
              <p className="text-[11px] text-amber-400/60">Medium signal</p>
              <p className="text-xl font-bold text-amber-300">{formatNumber(stats.medium_signal)}</p>
            </div>
            <div className="rounded-xl border border-emerald-800/30 bg-emerald-500/5 p-4">
              <p className="text-[11px] text-emerald-400/60">Total $ in loops</p>
              <p className="text-xl font-bold text-emerald-300">{formatCurrency(stats.total_value_in_loops)}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end"><ExportCSV data={loops} filename="carbontrail-lobby-loops" /></div>

        <div className="rounded-xl border border-amber-600/20 bg-amber-950/30 p-4">
          <p className="text-xs text-amber-400/70"><span className="font-semibold text-amber-300">⚡ What this means:</span> These organizations registered to lobby ECCC, NRCan, or other climate-related departments, AND also received grants or contracts from those same departments. This is legal and often appropriate — but the pattern deserves review when combined with sole-source contracts or high lobbying intensity.</p>
        </div>

        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardContent className="pt-4">
            <div className="space-y-2">
              {loops.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5 transition-colors">
                  <div className="min-w-0 flex-1">
                    <a href={`/entity/${encodeURIComponent(l.org_name_norm)}`} className="text-xs font-medium text-emerald-100 truncate hover:text-emerald-300 underline decoration-emerald-800 hover:decoration-emerald-400 transition-colors">{l.org_name}</a>
                    <p className="text-[10px] text-emerald-500/50">
                      {l.lobby_registration_count} lobby reg · {l.grant_count} grants ({formatCurrency(l.grant_value)}) · {l.contract_count} contracts ({formatCurrency(l.contract_value)})
                      {l.sole_source_count > 0 && <span className="text-amber-400/70"> · {l.sole_source_count} sole-source</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-emerald-300">{formatCurrency(l.total_climate_value)}</span>
                    <Badge variant="outline" className={`text-[10px] font-mono ${l.loop_signal_score >= 50 ? "text-red-400 border-red-500/30" : l.loop_signal_score >= 30 ? "text-amber-400 border-amber-500/30" : "text-emerald-400 border-emerald-500/30"}`}>
                      {Math.round(l.loop_signal_score)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

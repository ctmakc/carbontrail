/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, ShieldAlert, Zap } from "lucide-react";

export default function AnomaliesPage() {
  const [spikes, setSpikes] = useState<any[]>([]);
  const [soleSrc, setSoleSrc] = useState<any[]>([]);
  const [newVendor, setNewVendor] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAPI<any[]>("/anomalies/spending-spikes", { limit: 12 }),
      fetchAPI<any[]>("/anomalies/sole-source-concentration", { limit: 12 }),
      fetchAPI<any[]>("/anomalies/new-vendor-big-contract", { limit: 12 }),
      fetchAPI<any>("/anomalies/summary"),
    ]).then(([sp, ss, nv, sum]) => {
      setSpikes(sp); setSoleSrc(ss); setNewVendor(nv); setSummary(sum);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Anomaly Detection</h1>
            <p className="text-sm text-emerald-400/60">Automated signals from climate spending patterns</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-600/20 bg-amber-950/30 p-4">
          <p className="text-xs text-amber-400/70">
            <span className="font-semibold text-amber-300">⚡ These are automated statistical signals.</span> Each anomaly has legitimate explanations — new programs may cause spending spikes, sole-source contracts may reflect unique expertise. The purpose is to surface patterns for human review.
          </p>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-red-800/30 bg-red-500/5 p-4">
              <p className="text-[10px] text-red-400/60">Spending Spikes</p>
              <p className="text-xl font-bold text-red-300">{formatNumber(summary.spending_spikes)}</p>
            </div>
            <div className="rounded-xl border border-amber-800/30 bg-amber-500/5 p-4">
              <p className="text-[10px] text-amber-400/60">Sole-Source Concentration</p>
              <p className="text-xl font-bold text-amber-300">{formatNumber(summary.sole_source_concentration)}</p>
            </div>
            <div className="rounded-xl border border-amber-800/30 bg-amber-500/5 p-4">
              <p className="text-[10px] text-amber-400/60">High-Signal Loops</p>
              <p className="text-xl font-bold text-amber-300">{formatNumber(summary.high_signal_loops)}</p>
            </div>
            <div className="rounded-xl border border-red-800/30 bg-red-500/5 p-4">
              <p className="text-[10px] text-red-400/60">Greenwash Signals</p>
              <p className="text-xl font-bold text-red-300">{formatNumber(summary.greenwash_signals)}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-6">
            {/* Spending Spikes */}
            <Card className="border-emerald-900/30 bg-[#0a1210]">
              <CardHeader>
                <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-400" /> Spending Spikes (5x+ year-over-year)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {spikes.map((s, i) => (
                    <a key={i} href={`/entity/${encodeURIComponent(s.vendor_name || '')}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-100 truncate">{s.vendor_name}</p>
                        <p className="text-[10px] text-emerald-500/50">{s.department?.split("|")[0].trim()} · {s.prev_year}→{s.year}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-emerald-500/40">{formatCurrency(s.prev_year_value)} → {formatCurrency(s.year_value)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono text-red-400 border-red-500/30">
                          {s.spike_ratio > 999 ? "999+" : Math.round(s.spike_ratio)}x
                        </Badge>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sole Source Concentration */}
            <Card className="border-emerald-900/30 bg-[#0a1210]">
              <CardHeader>
                <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" /> Sole-Source Concentration (&gt;70% non-competitive)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {soleSrc.map((s, i) => (
                    <a key={i} href={`/entity/${encodeURIComponent(s.entity_norm || '')}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-100 truncate">{s.entity}</p>
                        <p className="text-[10px] text-emerald-500/50">{s.department?.split("|")[0].trim()} · {s.total_contracts} contracts</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-emerald-300">{formatCurrency(s.sole_source_value)}</span>
                        <Badge variant="outline" className="text-[10px] font-mono text-amber-400 border-amber-500/30">
                          {s.sole_source_pct}% SS
                        </Badge>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* New Vendor Big Contract */}
            <Card className="border-emerald-900/30 bg-[#0a1210]">
              <CardHeader>
                <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" /> New Vendors with Large Contracts (&gt;$1M within first year)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {newVendor.map((s, i) => (
                    <a key={i} href={`/entity/${encodeURIComponent(s.entity_norm || '')}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-100 truncate">{s.entity}</p>
                        <p className="text-[10px] text-emerald-500/50">{s.department?.split("|")[0].trim()} · First appeared: {s.first_year} · Contract: {s.year}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-emerald-300">{formatCurrency(s.contract_value)}</span>
                        {s.is_sole_source && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">sole-source</Badge>}
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp } from "lucide-react";

interface ProvGap { province: string; total_grants: number; total_value: number; recipient_count: number; program_count: number }
interface YoY { year: number; total_value: number; record_count: number; recipient_count: number }

export default function GapsPage() {
  const [gaps, setGaps] = useState<ProvGap[]>([]);
  const [yoy, setYoy] = useState<YoY[]>([]);
  useEffect(() => {
    fetchAPI<ProvGap[]>("/gaps/provincial").then(setGaps).catch(() => {});
    fetchAPI<YoY[]>("/gaps/year-over-year").then(setYoy).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400"><MapPin className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Climate Funding Gaps</h1>
            <p className="text-sm text-emerald-400/60">Where climate money ISN&apos;T reaching — geographic and temporal analysis</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-600/20 bg-emerald-950/40 p-4">
          <p className="text-xs text-emerald-400/70">🌍 <span className="font-semibold text-emerald-300">Why gaps matter:</span> Uneven climate funding distribution can leave vulnerable regions behind. Northern communities, Indigenous territories, and agricultural provinces all face unique climate challenges — are they getting proportional support?</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-400" />Provincial Climate Funding</CardTitle></CardHeader>
            <CardContent>
              {gaps.map((g, i) => {
                const max = gaps[0]?.total_value || 1;
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-emerald-100">{g.province || "Unknown"}</span>
                      <span className="text-xs font-mono text-emerald-300">{formatCurrency(g.total_value)}</span>
                    </div>
                    <div className="w-full bg-emerald-950/50 rounded h-4">
                      <div className="h-4 rounded bg-gradient-to-r from-sky-600 to-emerald-500" style={{width: `${(g.total_value / max) * 100}%`}} />
                    </div>
                    <p className="text-[10px] text-emerald-500/40 mt-0.5">{formatNumber(g.total_grants)} grants · {g.recipient_count} recipients · {g.program_count} programs</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" />Year-over-Year Growth</CardTitle></CardHeader>
            <CardContent>
              {yoy.map((y, i) => {
                const max = Math.max(...yoy.map(x => x.total_value));
                return (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-emerald-500/60 w-10">{y.year}</span>
                    <div className="flex-1">
                      <div className="w-full bg-emerald-950/50 rounded h-5">
                        <div className="h-5 rounded bg-gradient-to-r from-emerald-600 to-teal-400" style={{width: `${(y.total_value / max) * 100}%`}} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-300 w-24 text-right">{formatCurrency(y.total_value)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

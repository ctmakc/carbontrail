/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendingTimeline } from "@/components/charts/SpendingTimeline";
import { ProvinceBar } from "@/components/charts/ProvinceBar";
import { Layers, ArrowLeft, Users, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";

interface ProgramDetail {
  overview: any;
  top_recipients: any[];
  by_province: any[];
  by_year: any[];
}

export default function ProgramDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const programName = decodeURIComponent(name);
  const [data, setData] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<ProgramDetail>(`/programs/detail/${encodeURIComponent(programName)}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [programName]);

  const o = data?.overview;

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <Link href="/programs" className="inline-flex items-center gap-1 text-xs text-emerald-500/60 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Programs
        </Link>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28 rounded-xl" />)}</div></div>
        ) : !o ? (
          <div className="text-center py-20 text-emerald-500/50"><Layers className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Program not found</p></div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><Layers className="h-6 w-6" /></div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-emerald-50">{programName}</h1>
                <p className="text-sm text-emerald-400/60">{o.department?.split("|")[0].trim()} · {o.first_year}–{o.last_year}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] text-emerald-500/50">Total Funding</p>
                <p className="text-xl font-bold text-emerald-300">{formatCurrency(o.total_value)}</p>
              </div>
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] text-emerald-500/50">Grants</p>
                <p className="text-xl font-bold text-emerald-300">{formatNumber(o.grant_count)}</p>
                <p className="text-[10px] text-emerald-500/30">avg {formatCurrency(o.avg_grant_value)}</p>
              </div>
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] text-emerald-500/50">Recipients</p>
                <p className="text-xl font-bold text-emerald-300">{formatNumber(o.recipient_count)}</p>
              </div>
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] text-emerald-500/50">Province Coverage</p>
                <p className="text-xl font-bold text-emerald-300">{o.province_count}</p>
              </div>
            </div>

            {/* Year trend */}
            {data?.by_year && data.by_year.length > 0 && (
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" />Funding Over Time</CardTitle></CardHeader>
                <CardContent>
                  <SpendingTimeline data={data.by_year.map((y: any) => ({ year: y.year, grant_value: y.total_value, contract_value: 0, total_value: y.total_value }))} />
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top recipients */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><Users className="h-4 w-4 text-emerald-400" />Top Recipients</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {data?.top_recipients.map((r: any, i: number) => (
                      <a key={i} href={`/entity/${encodeURIComponent(r.name_norm)}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-emerald-500/5 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-emerald-100 truncate hover:text-emerald-300">{r.name}</p>
                          <p className="text-[10px] text-emerald-500/40">{r.province} · {r.grant_count} grants</p>
                        </div>
                        <span className="text-xs font-mono text-emerald-300 shrink-0">{formatCurrency(r.total_value)}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By province */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-400" />By Province</CardTitle></CardHeader>
                <CardContent>
                  <ProvinceBar data={data?.by_province || []} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

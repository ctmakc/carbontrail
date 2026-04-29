/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendingTimeline } from "@/components/charts/SpendingTimeline";
import { Building, ArrowLeft, Users, FileText, DollarSign, Leaf, Layers } from "lucide-react";
import Link from "next/link";

export default function DeptDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const deptName = decodeURIComponent(name);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<any>(`/departments/detail/${encodeURIComponent(deptName)}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [deptName]);

  const o = data?.overview;
  const short = deptName.split("|")[0].trim();

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <Link href="/departments" className="inline-flex items-center gap-1 text-xs text-emerald-500/60 hover:text-emerald-400"><ArrowLeft className="h-3 w-3" /> Departments</Link>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28 rounded-xl" />)}</div></div>
        ) : !o ? (
          <div className="text-center py-20 text-emerald-500/50"><Building className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Department not found</p></div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400"><Building className="h-6 w-6" /></div>
              <h1 className="text-xl font-bold text-emerald-50">{short}</h1>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Total Climate $" value={formatCurrency((o.contract_value || 0) + (o.grant_value || 0))} icon={DollarSign} />
              <Stat label="Contracts" value={formatCurrency(o.contract_value)} sub={`${formatNumber(o.contract_count)} contracts`} icon={FileText} />
              <Stat label="Grants" value={formatCurrency(o.grant_value)} sub={`${formatNumber(o.grant_count)} grants`} icon={DollarSign} />
              <Stat label="Programs" value={formatNumber(o.program_count)} sub={`${formatNumber(o.unique_recipients)} recipients`} icon={Layers} />
            </div>

            {/* Yearly spending */}
            {data.by_year?.length > 0 && (
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-base text-emerald-50">Spending Over Time</CardTitle></CardHeader>
                <CardContent>
                  <SpendingTimeline data={data.by_year.map((y: any) => ({ year: y.year, grant_value: y.grant_value || 0, contract_value: y.contract_value || 0, total_value: y.total || 0 }))} />
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Top vendors */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-sm text-emerald-50 flex items-center gap-2"><FileText className="h-4 w-4 text-teal-400" />Top Contractors</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {data.top_vendors?.map((v: any, i: number) => (
                      <a key={i} href={`/entity/${encodeURIComponent(v.name_norm)}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-emerald-500/5 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-emerald-100 truncate">{v.name}</p>
                          {v.sole_source > 0 && <Badge variant="outline" className="text-[8px] text-amber-400 border-amber-500/30">{v.sole_source} SS</Badge>}
                        </div>
                        <span className="text-[11px] font-mono text-teal-300 shrink-0 ml-2">{formatCurrency(v.value)}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top grant recipients */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-sm text-emerald-50 flex items-center gap-2"><Users className="h-4 w-4 text-emerald-400" />Top Grant Recipients</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {data.top_recipients?.map((r: any, i: number) => (
                      <a key={i} href={`/entity/${encodeURIComponent(r.name_norm)}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-emerald-500/5 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-emerald-100 truncate">{r.name}</p>
                          <p className="text-[9px] text-emerald-500/40">{r.province}</p>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-300 shrink-0 ml-2">{formatCurrency(r.value)}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lobbyists */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-sm text-emerald-50 flex items-center gap-2"><Leaf className="h-4 w-4 text-amber-400" />Who Lobbies This Dept</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {data.lobbyists?.map((l: any, i: number) => (
                      <a key={i} href={`/entity/${encodeURIComponent(l.org_name_norm)}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-emerald-500/5 transition-colors">
                        <p className="text-[11px] text-emerald-100 truncate flex-1">{l.org_name}</p>
                        <span className="text-[11px] font-mono text-amber-400 shrink-0 ml-2">{l.registration_count} reg</span>
                      </a>
                    ))}
                    {(!data.lobbyists || data.lobbyists.length === 0) && <p className="text-xs text-emerald-500/40 text-center py-4">No lobbying data found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Programs */}
            {data.programs?.length > 0 && (
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader><CardTitle className="text-sm text-emerald-50">Climate Programs ({data.programs.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {data.programs.map((p: any, i: number) => (
                      <Link key={i} href={`/programs/${encodeURIComponent(p.program)}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-emerald-500/5 transition-colors">
                        <span className="text-[11px] text-emerald-100 truncate flex-1">{p.program}</span>
                        <span className="text-[11px] font-mono text-emerald-300 shrink-0 ml-2">{formatCurrency(p.value)}</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) {
  return (
    <div className="rounded-xl border border-indigo-800/20 bg-indigo-500/5 p-4">
      <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5 text-indigo-400/60" /><p className="text-[10px] text-indigo-400/60">{label}</p></div>
      <p className="text-lg font-bold text-indigo-200">{value}</p>
      {sub && <p className="text-[10px] text-indigo-400/30 mt-0.5">{sub}</p>}
    </div>
  );
}

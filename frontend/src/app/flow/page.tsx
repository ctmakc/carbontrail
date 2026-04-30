/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, TreePine } from "lucide-react";
import { SankeyFlow } from "@/components/charts/SankeyFlow";

interface Program { program: string; department: string; grant_count: number; total_value: number; recipient_count: number; first_year: number; last_year: number }
interface Province { province: string; grant_count: number; total_value: number; recipient_count: number; program_count: number }

export default function FlowPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [sankey, setSankey] = useState<{dept_to_program: any[]; program_to_recipient: any[]} | null>(null);
  useEffect(() => {
    Promise.all([
      fetchAPI<Program[]>("/flow/by-program", { limit: 25 }),
      fetchAPI<Province[]>("/flow/by-province"),
      fetchAPI<{dept_to_program: any[]; program_to_recipient: any[]}>("/flow/sankey", { limit: 15 }),
    ]).then(([p, pv, s]) => { setPrograms(p); setProvinces(pv); setSankey(s); }).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Green Money Flow</h1>
            <p className="text-sm text-emerald-400/60">Where climate billions actually go — by program and province</p>
          </div>
        </div>


        {/* Sankey Flow Diagram */}
        {sankey && (
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
                Climate Money Flow: Department → Program → Recipient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SankeyFlow data={sankey} height={450} />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><TreePine className="h-4 w-4 text-emerald-400" />Top Climate Programs</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {programs.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-emerald-100 truncate">{p.program}</p>
                      <p className="text-[10px] text-emerald-500/50 truncate">{p.department?.split("|")[0].trim()} · {p.recipient_count} recipients · {p.first_year}–{p.last_year}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-mono text-emerald-300">{formatCurrency(p.total_value)}</p>
                      <p className="text-[10px] text-emerald-500/40">{formatNumber(p.grant_count)} grants</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-emerald-400" />By Province</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provinces.map((p, i) => {
                  const maxVal = provinces[0]?.total_value || 1;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-100">{p.province || "Unknown"}</span>
                        <span className="text-xs font-mono text-emerald-300">{formatCurrency(p.total_value)}</span>
                      </div>
                      <div className="w-full bg-emerald-950/50 rounded h-3">
                        <div className="h-3 rounded bg-gradient-to-r from-emerald-600 to-teal-500 transition-all" style={{width: `${(p.total_value / maxVal) * 100}%`}} />
                      </div>
                      <p className="text-[10px] text-emerald-500/40">{formatNumber(p.grant_count)} grants · {p.recipient_count} recipients · {p.program_count} programs</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

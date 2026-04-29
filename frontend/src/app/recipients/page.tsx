"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportCSV } from "@/components/ui/export-button";
import { Users, ArrowRightLeft } from "lucide-react";

interface Recipient { entity_name: string; entity_name_norm: string; province: string; grant_count: number; grant_value: number; grant_programs: number; contract_count: number; contract_value: number; sole_source_count: number; total_climate_value: number; dual_recipient: boolean }

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [view, setView] = useState<"top" | "dual">("top");
  useEffect(() => {
    fetchAPI<Recipient[]>(`/recipients/${view}`, { limit: 40 }).then(setRecipients).catch(() => {});
  }, [view]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400"><Users className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Top Climate Recipients</h1>
              <p className="text-sm text-emerald-400/60">Who receives the most climate-related public funding</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView("top")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "top" ? "bg-emerald-500/15 text-emerald-300" : "text-emerald-500/50 hover:text-emerald-300"}`}>All Recipients</button>
            <ExportCSV data={recipients} filename={`carbontrail-${view}-recipients`} />
            <button onClick={() => setView("dual")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "dual" ? "bg-amber-500/15 text-amber-300" : "text-emerald-500/50 hover:text-emerald-300"}`}>
              <ArrowRightLeft className="h-3 w-3 inline mr-1" />Dual (Grant + Contract)
            </button>
          </div>
        </div>

        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-emerald-500/40 border-b border-emerald-900/20">
                <span className="col-span-4">Organization</span>
                <span className="col-span-1 text-right">Province</span>
                <span className="col-span-2 text-right">Grants</span>
                <span className="col-span-2 text-right">Contracts</span>
                <span className="col-span-1 text-right">Sole Src</span>
                <span className="col-span-2 text-right">Total Climate $</span>
              </div>
              {recipients.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 rounded-lg hover:bg-emerald-500/5 transition-colors items-center">
                  <div className="col-span-4 min-w-0">
                    <a href={`/entity/${encodeURIComponent(r.entity_name_norm)}`} className="text-xs font-medium text-emerald-100 truncate hover:text-emerald-300 underline decoration-emerald-800 hover:decoration-emerald-400 transition-colors">{r.entity_name}</a>
                    {r.dual_recipient && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30 mt-0.5">dual</Badge>}
                  </div>
                  <span className="col-span-1 text-[10px] text-emerald-500/50 text-right">{r.province || "—"}</span>
                  <div className="col-span-2 text-right">
                    <p className="text-xs font-mono text-emerald-300">{formatCurrency(r.grant_value)}</p>
                    <p className="text-[10px] text-emerald-500/40">{r.grant_count} grants · {r.grant_programs} prog</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-xs font-mono text-teal-300">{formatCurrency(r.contract_value)}</p>
                    <p className="text-[10px] text-emerald-500/40">{r.contract_count} contracts</p>
                  </div>
                  <span className={`col-span-1 text-xs font-mono text-right ${r.sole_source_count > 0 ? "text-amber-400" : "text-emerald-500/30"}`}>{r.sole_source_count}</span>
                  <span className="col-span-2 text-xs font-mono text-emerald-200 font-bold text-right">{formatCurrency(r.total_climate_value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

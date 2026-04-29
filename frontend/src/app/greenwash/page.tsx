"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

interface Signal { org_name: string; registration_count: number; any_environment: boolean; any_energy: boolean; any_natural_resources: boolean; any_taxation_trade: boolean; max_subject_breadth: number; signal_type: string; climate_funding_received?: number; loop_signal_score?: number }

export default function GreenwashPage() {
  const [nexus, setNexus] = useState<Signal[]>([]);
  const [broad, setBroad] = useState<Signal[]>([]);
  useEffect(() => {
    fetchAPI<Signal[]>("/greenwash/energy-tax-nexus", { limit: 25 }).then(setNexus).catch(() => {});
    fetchAPI<Signal[]>("/greenwash/broad-spectrum", { limit: 25 }).then(setBroad).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400"><ShieldAlert className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Greenwash Radar</h1>
            <p className="text-sm text-emerald-400/60">Anomalous lobbying patterns in the climate space</p>
          </div>
        </div>

        <div className="rounded-xl border border-red-600/20 bg-red-950/30 p-4">
          <p className="text-xs text-red-300/70"><span className="font-semibold text-red-300">🔍 Methodology:</span> We flag two patterns: <strong>Energy-Tax Nexus</strong> — orgs lobbying on BOTH energy AND taxation (potential regulatory relief seeking). <strong>Broad Spectrum</strong> — orgs lobbying across 8+ subject areas (influence-maximizing pattern). These are statistical signals, not judgments.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50">⚡ Energy-Tax Nexus</CardTitle><p className="text-[11px] text-emerald-500/40">Lobbying on energy AND taxation simultaneously</p></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {nexus.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-emerald-100 truncate">{s.org_name}</p>
                      <div className="flex gap-1 mt-1">
                        {s.any_environment && <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">ENV</Badge>}
                        {s.any_energy && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">ENERGY</Badge>}
                        {s.any_taxation_trade && <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/30">TAX</Badge>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-mono text-emerald-300">{s.registration_count} reg</p>
                      {s.climate_funding_received ? <p className="text-[10px] text-emerald-500/50">{formatCurrency(s.climate_funding_received)}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50">🌐 Broad Spectrum Lobbying</CardTitle><p className="text-[11px] text-emerald-500/40">Lobbying across 8+ subject areas</p></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {broad.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-emerald-100 truncate">{s.org_name}</p>
                      <p className="text-[10px] text-emerald-500/50">{s.max_subject_breadth} subject areas</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-emerald-300">{s.registration_count} reg</p>
                      {s.climate_funding_received ? <p className="text-[10px] text-emerald-500/50">{formatCurrency(s.climate_funding_received)}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TreePine, Database, Shield, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1000px] mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><TreePine className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">About CarbonTrail</h1>
            <p className="text-sm text-emerald-400/60">Why we built this and what we believe</p>
          </div>
        </div>
        <Card className="border-emerald-600/20 bg-gradient-to-br from-emerald-950/60 to-teal-950/40">
          <CardContent className="pt-6 space-y-4 text-sm text-emerald-200/80 leading-relaxed">
            <p className="text-lg text-emerald-100 font-medium">We built CarbonTrail because we believe climate spending works better in the light.</p>
            <p>Canada invests hundreds of billions in environmental protection, clean energy, sustainable infrastructure, and climate adaptation. This is essential work. We support it fully.</p>
            <p>But we also believe that <strong className="text-emerald-300">transparency strengthens these investments</strong>. When the public can see where climate dollars go, who receives them, and what patterns emerge, it builds the trust needed to protect and expand these budgets.</p>
            <p>CarbonTrail connects three public datasets that are normally siloed: government contracts, federal grants, and lobbyist registrations. By linking them, we surface patterns that deserve review — not to undermine climate action, but to make it more effective.</p>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><Heart className="h-4 w-4 text-red-400" /> Our Principles</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-emerald-200/70">
              <p>🌱 <strong className="text-emerald-300">Pro-climate.</strong> We exist to make green spending more effective.</p>
              <p>🔍 <strong className="text-emerald-300">Review signals, not allegations.</strong> Patterns deserve investigation, not condemnation.</p>
              <p>📎 <strong className="text-emerald-300">Source-linked.</strong> Every finding traces to a public record.</p>
              <p>⚖️ <strong className="text-emerald-300">Careful language.</strong> Pattern, signal, requires verification.</p>
              <p>♻️ <strong className="text-emerald-300">Open data, open analysis.</strong> Public money, public accountability.</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><Database className="h-4 w-4 text-emerald-400" /> Data Sources</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-emerald-200/70">
              <p><strong className="text-emerald-300">PSPC Contracts</strong> — 1.26M federal procurement records</p>
              <p><strong className="text-emerald-300">Federal Grants</strong> — 1.28M grants and contributions</p>
              <p><strong className="text-emerald-300">Lobbyist Registry</strong> — 127K registrations from the Commissioner of Lobbying</p>
              <p><strong className="text-emerald-300">T3010 Charities</strong> — 83K charities + 568K directors from CRA</p>
              <p className="text-emerald-500/40 text-xs pt-2">All data under Open Government Licence — Canada.</p>
            </CardContent>
          </Card>
        </div>
        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardHeader><CardTitle className="text-base text-emerald-50 flex items-center gap-2"><Shield className="h-4 w-4 text-amber-400" /> Disclaimers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-emerald-200/60">
            <p>CarbonTrail is a transparency tool, not an investigative conclusion. All findings are review signals based on publicly available data.</p>
            <p>Lobbying is legal and often appropriate. The presence of lobbying alongside funding receipt is common and may reflect legitimate sector engagement.</p>
            <p>Entity resolution is approximate. Organizations may appear under different names across registries.</p>
            <p>This platform does not constitute legal, financial, or professional advice.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

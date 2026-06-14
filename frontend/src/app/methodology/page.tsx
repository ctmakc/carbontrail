"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Leaf, ShieldAlert, MapPin, ArrowRightLeft, Database } from "lucide-react";

export default function MethodologyPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1000px] mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Methodology</h1>
            <p className="text-sm text-emerald-400/60">How CarbonTrail detects and scores patterns</p>
          </div>
        </div>

        {/* Prominent top-level disclaimer */}
        <div className="rounded-xl border border-amber-600/30 bg-amber-950/30 p-4">
          <p className="text-sm text-amber-200/80 leading-relaxed">
            <span className="font-semibold text-amber-300">Read this first.</span> Everything on
            CarbonTrail is a <strong>review signal</strong> derived from public records — a pattern
            that may warrant a closer look. Nothing here is an allegation, finding of wrongdoing, or
            conclusion. Lobbying is legal and frequently legitimate, and receiving public funding is
            not evidence of anything improper. Every signal requires independent verification against
            the underlying source records before it should be relied upon or repeated.
          </p>
        </div>

        <Section icon={Database} title="Data Sources" color="sky">
          <p>All inputs are Canadian public datasets published as Open Data under the
            {" "}<strong>Open Government Licence — Canada</strong>:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>PSPC Contracts</strong> — federal procurement / contract disclosure</li>
            <li><strong>Federal Grants &amp; Contributions</strong> — proactive grant disclosure</li>
            <li><strong>Lobbyist Registry</strong> — registrations and subject-matter codes from the Commissioner of Lobbying</li>
            <li><strong>T3010 Charity Returns</strong> — registered charities and directors from the CRA</li>
          </ul>
          <p className="mt-2 text-emerald-500/50 text-xs">We re-publish and cross-link these
            records; we do not alter the underlying source data. Figures shown across the site are
            approximate and reflect the most recent ETL refresh — they change when the pipeline is
            re-run against updated public data.</p>
        </Section>

        <Section icon={Target} title="Climate Relevance Tagging" color="emerald">
          <p>Every contract and grant is tagged as &ldquo;climate-relevant&rdquo; if it meets either criterion:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Department match:</strong> Issued by ECCC, NRCan, Transport Canada, Infrastructure Canada, Agriculture, Fisheries, or related departments</li>
            <li><strong>Topic match:</strong> Organisation title and description are matched against climate-related keywords (clean energy, renewable, emission, carbon, hydrogen, electric vehicle, biodiversity, conservation, sustainable, GHG, net zero, etc.) using SQL <code>LIKE</code>-pattern matching.</li>
          </ul>
          <p className="mt-2 text-emerald-500/50 text-xs">This tagging is <strong>heuristic</strong>, not authoritative. Keyword <code>LIKE</code>-matching is intentionally broad and <strong>will produce false positives and false negatives</strong> — it can catch records that are not really climate-related and miss ones that are. We&apos;d rather over-include than miss real items, so users should review individual records for precise relevance.</p>
        </Section>

        <Section icon={Leaf} title="Lobby ↔ Funding Loop Detection" color="amber">
          <p>A &ldquo;loop&rdquo; exists when an organization:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Registers to lobby climate-related departments (ECCC, NRCan, or departments with environment/energy subject codes)</li>
            <li>AND receives climate-related grants or contracts from those same departments</li>
          </ol>
          <p className="mt-3"><strong>Loop Signal Score (0–100):</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Lobbying intensity: log2(registrations + 1) × 15</li>
            <li>Funding magnitude: log2(total climate $) × 5</li>
            <li>Sole-source contracts: +15 if any</li>
            <li>Dual recipient (grants + contracts): +10</li>
          </ul>
          <p className="mt-2 text-amber-400/60">⚠️ A high score does NOT indicate wrongdoing. It indicates a pattern that may warrant review.</p>
          <p className="mt-2 text-emerald-500/50 text-xs">Loops are computed by <strong>cross-matching organisation names</strong> across the lobbying and funding datasets. Name-matching is imperfect: the same organisation can appear under slightly different names, and unrelated organisations can share similar names, so this method <strong>can produce false positives</strong> (and miss genuine matches). Treat every loop as a lead to verify against the source records, not as a confirmed relationship.</p>
        </Section>

        <Section icon={ShieldAlert} title="Greenwash Signal Detection" color="red">
          <p>We flag two lobbying patterns:</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-red-900/20 p-3">
              <p className="font-medium text-red-300 text-xs">⚡ Energy-Tax Nexus</p>
              <p className="mt-1">Organization lobbies on BOTH energy (SMT-10) AND taxation/trade (SMT-20, SMT-33). May indicate seeking regulatory relief alongside climate engagement.</p>
            </div>
            <div className="rounded-lg border border-red-900/20 p-3">
              <p className="font-medium text-red-300 text-xs">🌐 Broad Spectrum Lobbying</p>
              <p className="mt-1">Organization lobbies across 8+ subject areas. This is a breadth pattern that may warrant review; it has many legitimate explanations and is not by itself evidence of diluted climate commitment.</p>
            </div>
          </div>
          <p className="mt-2 text-emerald-500/50 text-xs">Subject matter codes from the Lobbyist Registry: SMT-13 (Environment), SMT-10 (Energy), SMT-25 (Natural Resources), SMT-7 (Infrastructure).</p>
        </Section>

        <Section icon={ArrowRightLeft} title="Green Money Flow Analysis" color="emerald">
          <p>Tracks climate spending from appropriation to recipient across two channels:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Grants:</strong> Direct funding to organizations for specific programs (Clean Fuels, 2 Billion Trees, Zero Emission Vehicle Infrastructure, etc.)</li>
            <li><strong>Contracts:</strong> Procurement of goods and services by climate-related departments</li>
          </ul>
          <p className="mt-2">Data is aggregated by program, province, year, and recipient to reveal concentration and distribution patterns.</p>
        </Section>

        <Section icon={MapPin} title="Funding Gap Analysis" color="sky">
          <p>Identifies geographic imbalances in climate funding distribution:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Total climate grants by province</li>
            <li>Number of recipient organizations per province</li>
            <li>Program diversity (how many different climate programs reach each province)</li>
            <li>Year-over-year trends in climate spending</li>
          </ul>
          <p className="mt-2 text-emerald-500/50 text-xs">Note: We don&apos;t currently normalize by population or GDP. Provincial comparisons should be interpreted with that in mind.</p>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ icon: Icon, title, color, children }: { icon: React.ComponentType<{className?: string}>; title: string; color: string; children: React.ReactNode }) {
  const colors: Record<string,string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
    sky: "bg-sky-500/10 text-sky-400",
  };
  return (
    <Card className="border-emerald-900/30 bg-[#0a1210]">
      <CardHeader>
        <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${colors[color]}`}><Icon className="h-4 w-4" /></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-emerald-200/70 leading-relaxed">{children}</CardContent>
    </Card>
  );
}

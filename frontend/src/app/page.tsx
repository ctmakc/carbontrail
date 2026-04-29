"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TreePine,
  DollarSign,
  Building2,
  Leaf,
  ShieldAlert,
  ArrowRightLeft,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface Stats {
  climate_contracts: number;
  climate_contract_value: number;
  climate_grants: number;
  climate_grant_value: number;
  climate_lobby_registrations: number;
  lobby_funding_loops: number;
  dual_recipients: number;
  greenwash_signals: number;
  unique_recipients: number;
  provinces_covered: number;
}

interface Signal {
  org_name: string;
  lobby_registration_count: number;
  grant_value: number;
  contract_value: number;
  total_climate_value: number;
  sole_source_count: number;
  loop_signal_score: number;
}

interface TimelinePoint {
  year: number;
  contract_value: number;
  grant_value: number;
  total_value: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAPI<Stats>("/dashboard/stats"),
      fetchAPI<Signal[]>("/dashboard/top-signals", { limit: 12 }),
      fetchAPI<TimelinePoint[]>("/dashboard/spending-timeline"),
    ]).then(([s, sig, t]) => {
      setStats(s);
      setSignals(sig);
      setTimeline(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Hero Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
              <TreePine className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">
                Climate Spending Intelligence
              </h1>
              <p className="text-sm text-emerald-400/60">
                Tracking <span className="text-emerald-400 font-semibold">$321B+</span> in Canadian
                climate-related public funding — because every green dollar deserves accountability
              </p>
            </div>
          </div>

          {/* Pro-environment banner */}
          <div className="rounded-xl border border-emerald-600/20 bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-teal-950/60 p-4">
            <p className="text-sm text-emerald-300/80 leading-relaxed">
              🌱 <span className="font-semibold text-emerald-300">We believe in the green transition.</span>{" "}
              CarbonTrail exists to make climate spending <em>more effective</em>, not to undermine it.
              Transparent spending builds public trust. Public trust protects climate budgets.
              Accountability is the best defence against rollbacks.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <GreenStat
              title="Climate Contracts"
              value={formatNumber(stats.climate_contracts)}
              sub={formatCurrency(stats.climate_contract_value)}
              icon={Building2}
            />
            <GreenStat
              title="Climate Grants"
              value={formatNumber(stats.climate_grants)}
              sub={formatCurrency(stats.climate_grant_value)}
              icon={DollarSign}
            />
            <GreenStat
              title="Climate Lobbying"
              value={formatNumber(stats.climate_lobby_registrations)}
              sub="registrations targeting ECCC/NRCan"
              icon={Leaf}
              accent="amber"
            />
            <GreenStat
              title="Lobby→Funding Loops"
              value={formatNumber(stats.lobby_funding_loops)}
              sub="orgs that lobby AND receive climate $"
              icon={ArrowRightLeft}
              accent="amber"
            />
            <GreenStat
              title="Greenwash Signals"
              value={formatNumber(stats.greenwash_signals)}
              sub="orgs with anomalous lobbying patterns"
              icon={ShieldAlert}
              accent="red"
            />
            <GreenStat
              title="Unique Recipients"
              value={formatNumber(stats.unique_recipients)}
              sub="organizations receiving climate funding"
              icon={Users}
            />
            <GreenStat
              title="Dual Recipients"
              value={formatNumber(stats.dual_recipients)}
              sub="getting BOTH grants AND contracts"
              icon={TrendingUp}
              accent="amber"
            />
            <GreenStat
              title="Provinces Covered"
              value={stats.provinces_covered?.toString() || "0"}
              sub="receiving climate grants"
              icon={MapPin}
            />
            <GreenStat
              title="Total Tracked"
              value={formatCurrency((stats.climate_contract_value || 0) + (stats.climate_grant_value || 0))}
              sub="in climate-related public spending"
              icon={TreePine}
              wide
            />
          </div>
        ) : null}

        {/* Two columns */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Signals */}
          <Card className="lg:col-span-2 border-emerald-900/30 bg-[#0a1210]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-emerald-50 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Top Review Signals — Lobby ↔ Funding Loops
                </CardTitle>
                <Badge variant="outline" className="text-xs text-emerald-500/60 border-emerald-800/40">
                  {signals.length} signals
                </Badge>
              </div>
              <p className="text-xs text-emerald-400/40 mt-1">
                Organizations that lobby climate departments AND receive their money. Not allegations — review leads.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {signals.map((s, i) => (
                  <a
                    key={i}
                    href={`/recipients?q=${encodeURIComponent(s.org_name || "")}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-emerald-900/20 hover:bg-emerald-500/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-emerald-100 truncate">{s.org_name}</p>
                      <p className="text-[10px] text-emerald-500/50">
                        {s.lobby_registration_count} lobby registrations ·{" "}
                        {s.sole_source_count > 0 && (
                          <span className="text-amber-400/70">{s.sole_source_count} sole-source · </span>
                        )}
                        {s.grant_value > 0 && `${formatCurrency(s.grant_value)} grants`}
                        {s.contract_value > 0 && ` · ${formatCurrency(s.contract_value)} contracts`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-emerald-300">{formatCurrency(s.total_climate_value)}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          s.loop_signal_score >= 50
                            ? "text-red-400 border-red-500/30"
                            : s.loop_signal_score >= 30
                            ? "text-amber-400 border-amber-500/30"
                            : "text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {Math.round(s.loop_signal_score)}
                      </Badge>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Cards */}
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-emerald-50">Analysis Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModuleCard href="/flow" icon={ArrowRightLeft} title="Green Money Flow"
                desc="Where climate billions actually go — by program, province, year" />
              <ModuleCard href="/recipients" icon={Users} title="Top Recipients"
                desc="Who gets the most climate funding" />
              <ModuleCard href="/loops" icon={Leaf} title="Lobby ↔ Funding Loops"
                desc="Orgs that lobby for AND receive climate money" />
              <ModuleCard href="/greenwash" icon={ShieldAlert} title="Greenwash Radar"
                desc="Anomalous lobbying patterns in climate space" />
              <ModuleCard href="/gaps" icon={MapPin} title="Funding Gaps"
                desc="Where climate money ISN'T reaching" />

              <div className="mt-4 rounded-lg border border-emerald-600/20 bg-emerald-950/40 p-4">
                <p className="text-xs text-emerald-400/70 leading-relaxed">
                  <span className="font-semibold text-emerald-400">♻️ Data sourced from:</span>{" "}
                  PSPC Contracts · Federal Grants · Lobbyist Registry · T3010 Charities — all
                  Canadian open data. Updated periodically.
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-950/30 p-4">
                <p className="text-xs text-amber-400/70 leading-relaxed">
                  <span className="font-semibold text-amber-300">⚡ Why this matters:</span>{" "}
                  Climate budgets are under political pressure. The best way to protect green
                  spending is to prove it&apos;s working. Transparency builds the case for more
                  investment, not less.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spending timeline */}
        {timeline.length > 0 && (
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-emerald-50 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Climate Spending Timeline (2010–2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.map((t) => (
                  <div key={t.year} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-emerald-500/60 w-10">{t.year}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div
                        className="h-5 rounded bg-emerald-500/40 transition-all"
                        style={{
                          width: `${Math.min(100, (t.grant_value / Math.max(...timeline.map(x => x.total_value))) * 100)}%`,
                        }}
                        title={`Grants: ${formatCurrency(t.grant_value)}`}
                      />
                      <div
                        className="h-5 rounded bg-teal-400/30 transition-all"
                        style={{
                          width: `${Math.min(100, (t.contract_value / Math.max(...timeline.map(x => x.total_value))) * 100)}%`,
                        }}
                        title={`Contracts: ${formatCurrency(t.contract_value)}`}
                      />
                    </div>
                    <span className="text-xs font-mono text-emerald-300/60 w-24 text-right">
                      {formatCurrency(t.total_value)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-emerald-500/50">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/40" /> Grants</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-400/30" /> Contracts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function GreenStat({
  title, value, sub, icon: Icon, accent = "emerald", wide = false,
}: {
  title: string; value: string; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "emerald" | "amber" | "red"; wide?: boolean;
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-800/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-800/30",
    red: "bg-red-500/10 text-red-400 border-red-800/30",
  };
  return (
    <div className={`rounded-xl border ${colors[accent]} p-4 ${wide ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 opacity-60" />
        <span className="text-[11px] font-medium opacity-70">{title}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] opacity-50 mt-1">{sub}</p>
    </div>
  );
}

function ModuleCard({
  href, icon: Icon, title, desc,
}: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-emerald-900/20 bg-emerald-950/20 p-3 transition-all hover:bg-emerald-900/20 hover:border-emerald-700/30"
    >
      <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-emerald-100">{title}</p>
        <p className="text-[11px] text-emerald-500/50">{desc}</p>
      </div>
    </a>
  );
}

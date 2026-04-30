"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Flame,
  Link2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";

type Severity = "critical" | "high" | "medium";

interface LoopSignal {
  org_name: string;
  lobby_registration_count: number;
  grant_value: number;
  contract_value: number;
  total_climate_value: number;
  sole_source_count: number;
  loop_signal_score: number;
}

interface SoleSourceSignal {
  entity: string;
  entity_norm: string;
  department: string;
  total_contracts: number;
  sole_source_count: number;
  total_value: number;
  sole_source_value: number;
  sole_source_pct: number;
}

interface NewVendorSignal {
  entity: string;
  entity_norm: string;
  department: string;
  contract_value: number;
  year: number;
  first_year: number;
  is_sole_source: boolean;
}

interface GreenwashSignal {
  org_name: string;
  org_name_norm: string;
  registration_count: number;
  max_subject_breadth: number;
  signal_type: string;
}

interface Lead {
  id: string;
  source: string;
  title: string;
  detail: string;
  href: string;
  value: number;
  score: number;
  scoreLabel: string;
  severity: Severity;
  nextStep: string;
}

const caseStorageKey = "carbontrail.triage.case";
const caseNoteStorageKey = "carbontrail.triage.note";

function getStoredCaseIds() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(caseStorageKey);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function severityTone(severity: Severity) {
  if (severity === "critical") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (severity === "high") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
}

function severityRank(severity: Severity) {
  if (severity === "critical") return 3;
  if (severity === "high") return 2;
  return 1;
}

function cleanDepartment(value: string | undefined) {
  return value?.split("|")[0].trim() || "Unknown department";
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getStoredCaseNote() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(caseNoteStorageKey) ?? "";
  } catch {
    return "";
  }
}

function buildMemo(caseLeads: Lead[], caseNote: string) {
  const totalValue = caseLeads.reduce((sum, lead) => sum + lead.value, 0);
  const lines = [
    "# CarbonTrail Review Memo",
    "",
    `Generated: ${new Date().toLocaleString("en-CA")}`,
    `Signals selected: ${caseLeads.length}`,
    `Total climate value in selected signals: ${formatCurrency(totalValue)}`,
    "",
    "## Case Strategy",
    "",
    caseNote.trim() || "No analyst note captured yet.",
    "",
    "## Review Leads",
    "",
    ...caseLeads.flatMap((lead, index) => [
      `### ${index + 1}. ${lead.title}`,
      "",
      `- Source: ${lead.source}`,
      `- Severity: ${lead.severity}`,
      `- Signal: ${lead.scoreLabel}`,
      `- Value: ${formatCurrency(lead.value)}`,
      `- Detail: ${lead.detail}`,
      `- Next step: ${lead.nextStep}`,
      `- URL: ${lead.href}`,
      "",
    ]),
    "## Review Standard",
    "",
    "These are pattern signals, not allegations. Each item needs source review, context, and a legitimate-explanation check before publication.",
    "",
  ];

  return lines.join("\n");
}

export default function TriagePage() {
  const [loops, setLoops] = useState<LoopSignal[]>([]);
  const [soleSource, setSoleSource] = useState<SoleSourceSignal[]>([]);
  const [newVendors, setNewVendors] = useState<NewVendorSignal[]>([]);
  const [greenwash, setGreenwash] = useState<GreenwashSignal[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(getStoredCaseIds);
  const [caseNote, setCaseNote] = useState(getStoredCaseNote);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAPI<LoopSignal[]>("/dashboard/top-signals", { limit: 14 }),
      fetchAPI<SoleSourceSignal[]>("/anomalies/sole-source-concentration", { limit: 14 }),
      fetchAPI<NewVendorSignal[]>("/anomalies/new-vendor-big-contract", { limit: 14 }),
      fetchAPI<GreenwashSignal[]>("/greenwash/signals", { limit: 14 }),
    ])
      .then(([loopRows, soleRows, vendorRows, greenwashRows]) => {
        setLoops(loopRows);
        setSoleSource(soleRows);
        setNewVendors(vendorRows);
        setGreenwash(greenwashRows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(caseStorageKey, JSON.stringify(selectedIds));
  }, [selectedIds]);

  useEffect(() => {
    window.localStorage.setItem(caseNoteStorageKey, caseNote);
  }, [caseNote]);

  const leads = useMemo<Lead[]>(() => {
    const loopLeads = loops.map((lead) => ({
      id: `loop:${lead.org_name}`,
      source: "Lobby-funding loop",
      title: lead.org_name,
      detail: `${lead.lobby_registration_count} climate lobbying registrations, ${formatCurrency(lead.grant_value)} grants, ${formatCurrency(lead.contract_value)} contracts, ${formatNumber(lead.sole_source_count)} sole-source contracts.`,
      href: `/entity/${encodeURIComponent(lead.org_name.toUpperCase())}`,
      value: lead.total_climate_value,
      score: lead.loop_signal_score,
      scoreLabel: `${Math.round(lead.loop_signal_score)} loop score`,
      severity: lead.loop_signal_score >= 70 ? "critical" : lead.loop_signal_score >= 45 ? "high" : "medium",
      nextStep: "Open entity profile, compare lobbying dates with grant and contract award dates.",
    })) satisfies Lead[];

    const soleLeads = soleSource.map((lead) => ({
      id: `sole:${lead.entity_norm}`,
      source: "Sole-source concentration",
      title: lead.entity,
      detail: `${cleanDepartment(lead.department)}: ${lead.sole_source_count}/${lead.total_contracts} contracts are sole-source, worth ${formatCurrency(lead.sole_source_value)}.`,
      href: `/entity/${encodeURIComponent(lead.entity_norm)}`,
      value: lead.sole_source_value,
      score: lead.sole_source_pct,
      scoreLabel: `${lead.sole_source_pct}% sole-source`,
      severity: lead.sole_source_pct >= 90 ? "critical" : "high",
      nextStep: "Check procurement rationale, supplier uniqueness, and repeated amendments.",
    })) satisfies Lead[];

    const vendorLeads = newVendors.map((lead) => ({
      id: `new-vendor:${lead.entity_norm}:${lead.year}`,
      source: "New vendor large contract",
      title: lead.entity,
      detail: `${cleanDepartment(lead.department)} awarded ${formatCurrency(lead.contract_value)} in ${lead.year}; first climate record appears in ${lead.first_year}.`,
      href: `/entity/${encodeURIComponent(lead.entity_norm)}`,
      value: lead.contract_value,
      score: lead.is_sole_source ? 85 : 65,
      scoreLabel: lead.is_sole_source ? "new + sole-source" : "new large award",
      severity: lead.is_sole_source ? "critical" : "high",
      nextStep: "Verify whether this is a new supplier, renamed supplier, or first climate-tagged work.",
    })) satisfies Lead[];

    const greenwashLeads = greenwash.map((lead) => ({
      id: `greenwash:${lead.org_name_norm}`,
      source: "Greenwash radar",
      title: lead.org_name,
      detail: `${formatNumber(lead.registration_count)} registrations, ${formatNumber(lead.max_subject_breadth)} subject areas, signal type ${lead.signal_type.replaceAll("_", " ")}.`,
      href: `/entity/${encodeURIComponent(lead.org_name_norm)}`,
      value: 0,
      score: lead.registration_count + lead.max_subject_breadth,
      scoreLabel: lead.signal_type.replaceAll("_", " "),
      severity: lead.registration_count >= 80 || lead.max_subject_breadth >= 10 ? "high" : "medium",
      nextStep: "Review lobbying subjects against climate funding and public ESG claims.",
    })) satisfies Lead[];

    return [...loopLeads, ...soleLeads, ...vendorLeads, ...greenwashLeads].sort((a, b) => {
      const bySeverity = severityRank(b.severity) - severityRank(a.severity);
      if (bySeverity !== 0) return bySeverity;
      return b.value - a.value || b.score - a.score;
    });
  }, [greenwash, loops, newVendors, soleSource]);

  const sourceOptions = useMemo(() => Array.from(new Set(leads.map((lead) => lead.source))).sort(), [leads]);
  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      const matchesSeverity = severityFilter === "all" || lead.severity === severityFilter;
      const matchesQuery =
        !normalizedQuery ||
        lead.title.toLowerCase().includes(normalizedQuery) ||
        lead.detail.toLowerCase().includes(normalizedQuery) ||
        lead.nextStep.toLowerCase().includes(normalizedQuery);

      return matchesSource && matchesSeverity && matchesQuery;
    });
  }, [leads, query, severityFilter, sourceFilter]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const caseLeads = useMemo(() => leads.filter((lead) => selectedSet.has(lead.id)), [leads, selectedSet]);
  const criticalCount = leads.filter((lead) => lead.severity === "critical").length;
  const caseValue = caseLeads.reduce((sum, lead) => sum + lead.value, 0);
  const selectedSources = useMemo(() => new Set(caseLeads.map((lead) => lead.source)), [caseLeads]);
  const coverageRows = [
    ["Lobby loop", selectedSources.has("Lobby-funding loop")],
    ["Procurement", selectedSources.has("Sole-source concentration") || selectedSources.has("New vendor large contract")],
    ["Narrative risk", selectedSources.has("Greenwash radar")],
    ["High value", caseLeads.some((lead) => lead.value >= 1_000_000)],
  ] as const;
  const coverageScore = coverageRows.filter(([, covered]) => covered).length;
  const reviewLanes = [
    {
      title: "Influence timing",
      count: leads.filter((lead) => lead.source === "Lobby-funding loop").length,
      next: "Match registration dates against awards and amendments.",
    },
    {
      title: "Procurement pressure",
      count: leads.filter((lead) => lead.source === "Sole-source concentration" || lead.source === "New vendor large contract").length,
      next: "Read solicitation method, supplier uniqueness, and amendment trail.",
    },
    {
      title: "Narrative mismatch",
      count: leads.filter((lead) => lead.source === "Greenwash radar").length,
      next: "Compare lobbying subjects with public climate claims.",
    },
  ];

  function toggleLead(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function addVisiblePriorityLeads() {
    const priorityIds = filteredLeads
      .filter((lead) => lead.severity === "critical" || lead.severity === "high")
      .slice(0, 12)
      .map((lead) => lead.id);

    setSelectedIds((current) => Array.from(new Set([...current, ...priorityIds])));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Review Triage</h1>
              <p className="text-sm text-emerald-400/60">
                Turn automated climate-spending signals into a source-checkable review queue.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadText("carbontrail-review-memo.md", buildMemo(caseLeads, caseNote))}
              disabled={caseLeads.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-700/40 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export memo
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={caseLeads.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-700/30 bg-red-500/10 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Clear case
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="Total leads" value={loading ? "-" : formatNumber(leads.length)} />
          <Metric label="Visible leads" value={loading ? "-" : formatNumber(filteredLeads.length)} />
          <Metric label="Critical leads" value={loading ? "-" : formatNumber(criticalCount)} tone="red" />
          <Metric label="In case file" value={formatNumber(caseLeads.length)} tone="amber" />
          <Metric label="Case value" value={formatCurrency(caseValue)} tone="emerald" />
        </div>

        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardContent className="grid gap-3 pt-1 md:grid-cols-[minmax(0,1fr)_220px_160px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400/50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search entity, department, signal, or next step"
                className="h-10 w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 pl-9 pr-3 text-sm text-emerald-50 outline-none placeholder:text-emerald-500/40 focus:border-emerald-600/60"
              />
            </label>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="h-10 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-3 text-sm font-semibold text-emerald-100 outline-none focus:border-emerald-600/60"
            >
              <option value="all">All sources</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as Severity | "all")}
              className="h-10 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-3 text-sm font-semibold text-emerald-100 outline-none focus:border-emerald-600/60"
            >
              <option value="all">All severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
            <button
              type="button"
              onClick={addVisiblePriorityLeads}
              disabled={filteredLeads.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-700/40 bg-amber-500/10 px-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add visible priority
            </button>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-50">
                <FileText className="h-4 w-4 text-emerald-400" />
                Case Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={caseNote}
                onChange={(event) => setCaseNote(event.target.value)}
                rows={4}
                placeholder="Write the review question, source angle, and cautious public-interest framing before exporting the memo."
                className="w-full resize-none rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-3 py-3 text-sm leading-6 text-emerald-50 outline-none placeholder:text-emerald-500/40 focus:border-emerald-600/60"
              />
              <div className="flex flex-wrap gap-2">
                {coverageRows.map(([label, covered]) => (
                  <span
                    key={label}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      covered
                        ? "border-emerald-700/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-700/30 bg-amber-500/10 text-amber-300/70"
                    }`}
                  >
                    {covered ? "Covered" : "Gap"}: {label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emerald-50">Coverage readiness</p>
                <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300">
                  {coverageScore}/4
                </span>
              </div>
              {reviewLanes.map((lane) => (
                <div key={lane.title} className="rounded-lg border border-emerald-900/20 bg-emerald-950/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-100">{lane.title}</p>
                    <span className="font-mono text-xs text-emerald-400">{formatNumber(lane.count)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-emerald-400/60">{lane.next}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-50">
                <Flame className="h-4 w-4 text-amber-400" />
                Highest Priority Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLeads.slice(0, 28).map((lead) => {
                    const selected = selectedSet.has(lead.id);
                    return (
                      <article
                        key={lead.id}
                        className="grid gap-3 rounded-xl border border-emerald-900/20 bg-emerald-950/20 p-3 transition hover:border-emerald-700/30 hover:bg-emerald-900/20 md:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={severityTone(lead.severity)}>
                              {lead.severity}
                            </Badge>
                            <Badge variant="outline" className="border-emerald-800/40 text-emerald-400/70">
                              {lead.source}
                            </Badge>
                            <span className="text-xs font-mono text-emerald-500/50">{lead.scoreLabel}</span>
                          </div>
                          <h2 className="mt-2 truncate text-sm font-semibold text-emerald-50">{lead.title}</h2>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-200/60">{lead.detail}</p>
                          <p className="mt-2 text-[11px] leading-4 text-emerald-500/50">{lead.nextStep}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 md:flex-col md:items-end">
                          <span className="text-sm font-mono font-semibold text-emerald-200">{formatCurrency(lead.value)}</span>
                          <div className="flex gap-2">
                            <a
                              href={lead.href}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-800/40 px-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Open
                            </a>
                            <button
                              type="button"
                              onClick={() => toggleLead(lead.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition ${
                                selected
                                  ? "border border-emerald-600/40 bg-emerald-500/15 text-emerald-200"
                                  : "border border-amber-700/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                              }`}
                            >
                              {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                              {selected ? "Added" : "Case"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="border-emerald-900/30 bg-[#0a1210]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-emerald-50">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  Case File
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseLeads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-emerald-800/40 p-4 text-sm leading-6 text-emerald-400/60">
                    Add review leads to build a memo. The memo keeps language careful: pattern signals first, source review before claims.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caseLeads.map((lead, index) => (
                      <div key={lead.id} className="rounded-xl border border-emerald-900/20 bg-emerald-950/30 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/50">
                              Lead {index + 1} - {lead.source}
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-emerald-100">{lead.title}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleLead(lead.id)}
                            className="rounded-md p-1 text-emerald-500/50 transition hover:bg-red-500/10 hover:text-red-300"
                            aria-label={`Remove ${lead.title} from case file`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-emerald-300/60">{lead.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-700/20 bg-amber-950/20">
              <CardContent className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  <p className="text-sm font-semibold">Responsible review standard</p>
                </div>
                <ul className="space-y-2 text-xs leading-5 text-amber-200/70">
                  <li>1. Verify source records before any external claim.</li>
                  <li>2. Check legitimate explanations: program changes, unique suppliers, renamed entities.</li>
                  <li>3. Use &quot;signal&quot;, &quot;pattern&quot;, and &quot;needs review&quot; until evidence is complete.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-900/30 bg-[#0a1210]">
              <CardContent className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-emerald-300">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-semibold">Next useful checks</p>
                </div>
                <div className="grid gap-2 text-xs text-emerald-300/60">
                  <a href="/explorer" className="rounded-lg border border-emerald-900/20 p-2 transition hover:bg-emerald-500/10">
                    Run source queries in Data Explorer
                  </a>
                  <a href="/compare" className="rounded-lg border border-emerald-900/20 p-2 transition hover:bg-emerald-500/10">
                    Compare selected org with peers
                  </a>
                  <a href="/chat" className="rounded-lg border border-emerald-900/20 p-2 transition hover:bg-emerald-500/10">
                    Ask AI Chat for context, then verify
                  </a>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  tone = "emerald",
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber" | "red";
}) {
  const tones = {
    emerald: "border-emerald-800/30 bg-emerald-500/5 text-emerald-300",
    amber: "border-amber-800/30 bg-amber-500/5 text-amber-300",
    red: "border-red-800/30 bg-red-500/5 text-red-300",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-60">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, FileText, Leaf, ShieldAlert, Sparkles, ArrowLeft, Star, Share2 } from "lucide-react";
import Link from "next/link";
import { useWatchlist } from "@/components/layout/watchlist-context";
import { LobbyNetwork } from "@/components/charts/LobbyNetwork";

interface Grant { program: string; department: string; agreement_value: number; agreement_start_date: string; description_en: string }
interface Contract { description_en: string; department: string; contract_value: number; contract_date: string; is_sole_source: boolean; number_of_bids: number }
interface LobbyInfo { org_name: string; lobby_registration_count: number; loop_signal_score: number; total_climate_value: number; receives_govt_funding: boolean }
interface Profile { entity_name: string; entity_name_norm: string; business_number: string; province: string; grant_count: number; grant_value: number; grant_programs: number; grant_program_list: string[]; contract_count: number; contract_value: number; sole_source_count: number; total_climate_value: number; dual_recipient: boolean }
interface DetailData { profile: Profile | null; grants: Grant[]; contracts: Contract[]; lobbying: LobbyInfo | null }

export default function EntityDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const decodedName = decodeURIComponent(name);
  const [data, setData] = useState<DetailData | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [graphData, setGraphData] = useState<{nodes: any[]; links: any[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const { add, remove, isWatched } = useWatchlist();
  const watched = isWatched(decodedName);

  useEffect(() => {
    fetchAPI<DetailData>(`/recipients/detail/${encodeURIComponent(decodedName)}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchAPI<{nodes: any[]; links: any[]}>(`/graph/entity-connections/${encodeURIComponent(decodedName)}`)
      .then(setGraphData).catch(() => {});
  }, [decodedName]);

  const requestAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai/explain-recipient/${encodeURIComponent(decodedName)}`, { method: "GET" });
      const json = await res.json();
      setAiExplanation(json.explanation || "No explanation available.");
    } catch {
      setAiExplanation("AI analysis unavailable. Check Bedrock configuration.");
    }
    setAiLoading(false);
  };

  const p = data?.profile;

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link href="/recipients" className="inline-flex items-center gap-1 text-xs text-emerald-500/60 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Recipients
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => watched ? remove(decodedName) : add(decodedName, p?.entity_name || decodedName)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${watched ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-emerald-950/30 text-emerald-500/60 border border-emerald-800/30 hover:text-amber-400"}`}
            >
              <Star className={`h-3 w-3 ${watched ? "fill-amber-400" : ""}`} />
              {watched ? "Watching" : "Watch"}
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/30 text-emerald-500/60 border border-emerald-800/30 hover:text-emerald-400 transition-all"
            >
              <Share2 className="h-3 w-3" /> Share
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3 rounded-xl" />
            <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          </div>
        ) : !p ? (
          <div className="text-center py-20 text-emerald-500/50">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Entity not found</p>
            <p className="text-sm mt-1">No climate funding records for &ldquo;{decodedName}&rdquo;</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight text-emerald-50 break-words">{p.entity_name || decodedName}</h1>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {p.province && <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-800/40">{p.province}</Badge>}
                    {p.dual_recipient && <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">Dual Recipient</Badge>}
                    {p.business_number && <span className="text-xs text-emerald-500/40">BN: {p.business_number}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatBox label="Total Climate $" value={formatCurrency(p.total_climate_value)} color="emerald" />
              <StatBox label="Grants" value={formatCurrency(p.grant_value)} sub={`${p.grant_count} grants · ${p.grant_programs} programs`} color="emerald" />
              <StatBox label="Contracts" value={formatCurrency(p.contract_value)} sub={`${p.contract_count} contracts`} color="teal" />
              <StatBox label="Sole-Source" value={p.sole_source_count.toString()} sub={p.contract_count > 0 ? `${Math.round(p.sole_source_count / p.contract_count * 100)}% of contracts` : ""} color={p.sole_source_count > 0 ? "amber" : "emerald"} />
              <StatBox label="Lobbying" value={data?.lobbying ? `${data.lobbying.lobby_registration_count} reg` : "None found"} sub={data?.lobbying ? `Score: ${Math.round(data.lobbying.loop_signal_score)}` : ""} color={data?.lobbying ? "amber" : "emerald"} />
            </div>

            {/* AI Explanation */}
            <Card className="border-emerald-600/20 bg-emerald-950/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> AI Analysis
                  </CardTitle>
                  {!aiExplanation && (
                    <button onClick={requestAI} disabled={aiLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 text-xs font-medium hover:bg-emerald-600/50 disabled:opacity-50 transition-all">
                      {aiLoading ? "Analyzing..." : "Generate Analysis"}
                    </button>
                  )}
                </div>
              </CardHeader>
              {aiExplanation && (
                <CardContent>
                  <p className="text-sm text-emerald-200/80 leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
                </CardContent>
              )}
            </Card>

            {/* Grants + Contracts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Grants */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    Climate Grants ({data?.grants.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.grants.length === 0 ? (
                    <p className="text-xs text-emerald-500/40 text-center py-6">No climate grants found</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {data?.grants.map((g, i) => (
                        <div key={i} className="py-2 px-3 rounded-lg border border-emerald-900/20">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-medium text-emerald-100 flex-1 mr-2">{g.program || "Unknown program"}</p>
                            <span className="text-xs font-mono text-emerald-300 shrink-0">{formatCurrency(g.agreement_value)}</span>
                          </div>
                          <p className="text-[10px] text-emerald-500/50 mt-0.5">{g.department?.split("|")[0].trim()} · {g.agreement_start_date?.slice(0, 10)}</p>
                          {g.description_en && <p className="text-[10px] text-emerald-500/30 mt-1 line-clamp-2">{g.description_en}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contracts */}
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-400" />
                    Climate Contracts ({data?.contracts.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.contracts.length === 0 ? (
                    <p className="text-xs text-emerald-500/40 text-center py-6">No climate contracts found</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {data?.contracts.map((c, i) => (
                        <div key={i} className="py-2 px-3 rounded-lg border border-emerald-900/20">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-medium text-emerald-100 flex-1 mr-2 line-clamp-2">{c.description_en || "No description"}</p>
                            <span className="text-xs font-mono text-teal-300 shrink-0">{formatCurrency(c.contract_value)}</span>
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-[10px] text-emerald-500/50">{c.department?.split("|")[0].trim()} · {c.contract_date?.slice(0, 10)}</span>
                            {c.is_sole_source && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">sole-source</Badge>}
                            {c.number_of_bids === 1 && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">1 bid</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Connection Graph */}
            {graphData && graphData.nodes.length > 1 && (
              <Card className="border-emerald-900/30 bg-[#0a1210]">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400" /> Connection Graph
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <LobbyNetwork data={graphData} height={350} />
                </CardContent>
              </Card>
            )}

            {/* Lobbying detail */}
            {data?.lobbying && (
              <Card className="border-amber-900/30 bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-50 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-amber-400" /> Lobbying Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-emerald-500/50 text-xs">Registrations</span><p className="text-lg font-bold text-amber-300">{data.lobbying.lobby_registration_count}</p></div>
                    <div><span className="text-emerald-500/50 text-xs">Loop Signal</span><p className="text-lg font-bold text-amber-300">{Math.round(data.lobbying.loop_signal_score)}/100</p></div>
                    <div><span className="text-emerald-500/50 text-xs">Total Climate $</span><p className="text-lg font-bold text-emerald-300">{formatCurrency(data.lobbying.total_climate_value)}</p></div>
                    <div><span className="text-emerald-500/50 text-xs">Govt Funded</span><p className="text-lg font-bold text-amber-300">{data.lobbying.receives_govt_funding ? "Yes" : "No"}</p></div>
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

function StatBox({ label, value, sub, color = "emerald" }: { label: string; value: string; sub?: string; color?: string }) {
  const borders: Record<string, string> = {
    emerald: "border-emerald-800/30 bg-emerald-500/5",
    teal: "border-teal-800/30 bg-teal-500/5",
    amber: "border-amber-800/30 bg-amber-500/5",
  };
  const texts: Record<string, string> = { emerald: "text-emerald-300", teal: "text-teal-300", amber: "text-amber-300" };
  return (
    <div className={`rounded-xl border p-4 ${borders[color]}`}>
      <p className="text-[10px] text-emerald-500/50 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-1 ${texts[color]}`}>{value}</p>
      {sub && <p className="text-[10px] text-emerald-500/30 mt-0.5">{sub}</p>}
    </div>
  );
}

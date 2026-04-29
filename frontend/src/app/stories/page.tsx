/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface Story {
  id: string; title: string; subtitle: string; icon: string; category: string;
  entities: any[]; total_value: number; key_finding: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchAPI<Story[]>("/stories/list").then(setStories).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Data Stories</h1>
            <p className="text-sm text-emerald-400/60">Guided investigations into Canada&apos;s climate spending — real data, real patterns</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-600/20 bg-emerald-950/40 p-4">
          <p className="text-xs text-emerald-400/70">
            🌱 <strong className="text-emerald-300">These stories surface real patterns from public data.</strong> They&apos;re starting points for investigation, not conclusions. Every number links back to source records. Context matters — always look deeper.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => {
              const isExpanded = expanded === story.id;
              return (
                <Card key={story.id} className="border-emerald-900/30 bg-[#0a1210] overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : story.id)}
                    className="w-full text-left"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">{story.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg text-emerald-50">{story.title}</CardTitle>
                              <Badge variant="outline" className="text-[9px] text-emerald-500/60 border-emerald-800/30">{story.category}</Badge>
                            </div>
                            <p className="text-sm text-emerald-400/60 mt-1">{story.subtitle}</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-emerald-600 shrink-0" /> : <ChevronDown className="h-5 w-5 text-emerald-600 shrink-0" />}
                      </div>
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-4">
                      {/* Key finding */}
                      <div className="rounded-lg border border-amber-800/30 bg-amber-950/30 p-3">
                        <p className="text-xs text-amber-300/80">📌 <strong>Key Finding:</strong> {story.key_finding}</p>
                      </div>

                      {/* Entities */}
                      {story.entities.length > 0 && (
                        <div className="space-y-1">
                          {story.entities.map((e: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-emerald-900/10 hover:bg-emerald-500/5 transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-emerald-100 truncate">{e.name}</p>
                                  {e.name && !e.province && (
                                    <a href={`/entity/${encodeURIComponent(e.name.toUpperCase())}`} className="text-emerald-600 hover:text-emerald-400 transition-colors">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-[10px] text-emerald-500/40">
                                  {e.program && `Program: ${e.program}`}
                                  {e.department && `Dept: ${e.department}`}
                                  {e.lobbying && `${e.lobbying} lobby registrations`}
                                  {e.ss_rate && `Sole-source: ${e.ss_rate}`}
                                  {e.grants && `${formatNumber(e.grants)} grants`}
                                  {e.recipients && ` · ${formatNumber(e.recipients)} recipients`}
                                  {e.year && ` · ${e.year}`}
                                  {e.score && ` · Score: ${Math.round(e.score)}`}
                                </p>
                              </div>
                              <span className="text-sm font-mono text-emerald-300 shrink-0 ml-3">{formatCurrency(e.value)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total */}
                      <div className="text-right">
                        <p className="text-xs text-emerald-500/40">Total tracked in this story</p>
                        <p className="text-lg font-bold text-emerald-200 font-mono">{formatCurrency(story.total_value)}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

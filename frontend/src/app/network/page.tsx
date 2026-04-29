"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LobbyNetwork } from "@/components/charts/LobbyNetwork";
import { Network, SlidersHorizontal } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphData = any;

export default function NetworkPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(40);
  const [limit, setLimit] = useState(50);

  const load = () => {
    setLoading(true);
    fetchAPI<GraphData>("/graph/lobby-network", { min_score: minScore, limit })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [minScore, limit]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Lobby Network Graph</h1>
              <p className="text-sm text-emerald-400/60">
                Visualizing connections between organizations, lobbying, and government departments
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-500/50" />
                <span className="text-xs text-emerald-500/50">Filters:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-emerald-400/60">Min Signal Score</label>
                <input
                  type="range" min={10} max={80} value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
                <span className="text-xs font-mono text-emerald-300 w-8">{minScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-emerald-400/60">Max Nodes</label>
                <select
                  value={limit} onChange={e => setLimit(Number(e.target.value))}
                  className="rounded bg-emerald-950/50 border border-emerald-800/30 text-xs text-emerald-300 px-2 py-1"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                </select>
              </div>
              {data && (
                <span className="text-xs text-emerald-500/40">
                  {data.nodes.length} nodes · {data.links.length} connections
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph */}
        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400/60">
              Organizations (green) connected to government departments (purple) via grants, contracts, and lobbying
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <Skeleton className="h-[600px] w-full rounded-xl" />
            ) : (
              <LobbyNetwork data={data} height={600} />
            )}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-emerald-600/20 bg-emerald-950/40 p-4">
          <p className="text-xs text-emerald-400/70">
            🌐 <strong className="text-emerald-300">How to read this graph:</strong>{" "}
            Green circles are organizations. Purple circles are government departments.
            Lines show funding relationships (green = grants, teal = contracts, amber = lobbying).
            Larger circles = higher signal scores. Hover over any node for details.
            Click and drag to explore. Scroll to zoom.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

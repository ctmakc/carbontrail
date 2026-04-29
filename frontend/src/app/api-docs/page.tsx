"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, ExternalLink } from "lucide-react";

const endpoints = [
  { group: "Dashboard", routes: [
    { method: "GET", path: "/api/dashboard/stats", desc: "Overview statistics" },
    { method: "GET", path: "/api/dashboard/spending-timeline", desc: "Yearly climate spending" },
    { method: "GET", path: "/api/dashboard/top-departments", desc: "Top spending departments" },
    { method: "GET", path: "/api/dashboard/top-signals", desc: "Top lobby-funding loop signals" },
  ]},
  { group: "Money Flow", routes: [
    { method: "GET", path: "/api/flow/by-program", desc: "Climate programs ranked by funding" },
    { method: "GET", path: "/api/flow/by-province", desc: "Provincial funding distribution" },
    { method: "GET", path: "/api/flow/sankey", desc: "Sankey diagram data" },
    { method: "GET", path: "/api/flow/yearly-breakdown", desc: "Department spending by year" },
  ]},
  { group: "Recipients", routes: [
    { method: "GET", path: "/api/recipients/top", desc: "Top climate funding recipients" },
    { method: "GET", path: "/api/recipients/dual", desc: "Dual recipients (grants + contracts)" },
    { method: "GET", path: "/api/recipients/detail/{name}", desc: "Full entity profile" },
    { method: "GET", path: "/api/recipients/timeline/{name}", desc: "Entity event timeline" },
    { method: "GET", path: "/api/recipients/related/{name}", desc: "Similar organizations" },
  ]},
  { group: "Lobby Loops", routes: [
    { method: "GET", path: "/api/loops/top", desc: "Top lobby-funding loops" },
    { method: "GET", path: "/api/loops/detail/{name}", desc: "Loop detail for an organization" },
    { method: "GET", path: "/api/loops/stats", desc: "Loop summary statistics" },
  ]},
  { group: "Greenwash", routes: [
    { method: "GET", path: "/api/greenwash/signals", desc: "All greenwash signals" },
    { method: "GET", path: "/api/greenwash/energy-tax-nexus", desc: "Energy-taxation nexus signals" },
    { method: "GET", path: "/api/greenwash/broad-spectrum", desc: "Broad spectrum lobby signals" },
  ]},
  { group: "Anomalies", routes: [
    { method: "GET", path: "/api/anomalies/spending-spikes", desc: "Year-over-year spending spikes" },
    { method: "GET", path: "/api/anomalies/sole-source-concentration", desc: "High sole-source rate vendors" },
    { method: "GET", path: "/api/anomalies/new-vendor-big-contract", desc: "New vendors with large contracts" },
    { method: "GET", path: "/api/anomalies/summary", desc: "Anomaly type counts" },
  ]},
  { group: "Intelligence", routes: [
    { method: "POST", path: "/api/ai/explain", desc: "AI pattern explanation" },
    { method: "GET", path: "/api/ai/explain-loop/{name}", desc: "Explain lobby loop for entity" },
    { method: "GET", path: "/api/ai/explain-recipient/{name}", desc: "Explain recipient profile" },
    { method: "POST", path: "/api/chat/", desc: "AI conversational chat" },
    { method: "GET", path: "/api/insights/key-findings", desc: "Auto-generated insights" },
    { method: "GET", path: "/api/stories/list", desc: "Pre-built data stories" },
  ]},
  { group: "Browse", routes: [
    { method: "GET", path: "/api/departments/list", desc: "All departments with spending" },
    { method: "GET", path: "/api/departments/detail/{name}", desc: "Department profile" },
    { method: "GET", path: "/api/programs/list", desc: "All climate programs" },
    { method: "GET", path: "/api/programs/detail/{name}", desc: "Program detail" },
    { method: "GET", path: "/api/search/?q=term", desc: "Full-text entity search" },
  ]},
  { group: "Graph & Explorer", routes: [
    { method: "GET", path: "/api/graph/lobby-network", desc: "Force graph: lobby network" },
    { method: "GET", path: "/api/graph/entity-connections/{name}", desc: "Entity connection graph" },
    { method: "GET", path: "/api/explorer/templates", desc: "Query templates" },
    { method: "POST", path: "/api/explorer/run", desc: "Run parameterized query" },
  ]},
  { group: "Other", routes: [
    { method: "GET", path: "/api/gaps/provincial", desc: "Provincial funding gaps" },
    { method: "GET", path: "/api/gaps/year-over-year", desc: "YoY spending growth" },
    { method: "GET", path: "/api/health", desc: "Health check" },
  ]},
];

export default function ApiDocsPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><Code2 className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">API Reference</h1>
              <p className="text-sm text-emerald-400/60">{endpoints.reduce((s, g) => s + g.routes.length, 0)} endpoints across {endpoints.length} groups</p>
            </div>
          </div>
          <a href="http://localhost:8902/docs" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-800/30 text-xs text-emerald-500/60 hover:text-emerald-400 transition-colors">
            OpenAPI Docs <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {endpoints.map((group) => (
          <Card key={group.group} className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-50">{group.group}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {group.routes.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-emerald-500/5 transition-colors">
                    <Badge variant="outline" className={`text-[9px] font-mono w-12 justify-center ${r.method === "POST" ? "text-amber-400 border-amber-500/30" : "text-emerald-400 border-emerald-500/30"}`}>
                      {r.method}
                    </Badge>
                    <code className="text-xs font-mono text-emerald-200 flex-1">{r.path}</code>
                    <span className="text-[11px] text-emerald-500/50 shrink-0">{r.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

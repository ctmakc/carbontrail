"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

const releases = [
  {
    version: "0.9.0", date: "Sprint 10", tag: "latest",
    changes: [
      "Composite Climate Accountability Score per entity",
      "Sparkline mini-charts component",
      "Dark/light theme toggle with persistent preference",
      "Backend LRU caching for expensive queries",
      "25-test backend test suite (all passing)",
      "Score breakdown on entity pages with progress bars",
      "Changelog page",
    ],
  },
  {
    version: "0.8.0", date: "Sprint 9",
    changes: [
      "5 pre-built Data Stories (EV Billions, Sole-Source, Lobby Nexus, Provincial Divide, 2018 Surge)",
      "Bulk entity lookup (paste 50 names)",
      "API Reference page (43 endpoints documented)",
      "Scroll-to-top floating button",
      "Dynamic OG meta for entity pages",
    ],
  },
  {
    version: "0.7.0", date: "Sprint 8",
    changes: [
      "Auto-insights engine (7 key findings)",
      "Related entities on entity pages",
      "Breadcrumb navigation",
      "NProgress-style page transitions",
      "Dashboard insight cards",
    ],
  },
  {
    version: "0.6.0", date: "Sprint 7",
    changes: [
      "Department profiles (list + detail with lobbyists)",
      "Data Explorer (6 curated query templates)",
      "PWA manifest + favicon",
      "Footer with links",
      "Animated counter component",
      "Error boundary",
      "Sidebar reorganized into sections",
    ],
  },
  {
    version: "0.5.0", date: "Sprint 6",
    changes: [
      "Interactive Canada province heatmap",
      "Entity event timeline",
      "Toast notification system",
      "Keyboard shortcuts (? overlay)",
      "Print-friendly entity reports",
      "Data quality fix (38K null names)",
    ],
  },
  {
    version: "0.4.0", date: "Sprint 5",
    changes: [
      "Sankey flow diagram (d3-sankey)",
      "AI Chat with Bedrock/fallback",
      "Anomaly detection (3 types)",
      "Next.js API proxy",
      "OG meta tags",
    ],
  },
  {
    version: "0.3.0", date: "Sprint 4",
    changes: [
      "⌘K Command Palette",
      "Compare organizations side-by-side",
      "Watchlist with localStorage",
      "Climate Programs deep-dive",
      "Top Bar with data freshness",
      "Custom 404 page",
    ],
  },
  {
    version: "0.2.0", date: "Sprint 3",
    changes: [
      "Force-directed network graph",
      "Network visualization page",
      "Responsive sidebar with mobile hamburger",
      "Debounced instant search",
      "Loading skeletons",
      "CSV export buttons",
    ],
  },
  {
    version: "0.1.1", date: "Sprint 2",
    changes: [
      "AWS Bedrock AI integration",
      "Entity detail pages with AI analysis",
      "Recharts timeline + province bar",
      "Docker Compose + Dockerfiles",
      "Methodology + About pages",
    ],
  },
  {
    version: "0.1.0", date: "Sprint 1",
    changes: [
      "Initial release — ETL pipeline (5.2M records)",
      "DuckDB database (747MB)",
      "FastAPI backend (7 routers)",
      "Next.js frontend (7 pages)",
      "Green-themed UI with pro-climate messaging",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[800px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><History className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Changelog</h1>
            <p className="text-sm text-emerald-400/60">Every feature, every sprint — from zero to production</p>
          </div>
        </div>

        <div className="space-y-4">
          {releases.map((r) => (
            <Card key={r.version} className="border-emerald-900/30 bg-[#0a1210]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-emerald-50">v{r.version}</CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-500/60 border-emerald-800/30">{r.date}</Badge>
                  {r.tag && <Badge className="text-[10px] bg-emerald-600 text-white">{r.tag}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {r.changes.map((c, i) => (
                    <li key={i} className="text-sm text-emerald-200/70 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1.5 shrink-0">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

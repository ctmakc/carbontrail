"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportCSV } from "@/components/ui/export-button";
import { Layers, Search } from "lucide-react";
import Link from "next/link";

interface Program {
  program: string; department: string; grant_count: number; total_value: number;
  recipient_count: number; province_count: number; first_year: number; last_year: number; avg_grant_value: number;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAPI<Program[]>("/programs/list", { limit: 100 })
      .then(setPrograms).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter.length >= 2
    ? programs.filter(p => p.program.toLowerCase().includes(filter.toLowerCase()) || p.department?.toLowerCase().includes(filter.toLowerCase()))
    : programs;

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Climate Programs</h1>
              <p className="text-sm text-emerald-400/60">Deep-dive into individual climate funding programs</p>
            </div>
          </div>
          <ExportCSV data={filtered} filename="carbontrail-programs" />
        </div>

        {/* Filter */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700" />
          <input
            className="w-full rounded-lg border border-emerald-800/30 bg-emerald-950/30 pl-10 pr-4 py-2 text-sm text-emerald-100 placeholder:text-emerald-700/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            placeholder="Filter programs..."
            value={filter} onChange={e => setFilter(e.target.value)}
          />
        </div>

        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">{Array.from({length: 10}).map((_,i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-emerald-500/40 border-b border-emerald-900/20">
                  <span className="col-span-4">Program</span>
                  <span className="col-span-2">Department</span>
                  <span className="col-span-1 text-right">Grants</span>
                  <span className="col-span-1 text-right">Recipients</span>
                  <span className="col-span-1 text-right">Provinces</span>
                  <span className="col-span-1 text-right">Years</span>
                  <span className="col-span-2 text-right">Total Value</span>
                </div>
                {filtered.map((p, i) => (
                  <Link key={i} href={`/programs/${encodeURIComponent(p.program)}`}
                    className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg hover:bg-emerald-500/5 transition-colors items-center">
                    <span className="col-span-4 text-xs font-medium text-emerald-100 truncate">{p.program}</span>
                    <span className="col-span-2 text-[10px] text-emerald-500/50 truncate">{p.department?.split("|")[0].trim()}</span>
                    <span className="col-span-1 text-xs font-mono text-emerald-500/60 text-right">{formatNumber(p.grant_count)}</span>
                    <span className="col-span-1 text-xs font-mono text-emerald-500/60 text-right">{formatNumber(p.recipient_count)}</span>
                    <span className="col-span-1 text-xs font-mono text-emerald-500/60 text-right">{p.province_count}</span>
                    <span className="col-span-1 text-[10px] text-emerald-500/40 text-right">{p.first_year}–{p.last_year}</span>
                    <span className="col-span-2 text-xs font-mono text-emerald-300 font-bold text-right">{formatCurrency(p.total_value)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

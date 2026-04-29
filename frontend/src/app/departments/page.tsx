"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { fetchAPI, formatCurrency, formatNumber } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportCSV } from "@/components/ui/export-button";
import { Building, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Dept { department: string; contract_count: number; contract_value: number; grant_count: number; grant_value: number; grant_recipients: number; total_value: number }

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<Dept[]>("/departments/list").then(setDepts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400"><Building className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Government Departments</h1>
              <p className="text-sm text-emerald-400/60">Climate spending by department — who spends how much</p>
            </div>
          </div>
          <ExportCSV data={depts} filename="carbontrail-departments" />
        </div>

        <Card className="border-emerald-900/30 bg-[#0a1210]">
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">{Array.from({length: 8}).map((_,i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-emerald-500/40 border-b border-emerald-900/20">
                  <span className="col-span-4">Department</span>
                  <span className="col-span-2 text-right">Contracts</span>
                  <span className="col-span-2 text-right">Grants</span>
                  <span className="col-span-1 text-right">Recipients</span>
                  <span className="col-span-3 text-right">Total Climate $</span>
                </div>
                {depts.map((d, i) => (
                  <Link key={i} href={`/departments/${encodeURIComponent(d.department)}`}
                    className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg hover:bg-emerald-500/5 transition-colors items-center group">
                    <span className="col-span-4 text-xs font-medium text-emerald-100 truncate group-hover:text-emerald-300 flex items-center gap-1">
                      {d.department?.split("|")[0].trim()}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </span>
                    <div className="col-span-2 text-right">
                      <p className="text-xs font-mono text-teal-400">{formatCurrency(d.contract_value)}</p>
                      <p className="text-[10px] text-emerald-500/30">{formatNumber(d.contract_count)}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-xs font-mono text-emerald-400">{formatCurrency(d.grant_value)}</p>
                      <p className="text-[10px] text-emerald-500/30">{formatNumber(d.grant_count)}</p>
                    </div>
                    <span className="col-span-1 text-xs font-mono text-emerald-500/60 text-right">{formatNumber(d.grant_recipients)}</span>
                    <span className="col-span-3 text-sm font-mono text-emerald-200 font-bold text-right">{formatCurrency(d.total_value)}</span>
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

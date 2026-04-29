"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "blue" | "red" | "amber" | "emerald" | "purple";
}

const accentStyles = {
  blue: "from-blue-500/10 to-transparent border-blue-500/20",
  red: "from-red-500/10 to-transparent border-red-500/20",
  amber: "from-amber-500/10 to-transparent border-amber-500/20",
  emerald: "from-emerald-500/10 to-transparent border-emerald-500/20",
  purple: "from-purple-500/10 to-transparent border-purple-500/20",
};

const iconColors = {
  blue: "text-blue-400 bg-blue-500/10",
  red: "text-red-400 bg-red-500/10",
  amber: "text-amber-400 bg-amber-500/10",
  emerald: "text-emerald-400 bg-emerald-500/10",
  purple: "text-purple-400 bg-purple-500/10",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, accent = "blue" }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02]",
        accentStyles[accent]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-emerald-400" : "text-red-400")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", iconColors[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

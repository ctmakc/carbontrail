"use client";

import { formatCurrency } from "@/lib/api";
import { DollarSign, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  event_type: "grant" | "contract";
  title: string;
  department: string;
  value: number;
  event_date: string;
  description: string;
}

export function EntityTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return (
    <p className="text-xs text-emerald-500/40 text-center py-6">No timeline events</p>
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-800/30" />

      <div className="space-y-3">
        {events.map((e, i) => {
          const isGrant = e.event_type === "grant";
          return (
            <div key={i} className="flex gap-3 ml-1">
              {/* Dot */}
              <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                isGrant ? "border-emerald-600/40 bg-emerald-500/15 text-emerald-400" : "border-teal-600/40 bg-teal-500/15 text-teal-400"
              }`}>
                {isGrant ? <DollarSign className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-emerald-100 line-clamp-2">{e.title || "Untitled"}</p>
                    <p className="text-[10px] text-emerald-500/50 mt-0.5">
                      {e.department?.split("|")[0].trim()}
                      {e.event_date && ` · ${e.event_date.slice(0, 10)}`}
                    </p>
                    {e.description && e.description !== "Competitive" && (
                      <p className="text-[10px] text-emerald-500/30 mt-0.5 line-clamp-1">{e.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-mono ${isGrant ? "text-emerald-300" : "text-teal-300"}`}>
                      {formatCurrency(e.value)}
                    </span>
                    <Badge variant="outline" className={`text-[9px] ${isGrant ? "text-emerald-500 border-emerald-700/30" : "text-teal-500 border-teal-700/30"}`}>
                      {isGrant ? "grant" : "contract"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

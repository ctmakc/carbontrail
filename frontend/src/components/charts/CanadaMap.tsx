"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/api";

interface ProvinceData {
  province: string;
  total_value: number;
  grant_count: number;
  recipient_count: number;
}

// Simplified Canada province paths (centered, viewBox 0 0 1000 700)
const PROVINCES: Record<string, { path: string; label: string; cx: number; cy: number }> = {
  BC: { path: "M80,200 L140,120 L180,180 L160,350 L80,380 Z", label: "BC", cx: 120, cy: 250 },
  AB: { path: "M160,150 L240,150 L240,380 L160,350 Z", label: "AB", cx: 200, cy: 265 },
  SK: { path: "M240,150 L340,150 L340,380 L240,380 Z", label: "SK", cx: 290, cy: 265 },
  MB: { path: "M340,150 L430,130 L440,380 L340,380 Z", label: "MB", cx: 385, cy: 260 },
  ON: { path: "M440,180 L560,120 L600,200 L580,380 L440,380 Z", label: "ON", cx: 510, cy: 280 },
  QC: { path: "M560,80 L700,40 L740,160 L680,300 L580,320 L560,120 Z", label: "QC", cx: 650, cy: 170 },
  NB: { path: "M720,220 L760,200 L780,250 L740,270 Z", label: "NB", cx: 750, cy: 240 },
  NS: { path: "M760,260 L820,240 L830,280 L770,290 Z", label: "NS", cx: 795, cy: 265 },
  PE: { path: "M790,220 L820,215 L822,230 L792,235 Z", label: "PE", cx: 806, cy: 225 },
  NL: { path: "M780,80 L860,60 L880,160 L800,180 Z", label: "NL", cx: 830, cy: 120 },
  YT: { path: "M60,20 L140,20 L150,120 L80,130 Z", label: "YT", cx: 105, cy: 70 },
  NT: { path: "M150,20 L340,20 L340,130 L180,130 L150,120 Z", label: "NT", cx: 245, cy: 70 },
  NU: { path: "M340,20 L600,20 L560,80 L430,130 L340,130 Z", label: "NU", cx: 460, cy: 65 },
};

export function CanadaMap({ data }: { data: ProvinceData[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  
  const dataMap = new Map(data.map(d => [d.province, d]));
  const maxValue = Math.max(...data.map(d => d.total_value), 1);

  const getOpacity = (prov: string) => {
    const d = dataMap.get(prov);
    if (!d) return 0.08;
    return 0.15 + (d.total_value / maxValue) * 0.75;
  };

  const hoveredData = hovered ? dataMap.get(hovered) : null;

  return (
    <div className="relative">
      <svg viewBox="0 0 920 400" className="w-full h-auto">
        {Object.entries(PROVINCES).map(([code, { path, label, cx, cy }]) => {
          const opacity = getOpacity(code);
          const isHovered = hovered === code;
          return (
            <g key={code}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <path
                d={path}
                fill={`rgba(16, 185, 129, ${opacity})`}
                stroke={isHovered ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.2)"}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-200"
              />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fill={opacity > 0.4 ? "rgba(255,255,255,0.8)" : "rgba(16,185,129,0.4)"}
                fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif"
                className="pointer-events-none"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredData && (
        <div className="absolute top-2 right-2 rounded-lg border border-emerald-800/40 bg-[#0a1210]/95 p-3 text-xs pointer-events-none">
          <p className="font-medium text-emerald-100">{hoveredData.province}</p>
          <p className="text-emerald-400 mt-1">{formatCurrency(hoveredData.total_value)}</p>
          <p className="text-emerald-500/50">{hoveredData.grant_count} grants · {hoveredData.recipient_count} recipients</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-500/40">
        <span>Less funding</span>
        <div className="flex gap-0.5">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
            <div key={o} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `rgba(16,185,129,${o})` }} />
          ))}
        </div>
        <span>More funding</span>
      </div>
    </div>
  );
}

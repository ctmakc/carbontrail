/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";

// Force graph must be loaded client-side only (uses canvas)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  label: string;
  type: "org" | "dept";
  score: number;
  climate_value: number;
  lobby_count: number;
  size: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "grant" | "contract" | "lobby";
  value: number;
  count: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const TYPE_COLORS: Record<string, string> = {
  grant: "#10b981",    // emerald
  contract: "#2dd4bf", // teal
  lobby: "#f59e0b",    // amber
};

const NODE_COLORS: Record<string, string> = {
  org: "#10b981",
  dept: "#6366f1",
};

export function LobbyNetwork({ data, height = 500 }: { data: GraphData | null; height?: number }) {
  const fgRef = useRef<any>(undefined);
  const [hovered, setHovered] = useState<GraphNode | null>(null);

  useEffect(() => {
    // Zoom to fit on load
    const fg = fgRef.current as { zoomToFit?: (ms: number, px: number) => void } | null;
    if (fg?.zoomToFit) {
      setTimeout(() => fg.zoomToFit?.(400, 40), 500);
    }
  }, [data]);

  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const size = node.size || 6;
    const isHovered = hovered?.id === node.id;

    // Glow for hovered
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, size + 4, 0, 2 * Math.PI);
      ctx.fillStyle = node.type === "dept" ? "rgba(99,102,241,0.2)" : "rgba(16,185,129,0.2)";
      ctx.fill();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
    ctx.fillStyle = NODE_COLORS[node.type] || "#666";
    ctx.fill();

    // Border for depts
    if (node.type === "dept") {
      ctx.strokeStyle = "rgba(99,102,241,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Label
    const label = (node.label || "").slice(0, 25);
    ctx.font = `${node.type === "dept" ? "bold " : ""}${Math.max(3, size * 0.7)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHovered ? "#fff" : "rgba(240,240,240,0.6)";
    ctx.fillText(label, node.x || 0, (node.y || 0) + size + 2);
  }, [hovered]);

  if (!data || !data.nodes.length) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500/40 text-sm">
        No graph data available
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-emerald-900/20 bg-[#060d0b]">
      <ForceGraph2D
        ref={fgRef as any}
        graphData={data}
        width={undefined}
        height={height}
        backgroundColor="transparent"
        nodeCanvasObject={paintNode as any}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, (node.size || 6) + 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={(link: any) => {
          const t = typeof link.type === "string" ? link.type : "grant";
          return TYPE_COLORS[t] || "#333";
        }}
        linkWidth={(link: any) => Math.max(0.5, Math.min(3, Math.log10((link.value || 1) + 1) * 0.5))}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={0.9}
        onNodeHover={(node: any) => setHovered(node)}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-4 text-[10px] text-emerald-400/60">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Organizations</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Departments</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 rounded" /> Grants</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-teal-400 rounded" /> Contracts</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-amber-500 rounded" /> Lobbying</span>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute top-3 right-3 max-w-xs rounded-lg border border-emerald-800/40 bg-[#0a1210]/95 p-3 text-xs pointer-events-none">
          <p className="font-medium text-emerald-100">{hovered.label}</p>
          <p className="text-emerald-500/50">{hovered.type === "dept" ? "Government Department" : "Organization"}</p>
          {hovered.type === "org" && (
            <>
              {hovered.climate_value > 0 && <p className="text-emerald-400 mt-1">Climate $: ${(hovered.climate_value / 1e6).toFixed(1)}M</p>}
              {hovered.lobby_count > 0 && <p className="text-amber-400">Lobby registrations: {hovered.lobby_count}</p>}
              {hovered.score > 0 && <p className="text-red-400">Signal score: {Math.round(hovered.score)}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

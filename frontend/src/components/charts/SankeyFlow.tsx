"use client";

import { useEffect, useRef } from "react";
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from "d3-sankey";

interface SankeyData {
  dept_to_program: { source: string; target: string; value: number }[];
  program_to_recipient: { source: string; target: string; value: number }[];
}

const COLORS: Record<string, string> = {
  dept: "#6366f1",
  program: "#10b981",
  recipient: "#2dd4bf",
};

const formatM = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
};

interface SNode {
  name: string;
  type: string;
}

export function SankeyFlow({ data, height = 500 }: { data: SankeyData | null; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = svgRef.current;
    const width = svg.clientWidth || 900;

    // Build node/link arrays
    const nodeMap = new Map<string, SNode>();
    const links: { source: number; target: number; value: number }[] = [];

    const addNode = (name: string, type: string) => {
      const short = name.split("|")[0].trim().slice(0, 40);
      if (!nodeMap.has(short)) nodeMap.set(short, { name: short, type });
      return short;
    };

    // Dept → Program links
    for (const l of data.dept_to_program.slice(0, 20)) {
      const s = addNode(l.source, "dept");
      const t = addNode(l.target, "program");
      if (s !== t) links.push({ source: 0, target: 0, value: l.value }); // placeholder, fix below
    }

    // Program → Recipient links
    for (const l of data.program_to_recipient.slice(0, 25)) {
      const s = addNode(l.source, "program");
      const t = addNode(l.target, "recipient");
      if (s !== t) links.push({ source: 0, target: 0, value: l.value });
    }

    const nodes = Array.from(nodeMap.entries()).map(([, v]) => v);
    const nodeIndex = new Map(nodes.map((n, i) => [n.name, i]));

    // Rebuild links with correct indices
    const realLinks: { source: number; target: number; value: number }[] = [];
    for (const l of data.dept_to_program.slice(0, 20)) {
      const si = nodeIndex.get(l.source.split("|")[0].trim().slice(0, 40));
      const ti = nodeIndex.get(l.target.split("|")[0].trim().slice(0, 40));
      if (si !== undefined && ti !== undefined && si !== ti) {
        realLinks.push({ source: si, target: ti, value: Math.max(l.value, 1) });
      }
    }
    for (const l of data.program_to_recipient.slice(0, 25)) {
      const si = nodeIndex.get(l.source.split("|")[0].trim().slice(0, 40));
      const ti = nodeIndex.get(l.target.split("|")[0].trim().slice(0, 40));
      if (si !== undefined && ti !== undefined && si !== ti) {
        realLinks.push({ source: si, target: ti, value: Math.max(l.value, 1) });
      }
    }

    if (nodes.length < 2 || realLinks.length < 1) return;

    // D3 Sankey layout
    const sankeyGen = sankey<SNode, object>()
      .nodeWidth(12)
      .nodePadding(8)
      .extent([[1, 5], [width - 1, height - 5]]);

    try {
      const graph = sankeyGen({
        nodes: nodes.map(n => ({ ...n })),
        links: realLinks.map(l => ({ ...l })),
      });

      // Clear previous
      svg.innerHTML = "";

      // Links
      const linkPath = sankeyLinkHorizontal();
      for (const link of graph.links) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = linkPath(link as SankeyLink<SNode, object>);
        if (d) path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "rgba(16,185,129,0.15)");
        path.setAttribute("stroke-width", String(Math.max(1, (link as { width?: number }).width || 1)));
        svg.appendChild(path);
      }

      // Nodes
      for (const node of graph.nodes) {
        const n = node as SankeyNode<SNode, object> & SNode;
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(n.x0 || 0));
        rect.setAttribute("y", String(n.y0 || 0));
        rect.setAttribute("width", String((n.x1 || 0) - (n.x0 || 0)));
        rect.setAttribute("height", String(Math.max(1, (n.y1 || 0) - (n.y0 || 0))));
        rect.setAttribute("fill", COLORS[n.type] || "#666");
        rect.setAttribute("rx", "2");
        svg.appendChild(rect);

        // Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const isLeft = (n.x0 || 0) < width / 2;
        text.setAttribute("x", String(isLeft ? (n.x1 || 0) + 6 : (n.x0 || 0) - 6));
        text.setAttribute("y", String(((n.y0 || 0) + (n.y1 || 0)) / 2));
        text.setAttribute("dy", "0.35em");
        text.setAttribute("text-anchor", isLeft ? "start" : "end");
        text.setAttribute("fill", "rgba(167,243,208,0.5)");
        text.setAttribute("font-size", "9");
        text.setAttribute("font-family", "Inter, sans-serif");
        text.textContent = (n.name || "").slice(0, 30);
        svg.appendChild(text);
      }
    } catch (e) {
      console.error("Sankey error:", e);
    }
  }, [data, height]);

  if (!data) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-900/20 bg-[#060d0b] p-2">
      <svg ref={svgRef} width="100%" height={height} />
      <div className="flex gap-4 mt-2 px-2 text-[10px] text-emerald-500/40">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" /> Departments</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Programs</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-400" /> Recipients</span>
      </div>
    </div>
  );
}

const API_BASE = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}:8902/api`
  : "http://localhost:8902/api";

export async function fetchAPI<T = unknown>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function postAPI<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Formatting utilities
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-CA");
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "—";
  return `${(value).toFixed(decimals)}%`;
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "high": return "text-red-500";
    case "medium": return "text-amber-500";
    case "low": return "text-emerald-500";
    default: return "text-zinc-400";
  }
}

export function severityBg(severity: string): string {
  switch (severity) {
    case "high": return "bg-red-500/10 border-red-500/20 text-red-400";
    case "medium": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "low": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    default: return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
  }
}

export function riskScoreColor(score: number): string {
  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-amber-400";
  return "text-emerald-400";
}

export function hhiLabel(hhi: number): { label: string; color: string } {
  if (hhi >= 5000) return { label: "Very High", color: "text-red-400" };
  if (hhi >= 2500) return { label: "High", color: "text-orange-400" };
  if (hhi >= 1500) return { label: "Moderate", color: "text-amber-400" };
  return { label: "Competitive", color: "text-emerald-400" };
}

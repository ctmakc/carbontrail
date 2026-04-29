"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TimelinePoint {
  year: number;
  contract_value: number;
  grant_value: number;
  total_value: number;
}

const formatM = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
};

export function SpendingTimeline({ data }: { data: TimelinePoint[] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grantGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="contractGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "rgba(16,185,129,0.4)" }} stroke="rgba(16,185,129,0.1)" />
        <YAxis tickFormatter={formatM} tick={{ fontSize: 11, fill: "rgba(16,185,129,0.4)" }} stroke="rgba(16,185,129,0.1)" width={65} />
        <Tooltip
          contentStyle={{ backgroundColor: "#0a1210", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a7f3d0" }}
          formatter={(value, name) => [formatM(Number(value)), name === "grant_value" ? "Grants" : "Contracts"]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "rgba(16,185,129,0.5)" }}
          formatter={(value) => value === "grant_value" ? "Climate Grants" : "Climate Contracts"}
        />
        <Area type="monotone" dataKey="grant_value" stackId="1" stroke="#10b981" fill="url(#grantGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="contract_value" stackId="1" stroke="#2dd4bf" fill="url(#contractGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

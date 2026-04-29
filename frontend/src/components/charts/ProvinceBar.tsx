"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ProvinceData {
  province: string;
  total_value: number;
  grant_count: number;
}

const formatM = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
};

export function ProvinceBar({ data }: { data: ProvinceData[] }) {
  if (!data.length) return null;
  const sorted = [...data].sort((a, b) => b.total_value - a.total_value).slice(0, 15);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" horizontal={false} />
        <XAxis type="number" tickFormatter={formatM} tick={{ fontSize: 10, fill: "rgba(16,185,129,0.4)" }} stroke="rgba(16,185,129,0.1)" />
        <YAxis dataKey="province" type="category" width={40} tick={{ fontSize: 11, fill: "rgba(16,185,129,0.6)" }} stroke="rgba(16,185,129,0.1)" />
        <Tooltip
          contentStyle={{ backgroundColor: "#0a1210", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 12 }}
          formatter={(value) => [formatM(Number(value)), "Climate Funding"]}
        />
        <Bar dataKey="total_value" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

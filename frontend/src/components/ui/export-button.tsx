"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  filename: string;
}

export function ExportCSV({ data, filename }: ExportButtonProps) {
  const download = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => {
        const val = (row as Record<string, unknown>)[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={download} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Export CSV">
      <Download className="h-3 w-3" /> CSV
    </button>
  );
}

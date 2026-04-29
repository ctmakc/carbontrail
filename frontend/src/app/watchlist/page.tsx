"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useWatchlist } from "@/components/layout/watchlist-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function WatchlistPage() {
  const { items, remove } = useWatchlist();

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-50">Watchlist</h1>
            <p className="text-sm text-emerald-400/60">Organizations you&apos;re tracking — saved locally in your browser</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="h-16 w-16 mx-auto mb-4 text-emerald-900" />
            <p className="text-emerald-500/40">Your watchlist is empty</p>
            <p className="text-xs text-emerald-500/30 mt-1">Click the ⭐ button on any entity page to start tracking</p>
          </div>
        ) : (
          <Card className="border-emerald-900/30 bg-[#0a1210]">
            <CardHeader>
              <CardTitle className="text-sm text-emerald-400/60">{items.length} organizations watched</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.name_norm} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-emerald-900/10 hover:bg-emerald-500/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <Link href={`/entity/${encodeURIComponent(item.name_norm)}`}
                        className="text-sm font-medium text-emerald-100 hover:text-emerald-300 transition-colors flex items-center gap-1">
                        {item.name || item.name_norm}
                        <ExternalLink className="h-3 w-3 opacity-40" />
                      </Link>
                      <p className="text-[10px] text-emerald-500/30">Added {new Date(item.added).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => remove(item.name_norm)}
                      className="p-1.5 rounded text-emerald-700 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

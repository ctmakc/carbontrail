"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], desc: "Open search / command palette" },
  { keys: ["?"], desc: "Show this shortcuts panel" },
  { keys: ["/"], desc: "Focus search on search page" },
  { keys: ["G", "D"], desc: "Go to Dashboard" },
  { keys: ["G", "F"], desc: "Go to Flow" },
  { keys: ["G", "N"], desc: "Go to Network" },
  { keys: ["G", "C"], desc: "Go to Chat" },
  { keys: ["G", "A"], desc: "Go to Anomalies" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "?") { e.preventDefault(); setOpen(o => !o); return; }

      // G-prefix shortcuts
      if (e.key === "g" && !gPressed) {
        gPressed = true;
        gTimer = setTimeout(() => { gPressed = false; }, 500);
        return;
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        const routes: Record<string, string> = { d: "/", f: "/flow", n: "/network", c: "/chat", a: "/anomalies", r: "/recipients", s: "/search" };
        const route = routes[e.key];
        if (route) { window.location.href = route; }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-[#0a1210] border-emerald-800/30">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-emerald-50">Keyboard Shortcuts</h2>
          </div>
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-emerald-200/70">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map((k, j) => (
                    <kbd key={j} className="min-w-[24px] text-center rounded border border-emerald-800/40 bg-emerald-950/50 px-1.5 py-0.5 text-xs font-mono text-emerald-400">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-emerald-600">Press <kbd className="px-1 py-0.5 rounded border border-emerald-800/40 text-[10px]">?</kbd> to toggle this panel</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

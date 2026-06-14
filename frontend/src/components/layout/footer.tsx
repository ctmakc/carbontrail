import { TreePine, ExternalLink, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-emerald-900/20 bg-[#060d0b] py-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TreePine className="h-4 w-4 text-emerald-500/40" />
            <span className="text-sm text-emerald-500/40">CarbonTrail</span>
            <span className="text-[10px] text-emerald-700">v0.1.0</span>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] text-emerald-600">
            <Link href="/about" className="hover:text-emerald-400 transition-colors">About</Link>
            <Link href="/methodology" className="hover:text-emerald-400 transition-colors">Methodology</Link>
            <span>Data: Open Government Licence — Canada</span>
            <a href="https://github.com/ctmakc/carbontrail" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors">
              <ExternalLink className="h-3 w-3" /> GitHub
            </a>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-emerald-700">
            Built with <Heart className="h-3 w-3 text-red-500/40" /> for climate accountability
          </div>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-emerald-700/80">
          All figures are approximate and as of the last data refresh. Findings are review signals
          derived from public records — patterns that may warrant review, not allegations or findings
          of wrongdoing. Lobbying is legal and often legitimate, and receiving public funding is not
          evidence of anything improper. Every signal requires independent verification against the
          source records.
        </p>
      </div>
    </footer>
  );
}

"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTransition() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = requestAnimationFrame(() => {
      setLoading(true);
      setProgress(30);
    });
    const t1 = setTimeout(() => setProgress(70), 100);
    const t2 = setTimeout(() => { setProgress(100); }, 300);
    const t3 = setTimeout(() => { setLoading(false); setProgress(0); }, 500);
    return () => { cancelAnimationFrame(start); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

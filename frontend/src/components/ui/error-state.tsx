"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message || "Failed to load data. Please try again."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message, icon: Icon }: { message: string; icon?: React.ComponentType<{ className?: string }> }) {
  const I = Icon || AlertTriangle;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <I className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500/50 mb-4" />
          <h2 className="text-lg font-semibold text-emerald-100 mb-2">Something went wrong</h2>
          <p className="text-sm text-emerald-500/50 text-center max-w-md mb-4">
            {this.state.error?.message || "An unexpected error occurred while loading this section."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

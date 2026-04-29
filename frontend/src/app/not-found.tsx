import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080f0d] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold text-emerald-900">404</div>
        <h1 className="text-2xl font-bold text-emerald-100">Trail Gone Cold</h1>
        <p className="text-sm text-emerald-500/50 max-w-md mx-auto">
          This page doesn&apos;t exist. The money trail leads elsewhere.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { WatchlistProvider } from "@/components/layout/watchlist-context";
import { ToastProvider } from "@/components/ui/toast-provider";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/layout/page-transition";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  title: "CarbonTrail — Follow the Green Money",
  description: "Climate spending intelligence for Canadian public funding. Tracking $321B+ in contracts, grants, and lobbying across 5.2M public records.",
  keywords: ["climate", "canada", "transparency", "public funding", "lobbying", "ESG", "cleantech", "open data"],
  openGraph: {
    title: "CarbonTrail — Follow the Green Money",
    description: "Where do Canada's climate billions go? Track $321B+ in contracts, grants, and lobbying data.",
    type: "website",
    siteName: "CarbonTrail",
  },
  twitter: {
    card: "summary_large_image",
    title: "CarbonTrail — Follow the Green Money",
    description: "Climate spending intelligence for Canadian public funding.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
        <PageTransition />
        <SidebarProvider>
          <WatchlistProvider>
            <ToastProvider>
              {children}
              <KeyboardShortcuts />
            </ToastProvider>
          </WatchlistProvider>
        </SidebarProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { WatchlistProvider } from "@/components/layout/watchlist-context";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CarbonTrail — Follow the Green Money",
  description: "Climate spending intelligence for Canadian public funding.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider>
          <WatchlistProvider>
            {children}
          </WatchlistProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}

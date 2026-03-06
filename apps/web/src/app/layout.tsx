import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LOS | Life Operating System",
  description: "LOS v1 dashboard: single source of truth for life and work operations.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5a8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const melbourneDate = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeZone: "Australia/Melbourne",
  }).format(new Date());

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        <RegisterServiceWorker />
        <PwaInstallPrompt />
        <div className="los-shell">
          <header className="los-topbar">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-100/70">Life Operating System</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">LOS</h1>
              <p className="text-xs text-white/60">{melbourneDate}</p>
            </div>

            <div className="los-topbar-tools">
              <input
                aria-label="Quick search"
                className="los-search-input"
                placeholder="Jump to module or page..."
                type="search"
              />
              <p className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-cyan-50">
                Australia/Melbourne · AUD
              </p>
            </div>
          </header>

          <div className="los-workspace">
            <AppNav />
            <div className="los-content">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}

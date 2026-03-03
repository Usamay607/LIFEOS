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
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        <RegisterServiceWorker />
        <PwaInstallPrompt />
        <div className="los-shell">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-white/60">Life Operating System</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">LOS Command Center</h1>
            </div>
            <p className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.08em] text-white/80">
              Australia/Melbourne · AUD
            </p>
          </header>
          <AppNav />
          {children}
        </div>
      </body>
    </html>
  );
}

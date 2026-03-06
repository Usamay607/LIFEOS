import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
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
        <AppShell melbourneDate={melbourneDate}>{children}</AppShell>
      </body>
    </html>
  );
}

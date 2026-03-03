"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "los-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
    );
  });
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canShow = useMemo(() => !installed && !dismissed && deferredPrompt, [installed, dismissed, deferredPrompt]);

  async function installApp() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (!canShow) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:right-4 md:w-80">
      <div className="rounded-2xl border border-teal-300/45 bg-slate-950/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
        <p className="text-sm font-semibold text-teal-100">Install LOS App</p>
        <p className="mt-1 text-xs text-white/75">
          Add LOS to your home screen for faster access, offline fallback, and app-style use.
        </p>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={() => void installApp()}>
            Install
          </Button>
          <Button variant="ghost" className="flex-1" onClick={dismiss}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}

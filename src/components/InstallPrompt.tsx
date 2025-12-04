// src/components/InstallPrompt.tsx
"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show the prompt if app is already installed (PWA standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as any).standalone;

    if (isStandalone) {
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
    } catch {
      // ignore
    } finally {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function handleClose() {
    setVisible(false);
  }

  return (
    <div className="fixed bottom-4 inset-x-4 z-[1100] md:inset-x-auto md:right-6 md:max-w-sm">
      <div className="rounded-2xl border bg-white shadow-lg px-4 py-3 text-sm flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">
              statiestatus.nl als app installeren
            </p>
            <p className="text-xs text-gray-600">
              Voeg statiestatus.nl toe aan je startscherm voor snelle toegang
              tot de kaart en machines in de buurt.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="text-xs px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900"
          >
            Installeren
          </button>
        </div>
      </div>
    </div>
  );
}

// src/components/InstallPrompt.tsx
"use client";

import { useEffect, useState } from "react";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
  }
}

type OS = "ios" | "android" | "other";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [os, setOs] = useState<OS>("other");

  useEffect(() => {
    setOs(detectOS());

    let dismissed = false;
    try {
      dismissed =
        window.localStorage.getItem("statiestatus:installDismissed") === "1";
    } catch {
      // ignore
    }
    if (dismissed) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS Safari specific
      window.navigator.standalone === true;

    if (isStandalone) return;

    const handler = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      ev.preventDefault();
      setDeferredPrompt(ev);
      setShowInstallButton(true);
      setShowHint(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if no event after a few seconds on mobile, show hint only
    const fallbackTimer = window.setTimeout(() => {
      if (!deferredPrompt && (detectOS() === "ios" || detectOS() === "android")) {
        setShowHint(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  function dismiss() {
    setShowInstallButton(false);
    setShowHint(false);
    try {
      window.localStorage.setItem(
        "statiestatus:installDismissed",
        "1"
      );
    } catch {
      // ignore
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      dismiss();
    }
  }

  if (!showHint && !showInstallButton) return null;

  // OS specific message
  let stepsTitle = "Zo gebruik je statiestatus.nl als app";
  let steps: string[] = [];

  if (os === "ios") {
    stepsTitle = "statiestatus.nl op je iPhone als app";
    steps = [
      "Open statiestatus.nl in Safari.",
      "Tik onderin op het deel-icoon (vierkant met pijltje omhoog).",
      "Kies 'Zet op beginscherm'.",
      "Tik op 'Voeg toe'.",
    ];
  } else if (os === "android") {
    stepsTitle = "statiestatus.nl op je Android als app";
    steps = [
      "Open statiestatus.nl in Chrome.",
      "Tik rechtsboven op het menu (⋮).",
      "Kies 'App installeren' of 'Toevoegen aan startscherm'.",
      "Bevestig om de app toe te voegen.",
    ];
  } else {
    stepsTitle = "statiestatus.nl als app gebruiken";
    steps = [
      "Open statiestatus.nl in je browser.",
      "Gebruik het browsermenu om 'App installeren' of 'Toevoegen aan startscherm' te kiezen (indien beschikbaar).",
    ];
  }

  return (
    <div className="fixed bottom-16 right-3 z-[960] max-w-xs">
      <div className="rounded-2xl border bg-white shadow-md px-3 py-3 text-xs flex gap-2 items-start">
        <div className="mt-0.5">📱</div>
        <div className="flex-1 space-y-1">
          <div className="font-medium">Gebruik statiestatus.nl als app</div>

          <p className="text-gray-600">
            Voeg statiestatus.nl toe aan je beginscherm voor snelle toegang,
            zonder browserbalk.
          </p>

          <div className="mt-1 space-y-1">
            <div className="font-semibold text-[11px] text-gray-700">
              {stepsTitle}
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-gray-600">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2 pt-2">
            {showInstallButton && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-2.5 py-1 rounded-lg bg-black text-white"
              >
                App installeren
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="px-2.5 py-1 rounded-lg border bg-gray-50"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

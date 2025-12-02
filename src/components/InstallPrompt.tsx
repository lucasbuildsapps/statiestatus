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

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent || "");
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showGenericHint, setShowGenericHint] = useState(false);

  useEffect(() => {
    // Skip if user already dismissed
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

    if (isStandalone) {
      // Already "installed" – nothing to show
      return;
    }

    const handler = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      ev.preventDefault();
      setDeferredPrompt(ev);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: on mobile, if we never get the event, still show a generic hint
    const fallbackTimer = window.setTimeout(() => {
      if (!deferredPrompt && isMobile()) {
        setShowGenericHint(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  function dismiss() {
    setShowInstall(false);
    setShowGenericHint(false);
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

  if (!showInstall && !showGenericHint) return null;

  return (
    <div className="fixed bottom-16 right-3 z-[960] max-w-xs">
      <div className="rounded-2xl border bg-white shadow-md px-3 py-3 text-xs flex gap-2 items-start">
        <div className="mt-0.5">📱</div>
        <div className="flex-1 space-y-1">
          <div className="font-medium">Voeg statiestatus.nl toe als app</div>

          {showInstall && (
            <p className="text-gray-600">
              Installeer de webapp zodat je statiestatus.nl direct vanaf je
              beginscherm kunt openen.
            </p>
          )}

          {showGenericHint && !showInstall && (
            <p className="text-gray-600">
              Open het browsermenu en kies{" "}
              <span className="font-semibold">
                &ldquo;App installeren&rdquo; of &ldquo;Zet op
                beginscherm&rdquo;
              </span>{" "}
              om statiestatus.nl als app te gebruiken.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {showInstall && (
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

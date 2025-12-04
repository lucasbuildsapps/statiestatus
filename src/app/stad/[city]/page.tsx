// src/app/stad/[city]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export const dynamic = "force-dynamic";

type ApiStatus = "WORKING" | "ISSUES" | "OUT_OF_ORDER";

type ApiLocation = {
  id: string;
  name: string;
  retailer: string;
  city: string;
  address: string;
  currentStatus: ApiStatus | null;
};

type LoadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "not-found" }
  | { type: "loaded"; city: string; locations: ApiLocation[] };

function statusLabel(s: ApiStatus | null) {
  if (s === "WORKING") return "Werkend";
  if (s === "ISSUES") return "Problemen";
  if (s === "OUT_OF_ORDER") return "Stuk";
  return "Onbekend";
}

export default function CityPageClient() {
  const pathname = usePathname();

  const city = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean); // ["stad","<city>"]
    const last = parts[parts.length - 1] || "";
    return last ? decodeURIComponent(last) : null;
  }, [pathname]);

  const [state, setState] = useState<LoadState>({ type: "idle" });

  useEffect(() => {
    if (!city) {
      setState({
        type: "error",
        message: "Geen stad in URL gevonden.",
      });
      return;
    }

    let cancelled = false;
    setState({ type: "loading" });

    (async () => {
      try {
        const res = await fetch(`/api/stad/${encodeURIComponent(city)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) setState({ type: "not-found" });
            return;
          }
          const data = await res.json().catch(() => null);
          const msg =
            (data as any)?.error ||
            `Er ging iets mis bij het laden (status ${res.status}).`;
          if (!cancelled) setState({ type: "error", message: msg });
          return;
        }

        const data = (await res.json()) as {
          city: string;
          locations: ApiLocation[];
        };

        if (!cancelled) {
          setState({
            type: "loaded",
            city: data.city,
            locations: data.locations,
          });
        }
      } catch (e) {
        console.error("Error fetching city locations:", e);
        if (!cancelled) {
          setState({
            type: "error",
            message: "Netwerkfout bij het ophalen van de locaties.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [city]);

  // Loading / idle
  if (state.type === "idle" || state.type === "loading") {
    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-5">
        <section className="space-y-2">
          <p className="text-xs text-gray-500">
            <a href="/" className="hover:underline">
              statiestatus.nl
            </a>{" "}
            · Stad
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Locaties laden…
          </h1>
          <p className="text-sm text-gray-600">
            We halen de statiegeldmachines in deze stad op.
          </p>
        </section>
      </main>
    );
  }

  // Error
  if (state.type === "error") {
    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-5">
        <section className="space-y-2">
          <p className="text-xs text-gray-500">
            <a href="/" className="hover:underline">
              statiestatus.nl
            </a>{" "}
            · Stad
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Er ging iets mis
          </h1>
          <p className="text-sm text-gray-600">
            {state.message || "De gegevens konden niet worden opgehaald."}
          </p>
        </section>

        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/#kaart"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            ← Terug naar kaart
          </a>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Naar startpagina
          </a>
        </div>
      </main>
    );
  }

  // Not found
  if (state.type === "not-found") {
    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-5">
        <section className="space-y-2">
          <p className="text-xs text-gray-500">
            <a href="/" className="hover:underline">
              statiestatus.nl
            </a>{" "}
            · Stad
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Geen machines gevonden
          </h1>
          <p className="text-sm text-gray-600">
            We hebben nog geen statiegeldmachines in deze stad in de database.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/#kaart"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            ← Terug naar kaart
          </a>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Naar startpagina
          </a>
        </div>
      </main>
    );
  }

  // Loaded
  const { city: cityName, locations } = state;

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6">
      <section className="space-y-3">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Stad
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Statiegeldmachines in {cityName}
        </h1>
        <p className="text-sm text-gray-600">
          Overzicht van statiegeldmachines in {cityName}. Gegevens zijn
          gebaseerd op community-meldingen en zijn indicatief.
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/#kaart"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            ← Terug naar kaart
          </a>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Naar startpagina
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-xs text-gray-500">
          {locations.length} locaties
        </div>
        <ul className="space-y-2">
          {locations.map((l) => (
            <li
              key={l.id}
              className="rounded-xl border bg-white p-3 flex flex-col gap-1 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-gray-600">
                    {l.retailer} • {l.city}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {l.address}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-900 text-white">
                  {statusLabel(l.currentStatus)}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <a
                  href={`/machine/${l.id}`}
                  className="text-[11px] text-gray-700 hover:underline"
                >
                  Details
                </a>
                <a
                  href={`/?location=${encodeURIComponent(l.id)}#kaart`}
                  className="text-[11px] text-gray-500 hover:underline"
                >
                  Op kaart
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="text-xs text-gray-500 space-y-1">
        <p>
          statiestatus.nl is een onafhankelijk community-project. Status kan
          afwijken van de werkelijkheid; check altijd ook ter plekke.
        </p>
      </section>
    </main>
  );
}

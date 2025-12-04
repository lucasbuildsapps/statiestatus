// src/app/keten/[retailer]/page.tsx
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
  | { type: "loaded"; retailer: string; locations: ApiLocation[] };

function statusLabel(s: ApiStatus | null) {
  if (s === "WORKING") return "Werkend";
  if (s === "ISSUES") return "Problemen";
  if (s === "OUT_OF_ORDER") return "Stuk";
  return "Onbekend";
}

export default function RetailerPageClient() {
  const pathname = usePathname();

  const retailer = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last ? decodeURIComponent(last) : null;
  }, [pathname]);

  const [state, setState] = useState<LoadState>({ type: "idle" });

  useEffect(() => {
    if (!retailer) {
      setState({
        type: "error",
        message: "Geen winkelketen in URL gevonden.",
      });
      return;
    }

    let cancelled = false;
    setState({ type: "loading" });

    (async () => {
      try {
        const res = await fetch(
          `/api/keten/${encodeURIComponent(retailer)}`,
          { cache: "no-store" }
        );

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
          retailer: string;
          locations: ApiLocation[];
        };

        if (!cancelled) {
          setState({
            type: "loaded",
            retailer: data.retailer,
            locations: data.locations,
          });
        }
      } catch (e) {
        console.error("Error fetching retailer locations:", e);
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
  }, [retailer]);

  // Loading / idle
  if (state.type === "idle" || state.type === "loading") {
    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-5">
        <section className="space-y-2">
          <p className="text-xs text-gray-500">
            <a href="/" className="hover:underline">
              statiestatus.nl
            </a>{" "}
            · Winkelketen
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Locaties laden…
          </h1>
          <p className="text-sm text-gray-600">
            We halen de statiegeldmachines voor deze keten op.
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
            · Winkelketen
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
            · Winkelketen
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Geen machines gevonden
          </h1>
          <p className="text-sm text-gray-600">
            We hebben nog geen statiegeldmachines voor deze keten in de
            database.
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
  const { retailer: retailerName, locations } = state;

  const workingCount = locations.filter(
    (l) => l.currentStatus === "WORKING"
  ).length;
  const problemCount = locations.filter(
    (l) => l.currentStatus === "OUT_OF_ORDER" || l.currentStatus === "ISSUES"
  ).length;
  const unknownCount = locations.filter((l) => l.currentStatus === null).length;

  const total = Math.max(locations.length, 1);
  const workingShare = (workingCount / total) * 100;
  const problemShare = (problemCount / total) * 100;
  const unknownShare = Math.max(0, 100 - workingShare - problemShare);

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6">
      <section className="space-y-3">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Winkelketen
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Statiegeldmachines bij {retailerName}
        </h1>
        <p className="text-sm text-gray-600">
          Overzicht van statiegeldmachines bij {retailerName} in Nederland,
          gebaseerd op community-meldingen.
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

      {/* Summary cards */}
      <section className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Aantal machines bij deze keten
          </div>
          <div className="text-2xl font-semibold">{locations.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Machines met status &ldquo;Werkend&rdquo;
          </div>
          <div className="text-xl font-semibold">{workingCount}</div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Machines met problemen / stuk
          </div>
          <div className="text-xl font-semibold">{problemCount}</div>
        </div>
      </section>

      {/* Status distribution graph */}
      <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Statusverdeling</h2>
        {locations.length === 0 ? (
          <p className="text-xs text-gray-500">
            Er zijn nog geen machines voor deze keten in de database.
          </p>
        ) : (
          <>
            <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${workingShare}%` }}
              />
              <div
                className="h-full bg-red-400"
                style={{
                  width: `${problemShare}%`,
                  marginLeft: `${workingShare}%`,
                }}
              />
              {unknownCount > 0 && (
                <div
                  className="h-full bg-gray-300"
                  style={{
                    width: `${unknownShare}%`,
                    marginLeft: `${workingShare + problemShare}%`,
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>{workingCount} werkend</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-400" />
                <span>{problemCount} storing of problemen</span>
              </span>
              {unknownCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-300" />
                  <span>{unknownCount} onbekend</span>
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {/* List of machines */}
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
                  <div className="text-xs text-gray-600">{l.city}</div>
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

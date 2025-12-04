// src/app/machine/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export const dynamic = "force-dynamic";

type ApiStatus = "WORKING" | "ISSUES" | "OUT_OF_ORDER";

type ApiReport = {
  id: string;
  status: ApiStatus;
  note: string | null;
  createdAt: string;
};

type ApiLocation = {
  id: string;
  name: string;
  retailer: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  createdAt: string;
  currentStatus: ApiStatus | null;
  reports: ApiReport[];
};

type LoadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "not-found" }
  | { type: "loaded"; location: ApiLocation };

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s geleden`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h geleden`;
  const d = Math.floor(h / 24);
  return `${d}d geleden`;
}

function statusToLabel(status: ApiStatus | null) {
  if (status === "WORKING") return "Werkend";
  if (status === "ISSUES") return "Problemen";
  if (status === "OUT_OF_ORDER") return "Stuk";
  return "Onbekend";
}

function statusToColorClasses(status: ApiStatus | null) {
  if (status === "WORKING")
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "ISSUES")
    return "bg-amber-100 text-amber-900 border-amber-200";
  if (status === "OUT_OF_ORDER")
    return "bg-red-100 text-red-900 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

// ---------- Confidence helpers (frontend-only for now) ----------

type Confidence = "low" | "medium" | "high";

function deriveConfidence(reports: ApiReport[]): Confidence {
  if (!reports.length) return "low";

  const now = Date.now();
  let last24h = 0;
  let last7d = 0;

  for (const r of reports) {
    const ageMs = now - new Date(r.createdAt).getTime();
    if (ageMs <= 24 * 3600 * 1000) last24h++;
    if (ageMs <= 7 * 24 * 3600 * 1000) last7d++;
  }

  const total = reports.length;

  // Tune these thresholds as you like
  if (last24h >= 3 || last7d >= 5 || total >= 20) return "high";
  if (last24h >= 1 || last7d >= 2 || total >= 5) return "medium";
  return "low";
}

function confidenceLabel(c: Confidence) {
  if (c === "high") return "Hoge betrouwbaarheid";
  if (c === "medium") return "Redelijke betrouwbaarheid";
  return "Lage betrouwbaarheid";
}

function confidenceClasses(c: Confidence) {
  if (c === "high") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (c === "medium") return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

// ---------- Page component ----------

export default function MachinePageClient() {
  const pathname = usePathname();
  const id = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  }, [pathname]);

  const [state, setState] = useState<LoadState>({ type: "idle" });

  useEffect(() => {
    if (!id) {
      setState({
        type: "error",
        message: "Geen ID in URL gevonden.",
      });
      return;
    }

    let cancelled = false;
    setState({ type: "loading" });

    (async () => {
      try {
        const res = await fetch(`/api/machine/${encodeURIComponent(id)}`, {
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

        const data = (await res.json()) as { location: ApiLocation };
        if (!cancelled) {
          setState({ type: "loaded", location: data.location });
        }
      } catch (e) {
        console.error("Error fetching machine:", e);
        if (!cancelled) {
          setState({
            type: "error",
            message: "Netwerkfout bij het ophalen van de locatie.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.type === "idle" || state.type === "loading") {
    return (
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-8 space-y-4 text-sm">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Locatie detail
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Locatie laden…
        </h1>
        <p className="text-sm text-gray-600">
          We halen de gegevens van deze statiegeldmachine op.
        </p>
      </main>
    );
  }

  if (state.type === "error") {
    return (
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-8 space-y-4 text-sm">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Locatie detail
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Er ging iets mis
        </h1>
        <p className="text-sm text-gray-600">
          {state.message || "De gegevens konden niet worden opgehaald."}
        </p>
        <div className="flex flex-wrap gap-2 text-xs pt-2">
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

  if (state.type === "not-found") {
    return (
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-8 space-y-4 text-sm">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Locatie detail
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Locatie niet gevonden
        </h1>
        <p className="text-sm text-gray-600">
          We konden deze statiegeldmachine niet vinden. Mogelijk is de link
          verouderd of is de locatie verwijderd.
        </p>
        {id && (
          <p className="text-[11px] text-gray-400">
            Gevraagde locatie-ID:{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100">{id}</code>
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs pt-2">
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

  const { location } = state;
  const reports = location.reports;
  const lastReport = reports[0] ?? null;

  const workingCount = reports.filter((r) => r.status === "WORKING").length;
  const outCount = reports.filter((r) => r.status === "OUT_OF_ORDER").length;
  const issuesCount = reports.filter((r) => r.status === "ISSUES").length;
  const totalReports = reports.length || 1; // avoid division by zero
  const statusLabel = statusToLabel(location.currentStatus);

  const workingPct = Math.round((workingCount / totalReports) * 100);
  const problemPct = Math.round(
    ((outCount + issuesCount) / totalReports) * 100
  );

  const confidence = deriveConfidence(reports);

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6">
      <section className="space-y-3">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Locatie detail
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {location.name}
        </h1>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">{location.retailer}</span>
            {" · "}
            {location.city}
          </p>
          <p>{location.address}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center pt-1">
          <span
            className={
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium " +
              statusToColorClasses(location.currentStatus)
            }
          >
            <span>Huidige status:</span>
            <span>{statusLabel}</span>
          </span>

          <span
            className={
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] " +
              confidenceClasses(confidence)
            }
          >
            {confidenceLabel(confidence)}
          </span>

          {lastReport && (
            <span className="text-xs text-gray-500">
              Laatste melding: {timeAgo(lastReport.createdAt)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs pt-2">
          <a
            href="/#kaart"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            ← Terug naar kaart
          </a>
          <a
            href={`/stad/${encodeURIComponent(location.city)}`}
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Alle machines in {location.city}
          </a>
          <a
            href={`/keten/${encodeURIComponent(location.retailer)}`}
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Alle machines bij {location.retailer}
          </a>
        </div>
      </section>

      {/* Stats cards */}
      <section className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Totaal aantal meldingen
          </div>
          <div className="text-2xl font-semibold">
            {reports.length || "–"}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Aantal &ldquo;Werkend&rdquo;
          </div>
          <div className="text-xl font-semibold">{workingCount}</div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Aantal &ldquo;Stuk/Problemen&rdquo;
          </div>
          <div className="text-xl font-semibold">
            {outCount + issuesCount}
          </div>
        </div>
      </section>

      {/* Simple bar "graph" */}
      <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Statusverdeling</h2>
        {reports.length === 0 ? (
          <p className="text-xs text-gray-500">
            Er zijn nog geen meldingen voor deze machine.
          </p>
        ) : (
          <>
            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${workingPct}%` }}
              />
              <div
                className="h-full bg-red-400"
                style={{
                  width: `${problemPct}%`,
                  marginLeft: `${workingPct}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-600">
              <span>{workingPct}% meldingen &ldquo;Werkend&rdquo;</span>
              <span>{problemPct}% meldingen met problemen</span>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Recente meldingen</h2>
        {reports.length === 0 && (
          <p className="text-xs text-gray-500">
            Er zijn nog geen meldingen voor deze machine.
          </p>
        )}
        {reports.length > 0 && (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b last:border-b-0 pb-2 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base">
                    {r.status === "WORKING"
                      ? "✅"
                      : r.status === "ISSUES"
                      ? "⚠️"
                      : "❌"}
                  </span>
                  <div>
                    <div className="font-medium text-xs">
                      {statusToLabel(r.status)}
                    </div>
                    {r.note && (
                      <div className="text-xs text-gray-700">{r.note}</div>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-gray-500">
                  {timeAgo(r.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Deze machine gebruiken</h2>
        <p className="text-gray-700">
          De status van deze statiegeldmachine is gebaseerd op meldingen van
          bezoekers. Check altijd zelf ter plekke of de machine werkt.
        </p>
      </section>

      <section className="text-xs text-gray-500 space-y-1">
        <p>
          statiestatus.nl is een onafhankelijk community-project en geen
          officiële bron van supermarkten of fabrikanten.
        </p>
        <p>
          Meldingen worden anoniem opgeslagen; IP-adressen worden gehasht om
          misbruik te kunnen detecteren.
        </p>
      </section>
    </main>
  );
}

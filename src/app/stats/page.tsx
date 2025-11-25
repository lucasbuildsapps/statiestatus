// src/app/stats/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Status = "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;

type ApiLocation = {
  id: string;
  name: string;
  retailer: string;
  city: string;
  currentStatus: Status;
  lastReportAt: string | null;
  totalReports: number;
};

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

export default function StatsPage() {
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/locations");
        const data = await res.json();
        if (!cancelled) {
          setLocations(Array.isArray(data.locations) ? data.locations : []);
          setError(null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Kon locaties niet laden.");
          setLocations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = locations.length;
    const working = locations.filter((l) => l.currentStatus === "WORKING")
      .length;
    const broken = locations.filter((l) => l.currentStatus === "OUT_OF_ORDER")
      .length;
    const unknown = total - working - broken;

    const brokenPct = total ? Math.round((broken / total) * 100) : 0;

    const byCity: Record<string, number> = {};
    locations.forEach((l) => {
      const key = l.city || "Onbekend";
      byCity[key] = (byCity[key] || 0) + 1;
    });

    const topCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const lastUpdated = locations
      .map((l) => l.lastReportAt)
      .filter(Boolean) as string[];
    const latest =
      lastUpdated.length > 0
        ? lastUpdated.reduce((acc, cur) =>
            new Date(cur).getTime() > new Date(acc).getTime() ? cur : acc
          )
        : null;

    return { total, working, broken, unknown, brokenPct, topCities, latest };
  }, [locations]);

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-xs text-gray-500 hover:underline">
          ← Terug naar de kaart
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Statistieken statiestatus.nl
        </h1>
        <p className="text-sm text-gray-600">
          Overzicht op basis van alle locaties en de laatste meldingen. Deze
          cijfers zijn indicatief en veranderen mee met nieuwe meldingen.
        </p>
      </header>

      {error && (
        <div className="text-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
          {error}
        </div>
      )}

      <section className="grid sm:grid-cols-4 gap-4 text-sm">
        <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-1">
          <div className="text-xs text-gray-500">Totaal locaties</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-1">
          <div className="text-xs text-gray-500">Werkend</div>
          <div className="text-2xl font-semibold">{stats.working}</div>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-1">
          <div className="text-xs text-gray-500">Stuk</div>
          <div className="text-2xl font-semibold">{stats.broken}</div>
          <div className="text-[11px] text-gray-500">
            {stats.brokenPct}% van alle machines
          </div>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-1">
          <div className="text-xs text-gray-500">Onbekende status</div>
          <div className="text-2xl font-semibold">{stats.unknown}</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Top-steden naar aantal machines</h2>
        {stats.topCities.length === 0 ? (
          <p className="text-xs text-gray-500">Nog geen gegevens beschikbaar.</p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-700">
            {stats.topCities.map(([city, count]) => (
              <li key={city} className="flex items-center justify-between">
                <span>{city}</span>
                <span className="text-gray-500 text-xs">{count} locaties</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-2 text-sm">
        <h2 className="text-base font-semibold">Laatste update</h2>
        <p className="text-gray-600">
          Laatste melding in Nederland:{" "}
          <span className="font-medium">
            {stats.latest ? timeAgo(stats.latest) : "nog geen meldingen"}
          </span>
          .
        </p>
        <p className="text-xs text-gray-500">
          De kaart op de homepage wordt direct bijgewerkt zodra iemand een
          melding plaatst.
        </p>
      </section>
    </main>
  );
}

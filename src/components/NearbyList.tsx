// src/components/NearbyList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import useFavorites from "@/lib/useFavorites";

type Status = "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;

type LastReport = {
  id: string;
  status: "WORKING" | "ISSUES" | "OUT_OF_ORDER";
  note: string;
  createdAt: string;
};

type LocationItem = {
  id: string;
  name: string;
  retailer: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  currentStatus: Status;
  lastReportAt?: string | null;
  totalReports?: number;
  lastReports?: LastReport[];
};

type LocationWithDistance = LocationItem & {
  distanceKm: number | null;
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

function statusLabel(s: Status): string {
  if (s === "WORKING") return "Werkend";
  if (s === "OUT_OF_ORDER") return "Stuk";
  if (s === "ISSUES") return "Problemen";
  return "Onbekend";
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(d: number | null) {
  if (d == null || !isFinite(d)) return "Afstand onbekend";
  if (d < 0.15) return "Bij jou in de buurt";
  if (d < 0.5) return `${(d * 1000).toFixed(0)} meter`;
  if (d < 10) return `${d.toFixed(1)} km`;
  return `${Math.round(d)} km`;
}

function statusClasses(status: Status) {
  if (status === "WORKING")
    return "bg-emerald-50 text-emerald-900 border-emerald-100";
  if (status === "OUT_OF_ORDER")
    return "bg-red-50 text-red-900 border-red-100";
  if (status === "ISSUES")
    return "bg-amber-50 text-amber-900 border-amber-100";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

// Korte probleemomschrijving uit de laatste stuk-melding
function getProblemSummary(loc: LocationItem): string | null {
  const reports = loc.lastReports || [];
  const lastBroken = reports.find((r) => r.status === "OUT_OF_ORDER");
  if (!lastBroken) return null;

  if (!lastBroken.note) return "Probleem gemeld (geen details).";

  // Eerste deel voor de " — " is meestal het type probleem
  const main = lastBroken.note.split(" — ")[0]?.trim() || "";
  return main || "Probleem gemeld (geen details).";
}

export default function NearbyList() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [showOnlyBroken, setShowOnlyBroken] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();

  // fetch locations
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
      } catch (err) {
        if (!cancelled) {
          console.error(err);
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

  // geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Je browser ondersteunt locatie niet.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoError(null);
      },
      (err) => {
        console.error(err);
        setGeoError("Locatie kon niet worden bepaald.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const enriched: LocationWithDistance[] = useMemo(
    () =>
      locations.map((l) => ({
        ...l,
        distanceKm: pos
          ? distanceKm(pos.lat, pos.lng, l.lat, l.lng)
          : null,
      })),
    [locations, pos]
  );

  const favoriteLocations: LocationWithDistance[] = useMemo(
    () => enriched.filter((l) => isFavorite(l.id)).slice(0, 6),
    [enriched, isFavorite]
  );

  const nearbyLocations: LocationWithDistance[] = useMemo(() => {
    if (!pos) return [];

    let list = [...enriched];

    if (showOnlyBroken) {
      list = list.filter((l) => l.currentStatus === "OUT_OF_ORDER");
    }

    list.sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;

      // bij gelijke afstand: stuk eerst
      if (a.currentStatus === "OUT_OF_ORDER" && b.currentStatus !== "OUT_OF_ORDER")
        return -1;
      if (b.currentStatus === "OUT_OF_ORDER" && a.currentStatus !== "OUT_OF_ORDER")
        return 1;

      return a.name.localeCompare(b.name);
    });

    return list.slice(0, 12);
  }, [enriched, pos, showOnlyBroken]);

  return (
    <section className="space-y-4 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">In de buurt</h2>
        {loading ? (
          <span className="text-xs text-gray-400">Laden…</span>
        ) : (
          <span className="text-xs text-gray-400">
            {locations.length} locaties
          </span>
        )}
      </div>

      {error && (
        <div className="text-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
          {error}
        </div>
      )}

      {!error && geoError && (
        <div className="text-xs rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          {geoError} • Gebruik de kaart hierboven om handmatig een machine te
          kiezen.
        </div>
      )}

      {/* Favorieten */}
      {favoriteLocations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>⭐ Mijn favoriete machines</span>
            <span>{favoriteLocations.length}</span>
          </div>
          <ul className="space-y-2">
            {favoriteLocations.map((l) => {
              const problemSummary =
                l.currentStatus === "OUT_OF_ORDER"
                  ? getProblemSummary(l)
                  : null;

              return (
                <li
                  key={l.id}
                  className="rounded-xl border bg-gray-50 p-3 space-y-2"
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
                    <button
                      type="button"
                      onClick={() => toggleFavorite(l.id)}
                      className="text-[11px] px-2 py-1 rounded border bg-white hover:bg-gray-100"
                    >
                      ★ Verwijder
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      Status: <b>{statusLabel(l.currentStatus)}</b> • Laatste
                      melding:{" "}
                      {l.lastReportAt
                        ? timeAgo(l.lastReportAt)
                        : "nog geen meldingen"}
                    </span>
                    {l.distanceKm != null && (
                      <span>{formatDistance(l.distanceKm)}</span>
                    )}
                  </div>

                  {problemSummary && (
                    <div className="mt-1 text-[11px] text-red-800 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                      <span className="font-medium">Probleem:</span>{" "}
                      {problemSummary}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <a
                      href="#kaart"
                      className="text-[11px] text-gray-500 hover:underline"
                    >
                      Details op kaart bekijken
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Nearby list + toggle "alleen stuk" */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Machines in de buurt</span>
          <div className="flex items-center gap-2">
            {pos && <span>Gebaseerd op jouw locatie</span>}
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={showOnlyBroken}
                onChange={(e) => setShowOnlyBroken(e.target.checked)}
              />
              <span>Alleen stuk</span>
            </label>
          </div>
        </div>

        {!pos && !loading && (
          <p className="text-xs text-gray-500">
            We bepalen je locatie om machines in de buurt te tonen. Als dat niet
            lukt, gebruik de kaart hierboven.
          </p>
        )}

        {!loading && nearbyLocations.length === 0 && pos && (
          <p className="text-xs text-gray-500">
            Geen locaties gevonden. Probeer de kaart hierboven of schakel
            &ldquo;Alleen stuk&rdquo; uit.
          </p>
        )}

        <ul className="space-y-2">
          {nearbyLocations.map((l) => {
            const problemSummary =
              l.currentStatus === "OUT_OF_ORDER"
                ? getProblemSummary(l)
                : null;

            return (
              <li
                key={l.id}
                className="rounded-xl border bg-white p-3 flex flex-col gap-1"
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
                  <span
                    className={
                      "px-2 py-1 rounded-full border text-[11px] " +
                      statusClasses(l.currentStatus)
                    }
                  >
                    {statusLabel(l.currentStatus)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>
                    Laatste melding:{" "}
                    {l.lastReportAt
                      ? timeAgo(l.lastReportAt)
                      : "nog geen meldingen"}
                    {typeof l.totalReports === "number" &&
                      l.totalReports > 0 && (
                        <> • {l.totalReports} meldingen totaal</>
                      )}
                  </span>
                  {l.distanceKm != null && (
                    <span>{formatDistance(l.distanceKm)}</span>
                  )}
                </div>

                {problemSummary && (
                  <div className="mt-1 text-[11px] text-red-800 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                    <span className="font-medium">Probleem:</span>{" "}
                    {problemSummary}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] text-gray-500 pt-1">
          Tip: gebruik de kaart voor meer details en om direct een nieuwe
          melding te plaatsen.
        </p>
      </div>
    </section>
  );
}

// src/components/NearbyList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import useFavorites from "@/lib/useFavorites";
import {
  fetchLocationsShared,
  type ApiLocation,
  type ApiStatus,
} from "@/lib/locationsClient";

type LocationItem = ApiLocation;

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

function statusLabel(s: ApiStatus | null): string {
  if (s === "WORKING") return "Werkend";
  if (s === "ISSUES") return "Problemen";
  if (s === "OUT_OF_ORDER") return "Stuk";
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

export default function NearbyList() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [locationResolved, setLocationResolved] = useState(false);

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { isFavorite, toggleFavorite } = useFavorites();

  // 1) Load last known position from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("statiestatus:lastPosition");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number"
        ) {
          setPos({ lat: parsed.lat, lng: parsed.lng });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 2) Fetch locations using shared cache
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchLocationsShared(false);
        if (!cancelled) {
          setLocations(data);
          setError(null);
        }
      } catch (err) {
        console.error(err);
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

  // 3) Geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoError(true);
      setLocationResolved(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(coords);
        setLocationResolved(true);
        try {
          window.localStorage.setItem(
            "statiestatus:lastPosition",
            JSON.stringify(coords)
          );
        } catch {
          // ignore
        }
      },
      (err) => {
        console.error(err);
        setGeoError(true);
        setLocationResolved(true);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // Enrich with distance
  const enriched: LocationWithDistance[] = useMemo(
    () =>
      locations.map((l) => ({
        ...l,
        distanceKm: pos ? distanceKm(pos.lat, pos.lng, l.lat, l.lng) : null,
      })),
    [locations, pos]
  );

  const favoriteLocations: LocationWithDistance[] = useMemo(
    () => enriched.filter((l) => isFavorite(l.id)).slice(0, 5),
    [enriched, isFavorite]
  );

  const nearbyLocations: LocationWithDistance[] = useMemo(() => {
    const sorted = [...enriched];
    sorted.sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;

      if (da !== db) return da - db;
      return a.name.localeCompare(b.name);
    });

    return sorted.slice(0, 5);
  }, [enriched]);

  function formatDistance(d: number | null) {
    if (d == null || !isFinite(d)) return "Afstand onbekend";
    if (d < 0.3) return "Op loopafstand";
    if (d < 1) return `${d.toFixed(1)} km`;
    if (d < 10) return `${d.toFixed(1)} km`;
    return `${Math.round(d)} km`;
  }

  async function quickReport(
    locationId: string,
    status: "WORKING" | "OUT_OF_ORDER"
  ) {
    const key = `${locationId}-${status}`;
    setSubmittingId(key);
    setMessage(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, status, note: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Er ging iets mis bij het verzenden.");
        return;
      }
      setMessage("✅ Bedankt! Snelmelding geplaatst.");
    } catch {
      setMessage("Netwerkfout bij verzenden.");
    } finally {
      setSubmittingId(null);
    }
  }

  const hasRealLocation = !!pos && !geoError;
  const showNearbyList = (locationResolved || geoError) && nearbyLocations.length > 0;

  return (
    <section className="space-y-4 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">In de buurt</h2>
        {loading && <span className="text-xs text-gray-400">Laden…</span>}
        {!loading && (
          <span className="text-xs text-gray-400">
            {locations.length} locaties
          </span>
        )}
      </div>

      {message && (
        <div className="text-xs rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="text-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
          {error}
        </div>
      )}

      {/* Favorieten */}
      {favoriteLocations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>⭐ Mijn machines</span>
            <span>{favoriteLocations.length}</span>
          </div>
          <ul className="space-y-2">
            {favoriteLocations.map((l) => {
              const keyWorking = `${l.id}-WORKING`;
              const keyOut = `${l.id}-OUT`;

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

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center rounded-full bg-gray-900 text-white px-2 py-0.5 text-[11px]">
                        {statusLabel(l.currentStatus)}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Laatste melding:{" "}
                        {l.lastReportAt
                          ? timeAgo(l.lastReportAt)
                          : "nog geen meldingen"}
                      </span>
                    </div>
                    {l.distanceKm != null && (
                      <span className="text-[11px] text-gray-500">
                        {formatDistance(l.distanceKm)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => quickReport(l.id, "WORKING")}
                      disabled={submittingId === keyWorking}
                      className="flex-1 min-w-[110px] text-xs px-2 py-1.5 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-60"
                    >
                      {submittingId === keyWorking ? "Bezig…" : "✅ Werkt nu"}
                    </button>
                    <button
                      type="button"
                      onClick={() => quickReport(l.id, "OUT_OF_ORDER")}
                      disabled={submittingId === keyOut}
                      className="flex-1 min-w-[110px] text-xs px-2 py-1.5 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-60"
                    >
                      {submittingId === keyOut ? "Bezig…" : "❌ Stuk nu"}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <a
                      href={`/machine/${l.id}`}
                      className="text-[11px] text-gray-600 hover:underline"
                    >
                      Details
                    </a>
                    <a
                      href="#kaart"
                      className="text-[11px] text-gray-500 hover:underline"
                    >
                      Op kaart bekijken
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Nearby list */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Machines in de buurt</span>
          {hasRealLocation && <span>Gebaseerd op jouw locatie</span>}
        </div>

        {!locationResolved && !geoError && (
          <p className="text-xs text-gray-500">
            We bepalen je locatie om machines in de buurt te tonen…
          </p>
        )}

        {geoError && (
          <p className="text-xs text-gray-500">
            We hebben geen toegang tot je locatie. We tonen een algemene lijst
            met locaties; gebruik de kaart voor exacte posities.
          </p>
        )}

        {showNearbyList && (
          <ul className="space-y-2">
            {nearbyLocations.map((l) => (
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
                  <button
                    type="button"
                    onClick={() => toggleFavorite(l.id)}
                    className="text-[11px] px-2 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                  >
                    {isFavorite(l.id) ? "★ Favoriet" : "☆ Favoriet"}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>
                    Status: <b>{statusLabel(l.currentStatus)}</b>
                    {" • "}
                    Laatste melding:{" "}
                    {l.lastReportAt
                      ? timeAgo(l.lastReportAt)
                      : "nog geen meldingen"}
                  </span>
                  {l.distanceKm != null && (
                    <span>{formatDistance(l.distanceKm)}</span>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <a
                    href={`/machine/${l.id}`}
                    className="text-[11px] text-gray-600 hover:underline"
                  >
                    Details
                  </a>
                  <a
                    href="#kaart"
                    className="text-[11px] text-gray-500 hover:underline"
                  >
                    Op kaart bekijken
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        {locationResolved && !geoError && nearbyLocations.length === 0 && !loading && (
          <p className="text-xs text-gray-500">
            Geen locaties gevonden. Probeer de kaart hierboven.
          </p>
        )}
      </div>
    </section>
  );
}

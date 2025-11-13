// src/components/NearbyList.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { distanceKm } from "@/lib/geo";
import useFavorites from "@/lib/useFavorites";

type LocationItem = {
  id: string;
  name: string;
  retailer: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  currentStatus: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;
  lastReportAt?: string | null;
};

function StatusBadge({
  status,
}: {
  status: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;
}) {
  const label = status ?? "Unknown";
  const color =
    status === "WORKING"
      ? "bg-emerald-200 text-emerald-900"
      : status === "ISSUES"
      ? "bg-amber-200 text-amber-900"
      : status === "OUT_OF_ORDER"
      ? "bg-red-200 text-red-900"
      : "bg-gray-200 text-gray-800";
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded ${color}`}>
      {label}
    </span>
  );
}

export default function NearbyList() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // fetch locations
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/locations", { cache: "no-store" });
        const d = await r.json();
        setLocations(Array.isArray(d.locations) ? d.locations : []);
      } catch {
        setLocations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Locatie niet beschikbaar in je browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => setGeoError(err.message || "Kon locatie niet ophalen."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const sorted = useMemo(() => {
    let list = [...locations];
    if (pos) {
      list = list.sort((a, b) => {
        const da = distanceKm(pos, { lat: a.lat, lng: a.lng });
        const db = distanceKm(pos, { lat: b.lat, lng: b.lng });
        return da - db;
      });
    }
    return list.slice(0, 5); // only 5 nearest
  }, [locations, pos]);

  const favoritesList = useMemo(() => {
    if (favorites.length === 0) return [];
    const base = locations.filter((l) => favorites.includes(l.id));
    if (pos) {
      base.sort((a, b) => {
        const da = distanceKm(pos, { lat: a.lat, lng: a.lng });
        const db = distanceKm(pos, { lat: b.lat, lng: b.lng });
        return da - db;
      });
    }
    return base;
  }, [favorites, locations, pos]);

  if (loading) {
    return (
      <div className="mt-2 text-sm text-gray-500">Laden…</div>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Machines in de buurt</h2>
      {!pos && (
        <p className="text-xs text-gray-500 mt-1">
          {geoError
            ? `Locatie uitgeschakeld: ${geoError}`
            : "Tip: Sta locatiegebruik toe om dichtbijzijnde machines te tonen."}
        </p>
      )}

      {/* Favorites section */}
      {favoritesList.length > 0 && (
        <div className="mt-3 mb-4">
          <h3 className="text-sm font-medium mb-2">Favorieten</h3>
          <ul className="divide-y rounded-2xl border overflow-hidden">
            {favoritesList.map((l) => {
              const km =
                pos ? distanceKm(pos, { lat: l.lat, lng: l.lng }) : null;
              const kmLabel =
                km !== null
                  ? km < 1
                    ? `${Math.round(km * 1000)} m`
                    : `${km.toFixed(1)} km`
                  : null;

              const gmaps = `https://www.google.com/maps?q=${encodeURIComponent(
                `${l.name}, ${l.address}, ${l.city}`
              )}`;

              return (
                <li key={l.id} className="p-3 flex items-start gap-3 bg-amber-50/40">
                  <div className="grow">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{l.name}</div>
                      <StatusBadge status={l.currentStatus} />
                    </div>
                    <div className="text-xs text-gray-600">
                      {l.retailer} • {l.address}, {l.city}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {kmLabel && (
                      <div className="text-xs text-gray-700">{kmLabel}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(l.id)}
                      className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    >
                      {isFavorite(l.id) ? "★ Favoriet" : "☆ Favoriet"}
                    </button>
                    <a
                      href={gmaps}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                      title="Open in Google Maps"
                    >
                      Maps
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 5 closest list */}
      <ul className="mt-3 divide-y rounded-2xl border overflow-hidden">
        {sorted.map((l) => {
          const km =
            pos ? distanceKm(pos, { lat: l.lat, lng: l.lng }) : null;
          const kmLabel =
            km !== null
              ? km < 1
                ? `${Math.round(km * 1000)} m`
                : `${km.toFixed(1)} km`
              : null;

          const gmaps = `https://www.google.com/maps?q=${encodeURIComponent(
            `${l.name}, ${l.address}, ${l.city}`
          )}`;

          return (
            <li key={l.id} className="p-3 flex items-start gap-3">
              <div className="grow">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{l.name}</div>
                  <StatusBadge status={l.currentStatus} />
                  {isFavorite(l.id) && (
                    <span className="text-[10px] text-amber-700">★</span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {l.retailer} • {l.address}, {l.city}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {kmLabel && (
                  <div className="text-xs text-gray-700">{kmLabel}</div>
                )}
                <button
                  type="button"
                  onClick={() => toggleFavorite(l.id)}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                >
                  {isFavorite(l.id) ? "★ Favoriet" : "☆ Favoriet"}
                </button>
                <a
                  href={gmaps}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                  title="Open in Google Maps"
                >
                  Maps
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

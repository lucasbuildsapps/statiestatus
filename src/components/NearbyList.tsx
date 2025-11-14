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
  const label =
    status === "WORKING"
      ? "Werkend"
      : status === "ISSUES"
      ? "Problemen"
      : status === "OUT_OF_ORDER"
      ? "Stuk"
      : "Onbekend";
  const color =
    status === "WORKING"
      ? "bg-green-100 text-green-800"
      : status === "ISSUES"
      ? "bg-yellow-100 text-yellow-800"
      : status === "OUT_OF_ORDER"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
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

  const { isFavorite, toggleFavorite } = useFavorites();

  // fetch locations
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/locations");
        const d = await r.json();
        setLocations(Array.isArray(d.locations) ? d.locations : []);
      } catch {
        setLocations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // try geolocation (optional)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocatie niet beschikbaar in je browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => setGeoError(err.message || "Kon locatie niet ophalen."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const sorted = useMemo(() => {
    if (!pos) return locations;
    return [...locations].sort((a, b) => {
      const da = distanceKm(pos, { lat: a.lat, lng: a.lng });
      const db = distanceKm(pos, { lat: b.lat, lng: b.lng });
      return da - db;
    });
  }, [locations, pos]);

  const top5 = sorted.slice(0, 5);

  if (loading) {
    return (
      <div className="mt-1">
        <h2 className="text-lg font-semibold">In de buurt</h2>
        <div className="mt-2 text-sm text-gray-500">Laden…</div>
      </div>
    );
  }

  return (
    <section className="mt-1">
      <h2 className="text-lg font-semibold">In de buurt</h2>
      {!pos && (
        <p className="text-xs text-gray-500 mt-1">
          {geoError
            ? `Locatie uitgeschakeld: ${geoError}`
            : "Tip: Sta locatietoegang toe voor afstanden en sortering."}
        </p>
      )}

      <ul className="mt-3 divide-y rounded-2xl border overflow-hidden">
        {top5.map((l) => {
          const km =
            pos ? distanceKm(pos, { lat: l.lat, lng: l.lng }) : null;
          const kmLabel =
            km !== null
              ? `${
                  km < 1
                    ? Math.round(km * 1000) + " m"
                    : km.toFixed(1) + " km"
                }`
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
                </div>
                <div className="text-xs text-gray-600">
                  {l.retailer} • {l.address}, {l.city}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {kmLabel && (
                  <div className="text-xs text-gray-700">{kmLabel}</div>
                )}
                <a
                  href={gmaps}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                  title="Open in Google Maps"
                >
                  Open in Maps
                </a>
                <button
                  type="button"
                  onClick={() => toggleFavorite(l.id)}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50 mt-1"
                >
                  {isFavorite(l.id) ? "★ Favoriet" : "☆ Favoriet"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

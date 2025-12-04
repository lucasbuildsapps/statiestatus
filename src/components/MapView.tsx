// src/components/MapView.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Map as LMap, CircleMarker as LeafletCircle } from "leaflet";
import Link from "next/link";
import useFavorites from "@/lib/useFavorites";
import {
  fetchLocationsShared,
  type ApiLocation,
  type ApiStatus,
} from "@/lib/locationsClient";

type LeafletAPI = {
  MapContainer: any;
  TileLayer: any;
  Popup: any;
  CircleMarker: any;
  useMap: any;
};

type LocationItem = ApiLocation;

function colorForStatus(s: ApiStatus | null) {
  if (s === "WORKING") return "#22c55e"; // green-500
  if (s === "ISSUES") return "#eab308"; // yellow-500
  if (s === "OUT_OF_ORDER") return "#ef4444"; // red-500
  return "#9ca3af"; // gray-400
}

function statusLabel(s: ApiStatus) {
  if (s === "WORKING") return "Werkend";
  if (s === "ISSUES") return "Problemen";
  return "Stuk";
}

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

// ---------- Confidence (aggregate version for map) ----------

type Confidence = "low" | "medium" | "high";

function deriveConfidenceFromAggregate(
  totalReports?: number,
  lastReportAt?: string | null
): Confidence {
  if (!totalReports || totalReports < 1 || !lastReportAt) return "low";

  const now = Date.now();
  const ageDays =
    (now - new Date(lastReportAt).getTime()) / (24 * 3600 * 1000);

  // Very simple + readable thresholds
  if (totalReports >= 10 && ageDays <= 7) return "high";
  if (totalReports >= 5 && ageDays <= 14) return "medium";
  if (totalReports >= 3 && ageDays <= 30) return "medium";
  return "low";
}

function confidenceLabel(c: Confidence) {
  if (c === "high") return "Hoge betrouwbaarheid";
  if (c === "medium") return "Redelijke betrouwbaarheid";
  return "Lage betrouwbaarheid";
}

function confidenceClasses(c: Confidence) {
  if (c === "high") return "bg-emerald-50 text-emerald-900 border-emerald-200";
  if (c === "medium") return "bg-amber-50 text-amber-900 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function MapView() {
  const [leaflet, setLeaflet] = useState<LeafletAPI | null>(null);
  const [map, setMap] = useState<LMap | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "WORKING" | "OUT_OF_ORDER"
  >("ALL");
  const [toast, setToast] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [centeredOnUser, setCenteredOnUser] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);

  const [initialLocationId, setInitialLocationId] = useState<string | null>(
    null
  );

  const [submittingQuickId, setSubmittingQuickId] = useState<string | null>(
    null
  );

  const { isFavorite, toggleFavorite } = useFavorites();
  const markerRefs = useRef<Record<string, LeafletCircle | null>>({});

  // Shared loader using the client cache
  const loadLocations = useCallback(
    async (force = false) => {
      try {
        const list = await fetchLocationsShared(force);
        setLocations(list);
      } catch (e) {
        console.error("MapView: failed to load locations", e);
        setLocations([]);
      }
    },
    []
  );

  useEffect(() => {
    loadLocations(false);
  }, [loadLocations]);

  // Compute latest update time
  useEffect(() => {
    if (!locations.length) {
      setLastUpdatedAt(null);
      return;
    }
    const times = locations
      .map((l) => l.lastReportAt)
      .filter(Boolean) as string[];
    if (!times.length) {
      setLastUpdatedAt(null);
      return;
    }
    const latest = times.reduce((acc, cur) =>
      new Date(cur).getTime() > new Date(acc).getTime() ? cur : acc
    );
    setLastUpdatedAt(latest);
  }, [locations]);

  // dynamic import of react-leaflet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      const rl = await import("react-leaflet");
      if (!cancelled) {
        setLeaflet({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Popup: rl.Popup,
          CircleMarker: rl.CircleMarker,
          useMap: (rl as any).useMap,
        });
        setLoadingMap(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load last known position from localStorage (fast) before geolocation
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

  // user geolocation (updates pos + localStorage)
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        };
        setPos(coords);
        try {
          window.localStorage.setItem(
            "statiestatus:lastPosition",
            JSON.stringify(coords)
          );
        } catch {
          // ignore
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // read ?location= from the URL once on mount
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const loc = url.searchParams.get("location");
      if (loc) {
        setInitialLocationId(loc);
      }
    } catch {
      // ignore
    }
  }, []);

  const defaultCenter: [number, number] = [52.3676, 4.9041]; // Amsterdam

  const visibleLocations = useMemo(() => {
    let list = locations;
    if (statusFilter !== "ALL") {
      list = list.filter((l) => l.currentStatus === statusFilter);
    }
    return list;
  }, [locations, statusFilter]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return visibleLocations;
    return visibleLocations.filter((l) =>
      [l.name, l.retailer, l.address, l.city].some((s) =>
        String(s).toLowerCase().includes(term)
      )
    );
  }, [visibleLocations, q]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }

  function centerOnSearchResults() {
    if (!map) return;
    const list = filtered;
    if (!list.length) return;

    const latSum = list.reduce((sum, l) => sum + l.lat, 0);
    const lngSum = list.reduce((sum, l) => sum + l.lng, 0);
    const center: [number, number] = [
      latSum / list.length,
      lngSum / list.length,
    ];

    setUserInteracted(true);
    map.setView(center, 13);
  }

  function focusLocation(l: LocationItem, openPopup: boolean) {
    if (!map) return;

    setUserInteracted(true);
    map.setView([l.lat, l.lng], 16);

    setHighlightId(l.id);
    window.setTimeout(
      () => setHighlightId((id) => (id === l.id ? null : id)),
      1500
    );

    if (openPopup) {
      const marker = markerRefs.current[l.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }

  function shareLocation(l: LocationItem) {
    const url = `${window.location.origin}/machine/${encodeURIComponent(
      l.id
    )}`;
    if (navigator.share) {
      navigator
        .share({ title: "statiestatus.nl", text: l.name, url })
        .catch(() => {});
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link gekopieerd 🌐"))
        .catch(() => {});
      return;
    }
    window.prompt("Kopieer deze link:", url);
  }

  // quick report from popup
  async function quickReport(
    locationId: string,
    status: "WORKING" | "OUT_OF_ORDER"
  ) {
    const key = `${locationId}-${status}`;
    setSubmittingQuickId(key);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, status, note: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || "Er ging iets mis bij het verzenden.");
        return;
      }
      showToast("✅ Bedankt! Melding geplaatst.");
      await loadLocations(true);
    } catch {
      showToast("Netwerkfout bij verzenden.");
    } finally {
      setSubmittingQuickId(null);
    }
  }

  // zoom to initialLocationId if present
  useEffect(() => {
    if (!initialLocationId || !map || !locations.length) return;

    const target = locations.find((l) => l.id === initialLocationId);
    if (!target) return;

    setUserInteracted(true);
    map.setView([target.lat, target.lng], 16);
    setHighlightId(target.id);

    const marker = markerRefs.current[target.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 200);
    }
  }, [initialLocationId, map, locations]);

  if (!leaflet || loadingMap) {
    return (
      <div className="w-full h-[60vh] md:h-[70vh] grid place-items-center">
        <span className="text-sm text-gray-500">Kaart laden…</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Popup, CircleMarker, useMap } = leaflet;

  function MapController() {
    const m = useMap();
    useEffect(() => {
      setMap(m);
    }, [m]);

    useEffect(() => {
      if (m && pos && !centeredOnUser && !userInteracted) {
        m.setView([pos.lat, pos.lng], 14);
        setCenteredOnUser(true);
      }
    }, [m, pos, centeredOnUser, userInteracted]);

    return null;
  }

  return (
    <div className="relative">
      {/* Controls wrapper (positioned) */}
      <div className="absolute z-[900] top-3 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 w-[92vw] max-w-[360px] sm:w-[280px]">
        {/* Mobile toggle pill */}
        <div className="sm:hidden mb-2 flex justify-center">
          {controlsOpen ? (
            <button
              type="button"
              onClick={() => setControlsOpen(false)}
              className="inline-flex items-center gap-1 rounded-full bg-white/95 border border-gray-200 px-3 py-1 text-[11px] shadow-sm"
            >
              ⬇ Kaart groter maken
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setControlsOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white/95 border border-gray-200 px-3 py-1 text-[11px] shadow-sm"
            >
              🔍 Filter & zoeken
            </button>
          )}
        </div>

        {/* Main controls card */}
        <div
          className={
            "bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-md md:shadow-lg p-3 max-h-[70vh] overflow-y-auto " +
            (controlsOpen ? "block" : "hidden sm:block")
          }
        >
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span>
              Laatste update:{" "}
              {lastUpdatedAt ? timeAgo(lastUpdatedAt) : "nog geen meldingen"}
            </span>
            <span className="hidden sm:inline">
              Locaties: {visibleLocations.length}
            </span>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                centerOnSearchResults();
              }
            }}
            placeholder="Zoek op naam, winkel, stad…"
            className="w-full text-sm px-3 py-2 border rounded-lg"
          />

          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
            {[
              { id: "ALL", label: "Alle" },
              { id: "WORKING", label: "Werkend" },
              { id: "OUT_OF_ORDER", label: "Stuk" },
            ].map((btn) => {
              const active = statusFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() =>
                    setStatusFilter(btn.id as typeof statusFilter)
                  }
                  className={
                    "px-3 py-1 rounded-full border transition text-xs " +
                    (active
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 hover:bg-gray-50")
                  }
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {pos && map && (
            <button
              type="button"
              onClick={() => {
                setUserInteracted(true);
                map.setView([pos.lat, pos.lng], 15);
              }}
              className="mt-3 w-full text-xs px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-1"
            >
              📍 Inzoomen op mijn locatie
            </button>
          )}

          {q && (
            <ul className="max-h-40 overflow-auto mt-2 divide-y border rounded-lg bg-white">
              {filtered.slice(0, 8).map((l) => (
                <li
                  key={l.id}
                  className="p-2 text-sm cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    focusLocation(l, true);
                    setQ("");
                    setControlsOpen(false);
                  }}
                  title={`${l.name} • ${l.retailer} • ${l.city}`}
                >
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-gray-600">
                    {l.retailer} — {l.city}
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="p-2 text-xs text-gray-500">Geen resultaten</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Map itself */}
      <div className="w-full h-[60vh] md:h-[70vh]">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom
          className="w-full h-full"
        >
          <MapController />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {/* User location */}
          {pos && (
            <CircleMarker
              center={[pos.lat, pos.lng]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: 0.98,
              }}
            />
          )}

          {visibleLocations.map((l) => {
            const fillColor = colorForStatus(l.currentStatus);
            const keyWorking = `${l.id}-WORKING`;
            const keyOut = `${l.id}-OUT_OF_ORDER`;

            const confidence = deriveConfidenceFromAggregate(
              (l as any).totalReports,
              l.lastReportAt
            );

            return (
              <CircleMarker
                key={l.id}
                center={[l.lat, l.lng]}
                radius={highlightId === l.id ? 11 : 8}
                pathOptions={{
                  color: "#ffffff",
                  weight: highlightId === l.id ? 4 : 3,
                  fillColor,
                  fillOpacity: 0.98,
                }}
                ref={(instance: LeafletCircle | null) => {
                  markerRefs.current[l.id] = instance;
                }}
                eventHandlers={{
                  click: () => focusLocation(l, true),
                }}
              >
                <Popup>
                  <div className="w-64 space-y-3 text-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold leading-tight">
                          {l.name}
                        </div>
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
                        className="text-[11px] px-2 py-1 rounded border bg-white hover:bg-gray-50"
                      >
                        {isFavorite(l.id) ? "★" : "☆"}
                      </button>
                    </div>

                    {/* Status + confidence + last update */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={l.currentStatus} />
                        <span
                          className={
                            "inline-flex items-center rounded-full border px-2 py-[2px] text-[11px] " +
                            confidenceClasses(confidence)
                          }
                        >
                          {confidenceLabel(confidence)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 text-right">
                        {l.lastReportAt ? (
                          <>
                            Laatste melding {timeAgo(l.lastReportAt)}
                            {typeof (l as any).totalReports === "number" && (
                              <div>
                                {(l as any).totalReports} meldingen totaal
                              </div>
                            )}
                          </>
                        ) : (
                          "Nog geen meldingen"
                        )}
                      </div>
                    </div>

                    {/* Quick report buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => quickReport(l.id, "WORKING")}
                        disabled={submittingQuickId === keyWorking}
                        className="flex-1 rounded-lg border bg-white text-xs px-2 py-1.5 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {submittingQuickId === keyWorking
                          ? "Bezig…"
                          : "✅ Werkt nu"}
                      </button>
                      <button
                        type="button"
                        onClick={() => quickReport(l.id, "OUT_OF_ORDER")}
                        disabled={submittingQuickId === keyOut}
                        className="flex-1 rounded-lg border bg-white text-xs px-2 py-1.5 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {submittingQuickId === keyOut
                          ? "Bezig…"
                          : "❌ Stuk nu"}
                      </button>
                    </div>

                    {/* Secondary actions */}
                    <div className="flex flex-col gap-1 pt-1">
                      <Link
                        href={`/machine/${l.id}`}
                        className="w-full rounded-lg bg-black text-white text-xs px-3 py-1.5 text-center hover:bg-gray-900"
                      >
                        Details & geschiedenis
                      </Link>
                      <Link
                        href={`/melden?location=${encodeURIComponent(l.id)}`}
                        className="w-full rounded-lg border text-xs px-3 py-1.5 text-center hover:bg-gray-50"
                      >
                        Uitgebreid melden
                      </Link>
                      <button
                        type="button"
                        onClick={() => shareLocation(l)}
                        className="w-full rounded-lg border text-xs px-3 py-1.5 text-center hover:bg-gray-50"
                      >
                        Deel link
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <Legend />

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[1100]">
          <div className="rounded-xl bg-black text-white text-sm px-3 py-2 shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function StatusBadge({
  status,
}: {
  status: ApiStatus | null;
}) {
  const label = status ? statusLabel(status as ApiStatus) : "Onbekend";
  const color =
    status === "WORKING"
      ? "bg-emerald-50 text-emerald-900"
      : status === "ISSUES"
      ? "bg-amber-50 text-amber-900"
      : status === "OUT_OF_ORDER"
      ? "bg-red-50 text-red-900"
      : "bg-slate-50 text-slate-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] border ${color}`}
    >
      Status: <b className="ml-1">{label}</b>
    </span>
  );
}

function Legend() {
  const items: Array<{ label: string; color: string }> = [
    { label: "Werkend", color: colorForStatus("WORKING") },
    { label: "Stuk", color: colorForStatus("OUT_OF_ORDER") },
    { label: "Onbekend", color: colorForStatus(null) },
  ];

  const labelColor = "#374151";

  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs px-3 pb-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{
              width: 12,
              height: 12,
              background: it.color,
              boxShadow: "0 0 0 2px #ffffff",
            }}
          />
          <span style={{ color: labelColor }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

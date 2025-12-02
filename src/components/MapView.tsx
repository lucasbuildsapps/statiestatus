// src/components/MapView.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Map as LMap, CircleMarker as LeafletCircle } from "leaflet";
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

function confidenceText(total?: number) {
  if (!total || total < 1)
    return "Nog weinig meldingen (lage betrouwbaarheid).";
  if (total < 5) return `Enkele meldingen (${total}).`;
  return `Betrouwbare status (${total}+ meldingen).`;
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

  // Track current zoom level for performance-related logic
  const [mapZoom, setMapZoom] = useState<number>(12);

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

  // Only render markers when sufficiently zoomed in
  const markersToRender = useMemo(() => {
    if (!mapZoom || mapZoom < 9) return [];
    return visibleLocations;
  }, [mapZoom, visibleLocations]);

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
    const url = `${window.location.origin}/?location=${encodeURIComponent(
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

      const handleZoom = () => {
        setMapZoom(m.getZoom());
      };

      m.on("zoomend", handleZoom);
      setMapZoom(m.getZoom());

      return () => {
        m.off("zoomend", handleZoom);
      };
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

      {/* Map + overlay */}
      <div className="relative w-full h-[60vh] md:h-[70vh]">
        {/* Hint when zoomed out and markers are hidden */}
        {mapZoom < 9 && (
          <div className="absolute z-[850] top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 border border-gray-200 px-3 py-1 text-[11px] shadow">
            🔍 Zoom in om statiegeldmachines te zien
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom
          preferCanvas={true} // better performance with many markers
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

          {/* Locations (only rendered when zoomed in enough) */}
          {markersToRender.map((l) => {
            const fillColor = colorForStatus(l.currentStatus);

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
                  <div className="space-y-3 text-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-base">
                          {l.name}
                        </div>
                        <div className="text-gray-700">{l.retailer}</div>
                        <div className="text-gray-600 text-xs">
                          {l.address}, {l.city}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(l.id)}
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        >
                          {isFavorite(l.id) ? "★ Favoriet" : "☆ Favoriet"}
                        </button>
                        <button
                          type="button"
                          onClick={() => shareLocation(l)}
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        >
                          Deel link
                        </button>
                      </div>
                    </div>

                    {/* Status row */}
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={l.currentStatus} />
                      <div className="text-xs text-gray-500 text-right">
                        {l.lastReportAt ? (
                          <>
                            Laatste melding {timeAgo(l.lastReportAt)}
                            {typeof l.totalReports === "number" && (
                              <div>{confidenceText(l.totalReports)}</div>
                            )}
                          </>
                        ) : (
                          "Nog geen meldingen"
                        )}
                      </div>
                    </div>

                    {/* Recent reports */}
                    {l.lastReports && l.lastReports.length > 0 && (
                      <div className="rounded-lg border p-2 text-xs space-y-1 bg-white/60">
                        <div className="font-medium">Recente meldingen</div>
                        <ul className="space-y-1">
                          {l.lastReports.map((r) => (
                            <li
                              key={r.id}
                              className="flex items-start gap-2"
                            >
                              <span className="shrink-0 mt-0.5">
                                <StatusDot status={r.status} />
                              </span>
                              <span className="text-gray-700">
                                <b>{statusLabel(r.status)}</b>
                                {r.note ? ` — ${r.note}` : ""}
                                <span className="text-gray-500">
                                  {" "}
                                  · {timeAgo(r.createdAt)}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Report form */}
                    <ReportForm
                      locationId={l.id}
                      onSuccess={async () => {
                        await loadLocations(true);
                        showToast("✅ Bedankt! Melding geplaatst.");
                      }}
                    />
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

function StatusBadge({ status }: { status: ApiStatus | null }) {
  const label = status ? statusLabel(status as ApiStatus) : "Onbekend";
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
      Status: <b>{label}</b>
    </span>
  );
}

function StatusDot({ status }: { status: ApiStatus }) {
  const color = colorForStatus(status);
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: 8,
        height: 8,
        background: color,
        boxShadow: "0 0 0 2px #ffffff",
      }}
      aria-hidden
    />
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

/* ---------- Popup report form ---------- */

type ReportIssueType = "FULL" | "RECEIPT" | "NO_ACCEPT" | "DOWN" | "OTHER";

const ISSUE_LABELS: Record<ReportIssueType, string> = {
  FULL: "Machine lijkt vol",
  RECEIPT: "Bon komt niet uit",
  NO_ACCEPT: "Accepteert geen flessen",
  DOWN: "Machine lijkt uitgevallen",
  OTHER: "Anders probleem",
};

function ReportForm({
  locationId,
  onSuccess,
}: {
  locationId: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const [status, setStatus] = useState<"WORKING" | "OUT_OF_ORDER">("WORKING");
  const [issueType, setIssueType] = useState<ReportIssueType | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const reason =
      status === "OUT_OF_ORDER" && issueType
        ? ISSUE_LABELS[issueType]
        : "";

    const pieces: string[] = [];
    if (reason) pieces.push(reason);
    if (note.trim()) pieces.push(note.trim());
    const finalNote = pieces.join(" — ");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, status, note: finalNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Er ging iets mis");
        return;
      }

      setMsg("✅ Melding geplaatst.");
      setNote("");
      setIssueType(null);
      if (onSuccess) await onSuccess();
    } catch {
      setMsg("Netwerkfout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      {/* Status select */}
      <select
        value={status}
        onChange={(e) => {
          const next = e.target.value as "WORKING" | "OUT_OF_ORDER";
          setStatus(next);
          if (next === "WORKING") {
            setIssueType(null);
          }
        }}
        className="border rounded-lg px-2 py-1 w-full"
      >
        <option value="WORKING">✅ Werkend</option>
        <option value="OUT_OF_ORDER">❌ Stuk</option>
      </select>

      {/* Reason chips when stuk */}
      {status === "OUT_OF_ORDER" && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600">
            Wat lijkt er aan de hand? (optioneel)
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {([
              { id: "FULL", label: "Machine vol" },
              { id: "RECEIPT", label: "Bon komt niet uit" },
              { id: "NO_ACCEPT", label: "Accepteert geen flessen" },
              { id: "DOWN", label: "Machine uitgevallen" },
              { id: "OTHER", label: "Anders" },
            ] as const).map((opt) => {
              const active = issueType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setIssueType(active ? null : opt.id)
                  }
                  className={
                    "px-2.5 py-1 rounded-full border " +
                    (active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-800 hover:bg-gray-50")
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optionele notitie (max 280)"
        className="border rounded-lg px-2 py-1 w-full"
        maxLength={280}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-3 py-1.5 rounded-lg w-full disabled:opacity-70"
      >
        {loading ? "Versturen…" : "Melding plaatsen"}
      </button>

      {msg && <div className="text-xs pt-1">{msg}</div>}
    </form>
  );
}

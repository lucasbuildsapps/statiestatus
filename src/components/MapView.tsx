// src/components/MapView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Map as LMap } from "leaflet";
import useFavorites from "@/lib/useFavorites";

type LeafletAPI = {
  MapContainer: any;
  TileLayer: any;
  Popup: any;
  CircleMarker: any;
  useMap: any;
};

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
  currentStatus: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;
  lastReportAt?: string | null;
  lastReports?: LastReport[];
  totalReports?: number;
};

function colorForStatus(s: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null) {
  if (s === "WORKING") return "#22c55e";
  if (s === "ISSUES") return "#eab308";
  if (s === "OUT_OF_ORDER") return "#ef4444";
  return "#9ca3af";
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
  if (!total || total < 1) return "Nog weinig meldingen (lage betrouwbaarheid).";
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
    "ALL" | "WORKING" | "ISSUES" | "OUT_OF_ORDER"
  >("ALL");
  const [toast, setToast] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [centeredOnUser, setCenteredOnUser] = useState(false);

  const [sharedLocationId, setSharedLocationId] = useState<string | null>(null);
  const [handledSharedLocation, setHandledSharedLocation] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();

  const fetchLocations = useCallback(async () => {
    try {
      const r = await fetch("/api/locations", { cache: "no-store" });
      const d = await r.json();
      setLocations(Array.isArray(d.locations) ? d.locations : []);
    } catch {
      setLocations([]);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // dynamic import react-leaflet
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

  // user geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // read ?location=... from URL (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("location");
    if (id) setSharedLocationId(id);
  }, []);

  const defaultCenter: [number, number] = [52.3676, 4.9041];

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

  function flyToLocation(l: LocationItem) {
    if (!map) return;
    map.flyTo([l.lat, l.lng], 15, { duration: 0.8 });
    setHighlightId(l.id);
    window.setTimeout(
      () => setHighlightId((id) => (id === l.id ? null : id)),
      1500
    );
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

  // fly to shared location once
  useEffect(() => {
    if (!map) return;
    if (!sharedLocationId) return;
    if (handledSharedLocation) return;
    const l = locations.find((loc) => loc.id === sharedLocationId);
    if (!l) return;
    flyToLocation(l);
    setHandledSharedLocation(true);
  }, [map, sharedLocationId, handledSharedLocation, locations]);

  if (!leaflet || loadingMap) {
    return (
      <div className="w-full h-[70vh] grid place-items-center">
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
      if (m && pos && !centeredOnUser && !sharedLocationId) {
        m.setView([pos.lat, pos.lng], 14);
        setCenteredOnUser(true);
      }
    }, [m, pos, centeredOnUser, sharedLocationId]);

    return null;
  }

  return (
    <div className="relative">
      {/* Search + filters, shifted right */}
      <div className="absolute left-16 top-3 z-[900]">
        <div className="bg-white/95 backdrop-blur border rounded-xl shadow-sm p-2 w-[280px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op naam, winkel, stad…"
            className="w-full text-sm px-2 py-1 border rounded-lg"
          />
          <div className="flex flex-wrap gap-1 mt-2 text-[11px]">
            {[
              { id: "ALL", label: "Alle" },
              { id: "WORKING", label: "Werkend" },
              { id: "ISSUES", label: "Problemen" },
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
                    "px-2 py-0.5 rounded-full border " +
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

          {q && (
            <ul className="max-h-52 overflow-auto mt-2 divide-y border rounded-lg bg-white">
              {filtered.slice(0, 8).map((l) => (
                <li
                  key={l.id}
                  className="p-2 text-sm cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    flyToLocation(l);
                    setQ("");
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

      <div className="w-full h-[70vh]">
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

          {/* user location */}
          {pos && (
            <CircleMarker
              center={[pos.lat, pos.lng]}
              radius={6}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#2563eb",
                fillOpacity: 0.95,
              }}
            />
          )}

          {visibleLocations.map((l) => (
            <CircleMarker
              key={l.id}
              center={[l.lat, l.lng]}
              radius={highlightId === l.id ? 10 : 7}
              pathOptions={{
                color: "#ffffff",
                weight: highlightId === l.id ? 3 : 2,
                fillColor: colorForStatus(l.currentStatus),
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => flyToLocation(l),
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-sm text-gray-600">
                        {l.retailer} – {l.address}, {l.city}
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

                  <div className="flex items-center gap-2">
                    <StatusBadge status={l.currentStatus} />
                    <span className="text-xs text-gray-500">
                      {l.lastReportAt
                        ? `Laatste melding ${timeAgo(l.lastReportAt)}`
                        : "Nog geen meldingen"}
                    </span>
                  </div>

                  {typeof l.totalReports === "number" && (
                    <div className="text-xs text-gray-500">
                      {confidenceText(l.totalReports)}
                    </div>
                  )}

                  {l.lastReports && l.lastReports.length > 0 && (
                    <div className="rounded-lg border p-2 text-xs space-y-1 bg-white/60">
                      <div className="font-medium">Recente meldingen</div>
                      <ul className="space-y-1">
                        {l.lastReports.map((r) => (
                          <li key={r.id} className="flex items-start gap-2">
                            <span className="shrink-0 mt-0.5">
                              <StatusDot status={r.status} />
                            </span>
                            <span className="text-gray-700">
                              <b>{r.status.replaceAll("_", " ")}</b>
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

                  <ReportForm
                    locationId={l.id}
                    onSuccess={async () => {
                      await fetchLocations();
                      showToast("✅ Bedankt! Melding geplaatst.");
                    }}
                  />
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <Legend />

      {toast && (
        <div className="fixed bottom-4 right-4 z-[1100]">
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
      Status: <b>{label}</b>
    </span>
  );
}

function StatusDot({ status }: { status: "WORKING" | "ISSUES" | "OUT_OF_ORDER" }) {
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
    { label: "Problemen", color: colorForStatus("ISSUES") },
    { label: "Stuk", color: colorForStatus("OUT_OF_ORDER") },
    { label: "Onbekend", color: colorForStatus(null) },
  ];

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
          <span className="text-gray-700">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Popup report form ---------- */

function ReportForm({
  locationId,
  onSuccess,
}: {
  locationId: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const [status, setStatus] = useState<"WORKING" | "ISSUES" | "OUT_OF_ORDER">(
    "WORKING"
  );
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, status, note }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Er ging iets mis");
        return;
      }

      setMsg("✅ Melding geplaatst.");
      setNote("");
      if (onSuccess) await onSuccess();
    } catch {
      setMsg("Netwerkfout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <select
        value={status}
        onChange={(e) =>
          setStatus(e.target.value as "WORKING" | "ISSUES" | "OUT_OF_ORDER")
        }
        className="border rounded-lg px-2 py-1 w-full"
      >
        <option value="WORKING">✅ Werkend</option>
        <option value="ISSUES">⚠️ Problemen (traag/loopt vast)</option>
        <option value="OUT_OF_ORDER">❌ Stuk</option>
      </select>

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
        className="bg-black text-white px-3 py-1.5 rounded-lg w-full"
      >
        {loading ? "Versturen…" : "Melding plaatsen"}
      </button>

      {msg && <div className="text-xs pt-1">{msg}</div>}
    </form>
  );
}

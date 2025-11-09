"use client";

import { useEffect, useState, useCallback } from "react";

type LeafletAPI = {
  MapContainer: any;
  TileLayer: any;
  Popup: any;
  CircleMarker: any;
};

type LastReport = {
  id: string;
  status: "WORKING" | "ISSUES" | "OUT_OF_ORDER";
  note: string;
  createdAt: string; // ISO
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
};

function colorForStatus(s: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null) {
  if (s === "WORKING") return "#10b981";      // green
  if (s === "ISSUES") return "#f59e0b";       // amber
  if (s === "OUT_OF_ORDER") return "#ef4444"; // red
  return "#9ca3af";                            // gray (unknown)
}

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function MapView() {
  const [leaflet, setLeaflet] = useState<LeafletAPI | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      await import("leaflet/dist/leaflet.css");
      const rl = await import("react-leaflet");
      if (!cancelled) {
        setLeaflet({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Popup: rl.Popup,
          CircleMarker: rl.CircleMarker,
        });
        setLoadingMap(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const center: [number, number] = [52.3676, 4.9041]; // Amsterdam

  if (loadingMap || !leaflet) {
    return (
      <div className="w-full h-[70vh] rounded-2xl overflow-hidden shadow grid place-items-center">
        <span className="text-sm text-gray-500">Loading map…</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Popup, CircleMarker } = leaflet;

  return (
    <div className="w-full">
      <div className="w-full h-[70vh] rounded-2xl overflow-hidden shadow">
        <MapContainer center={center} zoom={12} scrollWheelZoom className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {locations.map((l) => (
            <CircleMarker
              key={l.id}
              center={[l.lat, l.lng]}
              radius={10}
              pathOptions={{
                color: colorForStatus(l.currentStatus),
                fillColor: colorForStatus(l.currentStatus),
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-sm text-gray-600">
                    {l.retailer} – {l.address}, {l.city}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={l.currentStatus} />
                    <span className="text-xs text-gray-500">
                      {l.lastReportAt ? `Last report ${timeAgo(l.lastReportAt)}` : "No reports yet"}
                    </span>
                  </div>

                  {l.lastReports && l.lastReports.length > 0 && (
                    <div className="rounded border p-2 text-xs space-y-1">
                      <div className="font-medium">Recent reports</div>
                      <ul className="space-y-1">
                        {l.lastReports.map((r) => (
                          <li key={r.id} className="flex items-start gap-2">
                            <span className="shrink-0 mt-0.5">
                              <StatusDot status={r.status} />
                            </span>
                            <span className="text-gray-700">
                              <b>{r.status.replaceAll("_", " ")}</b>
                              {r.note ? ` — ${r.note}` : ""}
                              <span className="text-gray-500"> · {timeAgo(r.createdAt)}</span>
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
                    }}
                  />
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <Legend />
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
      ? "bg-green-100 text-green-800"
      : status === "ISSUES"
      ? "bg-yellow-100 text-yellow-800"
      : status === "OUT_OF_ORDER"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  return (
    <div className={`inline-block text-xs px-2 py-1 rounded ${color}`}>
      Status: <b>{label}</b>
    </div>
  );
}

function StatusDot({
  status,
}: {
  status: "WORKING" | "ISSUES" | "OUT_OF_ORDER";
}) {
  const color = colorForStatus(status);
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: 8, height: 8, background: color }}
      aria-hidden
    />
  );
}

function Legend() {
  const items: Array<{ label: string; color: string }> = [
    { label: "Working",      color: colorForStatus("WORKING") },
    { label: "Issues",       color: colorForStatus("ISSUES") },
    { label: "Out of order", color: colorForStatus("OUT_OF_ORDER") },
    { label: "Unknown",      color: colorForStatus(null) },
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{
              width: 12,
              height: 12,
              background: it.color,
              boxShadow: "0 0 0 2px rgba(0,0,0,0.08)",
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
  const [status, setStatus] = useState<"WORKING" | "ISSUES" | "OUT_OF_ORDER">("WORKING");
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
        setMsg(data?.error || "Something went wrong");
        return;
      }

      setMsg("✅ Thanks! Report submitted.");
      setNote("");
      if (onSuccess) await onSuccess();
    } catch {
      setMsg("Network error");
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
        className="border rounded px-2 py-1 w-full"
      >
        <option value="WORKING">✅ Working</option>
        <option value="ISSUES">⚠️ Issues (slow/jammed)</option>
        <option value="OUT_OF_ORDER">❌ Out of order</option>
      </select>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (max 280)"
        className="border rounded px-2 py-1 w-full"
        maxLength={280}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-3 py-1 rounded w-full"
      >
        {loading ? "Sending..." : "Submit report"}
      </button>

      {msg && <div className="text-xs pt-1">{msg}</div>}
    </form>
  );
}

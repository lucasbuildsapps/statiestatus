// src/lib/locationsClient.ts
export type ApiStatus = "WORKING" | "ISSUES" | "OUT_OF_ORDER";

export type ApiLastReport = {
  id: string;
  status: ApiStatus;
  note: string | null;
  createdAt: string;
};

export type ApiLocation = {
  id: string;
  name: string;
  retailer: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  currentStatus: ApiStatus | null;
  lastReportAt: string | null;
  totalReports: number;
  lastReports: ApiLastReport[];
};

let cache: ApiLocation[] | null = null;
let inFlight: Promise<ApiLocation[]> | null = null;

/**
 * Shared client-side fetch for /api/locations.
 * - Caches the result in-memory.
 * - Ensures only one real network request runs at a time.
 */
export async function fetchLocationsShared(
  forceRefresh = false
): Promise<ApiLocation[]> {
  if (!forceRefresh && cache) return cache;
  if (!forceRefresh && inFlight) return inFlight;

  inFlight = (async () => {
    const res = await fetch("/api/locations");
    if (!res.ok) {
      throw new Error("Failed to load locations");
    }
    const data = await res.json();
    const list = Array.isArray(data.locations)
      ? (data.locations as ApiLocation[])
      : [];
    cache = list;
    return list;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

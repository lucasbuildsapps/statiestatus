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

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type FetchOptions =
  | boolean
  | {
      forceRefresh?: boolean;
      bounds?: Bounds | null;
    };

let cacheByKey = new Map<string, ApiLocation[]>();
let inFlightByKey = new Map<string, Promise<ApiLocation[]>>();

/**
 * Create a stable cache key for a given bounds object.
 * Bounds are quantised a bit to avoid huge key explosion.
 */
function makeKey(bounds?: Bounds | null): string {
  if (!bounds) return "ALL";
  const { north, south, east, west } = bounds;
  // round to ~0.001 degrees (~100m) for cache grouping
  const round = (n: number) => n.toFixed(3);
  return `B:${round(north)}|${round(south)}|${round(east)}|${round(west)}`;
}

/**
 * Shared client-side fetch for /api/locations.
 * - Accepts either:
 *   - boolean forceRefresh
 *   - { forceRefresh?: boolean; bounds?: Bounds }
 * - Caches per bounds key in-memory.
 * - Ensures only one real network request per key runs at a time.
 */
export async function fetchLocationsShared(
  options?: FetchOptions
): Promise<ApiLocation[]> {
  let forceRefresh = false;
  let bounds: Bounds | null | undefined = undefined;

  if (typeof options === "boolean") {
    forceRefresh = options;
  } else if (options) {
    forceRefresh = !!options.forceRefresh;
    bounds = options.bounds;
  }

  const key = makeKey(bounds ?? undefined);

  if (!forceRefresh) {
    const cached = cacheByKey.get(key);
    if (cached) return cached;

    const inFlight = inFlightByKey.get(key);
    if (inFlight) return inFlight;
  }

  const query = bounds
    ? `?n=${bounds.north}&s=${bounds.south}&e=${bounds.east}&w=${bounds.west}`
    : `?limit=500`;

  const promise = (async () => {
    const res = await fetch(`/api/locations${query}`);
    if (!res.ok) {
      throw new Error("Failed to load locations");
    }
    const data = await res.json();
    const list = Array.isArray(data.locations)
      ? (data.locations as ApiLocation[])
      : [];
    cacheByKey.set(key, list);
    return list;
  })();

  inFlightByKey.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlightByKey.delete(key);
  }
}

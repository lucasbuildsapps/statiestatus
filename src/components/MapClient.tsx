// src/components/MapClient.tsx
"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[60vh] md:h-[70vh] grid place-items-center">
      <span className="text-sm text-gray-500">Kaart laden…</span>
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}

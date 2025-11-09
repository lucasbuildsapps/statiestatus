"use client";
import dynamic from "next/dynamic";

// Load MapView only in the browser (no SSR), to avoid Leaflet using "window" on server
const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapClient() {
  return <MapView />;
}

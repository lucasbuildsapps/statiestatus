// Server Component (no "use client" here)
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">statiestatus.nl</h1>
      <p className="text-gray-700">
        Controleer of jouw statiegeldmachine werkt! En help anderen door de status te rapporteren!
      </p>
      <MapClient />
      <NearbyList />
    </main>
  );
}

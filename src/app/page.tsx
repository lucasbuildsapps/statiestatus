// app/page.tsx
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          statiestatus.nl
        </h1>
        <p className="text-gray-600 text-sm">
          Controleer of een statiegeldmachine werkt en help anderen door de status te rapporteren.
        </p>
      </header>

      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <MapClient />
      </section>

      <section className="rounded-xl border bg-white shadow-sm p-4">
        <NearbyList />
      </section>
    </main>
  );
}

// app/page.tsx
import MapClient from "../components/MapClient";
import NearbyList from "../components/NearbyList";

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">statiestatus.nl</h1>
        <p className="text-gray-600">
          Controleer of een statiegeldmachine werkt en help anderen door de status te rapporteren.
        </p>
      </header>

      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <MapClient />
      </section>

      <section className="rounded-2xl border bg-white shadow-sm p-4">
        <NearbyList />
      </section>

      <footer className="pt-4 pb-8 text-center text-xs text-gray-500">
        Gemaakt met ❤️ voor een soepel statiegeld-ritje.
      </footer>
    </main>
  );
}

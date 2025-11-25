// src/app/stats/page.tsx
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const [locationsCount, reportsCount] = await Promise.all([
    prisma.location.count(),
    prisma.report.count(),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Statistieken</h1>
      <p className="text-sm text-gray-600">
        Een paar basisstatistieken van statiestatus.nl. Gegevens zijn volledig
        community-gedreven en indicatief.
      </p>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">
            Aantal locaties op de kaart
          </div>
          <div className="text-3xl font-bold">{locationsCount}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">
            Totaal aantal meldingen
          </div>
          <div className="text-3xl font-bold">{reportsCount}</div>
        </div>
      </section>

      <section className="text-xs text-gray-500 space-y-1">
        <p>
          Meldingen worden anoniem opgeslagen en gebundeld per locatie. IP-adressen
          worden gehasht om misbruik te kunnen detecteren zonder herleidbare
          gegevens te bewaren.
        </p>
        <p>
          Deze pagina is nog in ontwikkeling – later kunnen hier ook trends per
          supermarktketen en regio komen.
        </p>
      </section>
    </main>
  );
}

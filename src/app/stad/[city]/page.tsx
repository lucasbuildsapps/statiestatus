// src/app/stad/[city]/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";
import { Status } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: { city?: string };
};

function decodeParam(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function statusLabel(s: Status | null) {
  if (s === "WORKING") return "Werkend";
  if (s === "ISSUES") return "Problemen";
  if (s === "OUT_OF_ORDER") return "Stuk";
  return "Onbekend";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawCity = decodeParam(params?.city ?? "");
  if (!rawCity) {
    return {
      title: "Statiegeldmachines per stad – statiestatus.nl",
      description:
        "Overzichtspagina voor statiegeldmachines per stad op statiestatus.nl.",
    };
  }

  const prettyCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);

  return {
    title: `Statiegeldmachines in ${prettyCity} – statiestatus.nl`,
    description: `Bekijk de status van statiegeldmachines in ${prettyCity}: recente meldingen en community-data.`,
  };
}

export default async function CityPage({ params }: Props) {
  const cityName = decodeParam(params?.city ?? "");

  // If no city param, don't query everything – just show a friendly message
  if (!cityName) {
    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-5">
        <section className="space-y-2">
          <p className="text-xs text-gray-500">
            <a href="/" className="hover:underline">
              statiestatus.nl
            </a>{" "}
            · Stad
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Geen stad opgegeven
          </h1>
          <p className="text-sm text-gray-600">
            Deze pagina toont een overzicht van statiegeldmachines in een
            specifieke stad. Gebruik de kaart of de zoekfunctie om een stad
            te kiezen.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/#kaart"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            ← Terug naar kaart
          </a>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Naar startpagina
          </a>
        </div>
      </main>
    );
  }

  const prettyCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  const locations = await prisma.location.findMany({
    where: {
      city: {
        equals: cityName,
        mode: "insensitive",
      },
    },
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const withStatus = locations.map((loc) => ({
    ...loc,
    currentStatus: deriveStatus(loc.reports),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Statiegeldmachines in ${prettyCity}`,
    url: `https://www.statiestatus.nl/stad/${encodeURIComponent(cityName)}`,
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="space-y-3">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Stad
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Statiegeldmachines in {prettyCity}
        </h1>
        <p className="text-sm text-gray-600">
          Overzicht van statiegeldmachines in {prettyCity}. Gegevens zijn
          gebaseerd op community-meldingen en zijn indicatief.
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/#kaart"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            ← Terug naar kaart
          </a>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100"
          >
            Naar startpagina
          </a>
        </div>
      </section>

      {!withStatus.length && (
        <p className="text-sm text-gray-500">
          Nog geen machines bekend in deze stad.
        </p>
      )}

      {!!withStatus.length && (
        <section className="space-y-3">
          <div className="text-xs text-gray-500">
            {withStatus.length} locaties
          </div>
          <ul className="space-y-2">
            {withStatus.map((l) => (
              <li
                key={l.id}
                className="rounded-xl border bg-white p-3 flex flex-col gap-1 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-gray-600">
                      {l.retailer} • {l.city}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {l.address}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-gray-900 text-white">
                    {statusLabel(l.currentStatus)}
                  </span>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <a
                    href={`/machine/${l.id}`}
                    className="text-[11px] text-gray-700 hover:underline"
                  >
                    Details
                  </a>
                  <a
                    href={`/?location=${encodeURIComponent(l.id)}#kaart`}
                    className="text-[11px] text-gray-500 hover:underline"
                  >
                    Op kaart
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="text-xs text-gray-500 space-y-1">
        <p>
          statiestatus.nl is een onafhankelijk community-project. Status kan
          afwijken van de werkelijkheid; check altijd ook ter plekke.
        </p>
      </section>
    </main>
  );
}

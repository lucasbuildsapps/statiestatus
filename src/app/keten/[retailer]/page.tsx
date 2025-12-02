// src/app/keten/[retailer]/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";
import { Status } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: { retailer: string };
};

function statusLabel(s: Status | null) {
  if (s === "WORKING") return "Werkend";
  if (s === "ISSUES") return "Problemen";
  if (s === "OUT_OF_ORDER") return "Stuk";
  return "Onbekend";
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const raw = params?.retailer ?? "";
  const retailerName = raw || "Onbekende keten";
  const title = `Statiegeldmachines bij ${retailerName} – statiestatus.nl`;
  const description = `Overzicht van statiegeldmachines bij ${retailerName} op basis van community-meldingen.`;

  return {
    title,
    description,
  };
}

export default async function RetailerPage({ params }: Props) {
  const raw = params?.retailer ?? "";
  const retailerName = raw || "Onbekende keten";

  const locations = await prisma.location.findMany({
    where: raw
      ? {
          retailer: {
            equals: raw,
            mode: "insensitive",
          },
        }
      : undefined,
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: {
      city: "asc",
    },
  });

  const withStatus = locations.map((loc) => ({
    ...loc,
    currentStatus: deriveStatus(loc.reports),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Statiegeldmachines bij ${retailerName}`,
    url: `https://www.statiestatus.nl/keten/${encodeURIComponent(raw)}`,
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="space-y-2">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Winkelketen
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Statiegeldmachines bij {retailerName}
        </h1>
        <p className="text-sm text-gray-600">
          Overzicht van statiegeldmachines bij {retailerName} in Nederland,
          gebaseerd op community-meldingen.
        </p>
      </section>

      {!withStatus.length && (
        <p className="text-sm text-gray-500">
          Nog geen machines bekend voor deze keten.
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
                      {l.city}
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
                    href={`/?location=${encodeURIComponent(
                      l.id
                    )}#kaart`}
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

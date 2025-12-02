// src/app/machine/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";
import { Status } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

/**
 * Very defensive loader: if anything goes wrong with Prisma,
 * we log and return null instead of crashing the whole page.
 */
async function loadLocation(id: string) {
  try {
    if (!id || typeof id !== "string") return null;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!location) return null;

    const currentStatus = deriveStatus(location.reports);

    return { location, currentStatus };
  } catch (err) {
    console.error("Error loading machine detail page:", err);
    return null;
  }
}

/**
 * Keep metadata simple & safe. We don’t hit Prisma here anymore.
 */
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const baseTitle = "Statiegeldmachine – statiestatus.nl";
  if (!params?.id) {
    return {
      title: baseTitle,
      description:
        "Detailpagina van een statiegeldmachine op statiestatus.nl.",
    };
  }

  return {
    title: baseTitle,
    description:
      "Bekijk meldingen en status van deze statiegeldmachine op statiestatus.nl.",
  };
}

function statusToLabel(status: Status | null) {
  if (status === "WORKING") return "Werkend";
  if (status === "ISSUES") return "Problemen";
  if (status === "OUT_OF_ORDER") return "Stuk";
  return "Onbekend";
}

function statusToColorClasses(status: Status | null) {
  if (status === "WORKING")
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "ISSUES")
    return "bg-amber-100 text-amber-900 border-amber-200";
  if (status === "OUT_OF_ORDER")
    return "bg-red-100 text-red-900 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function timeAgo(iso?: Date | string | null) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s geleden`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h geleden`;
  const d = Math.floor(h / 24);
  return `${d}d geleden`;
}

export default async function MachinePage({ params }: Props) {
  const data = await loadLocation(params.id);

  if (!data) {
    // If the ID is invalid or Prisma fails, show a 404 instead of crashing.
    notFound();
  }

  const { location, currentStatus } = data!;
  const { reports } = location;

  const lastReport = reports[0] ?? null;
  const workingCount = reports.filter((r) => r.status === "WORKING").length;
  const outCount = reports.filter(
    (r) => r.status === "OUT_OF_ORDER"
  ).length;
  const issuesCount = reports.filter(
    (r) => r.status === "ISSUES"
  ).length;

  const totalReports = reports.length;
  const statusLabel = statusToLabel(currentStatus);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: location.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressLocality: location.city,
      addressCountry: "NL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.lat,
      longitude: location.lng,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "retailer",
        value: location.retailer,
      },
      {
        "@type": "PropertyValue",
        name: "currentStatus",
        value: statusLabel,
      },
      {
        "@type": "PropertyValue",
        name: "totalReports",
        value: totalReports,
      },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="space-y-3">
        <p className="text-xs text-gray-500">
          <a href="/" className="hover:underline">
            statiestatus.nl
          </a>{" "}
          · Locatie detail
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {location.name}
        </h1>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">{location.retailer}</span>
            {" · "}
            {location.city}
          </p>
          <p>{location.address}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center pt-1">
          <span
            className={
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium " +
              statusToColorClasses(currentStatus)
            }
          >
            <span>Huidige inschatting:</span>
            <span>{statusLabel}</span>
          </span>
          {lastReport && (
            <span className="text-xs text-gray-500">
              Laatste melding: {timeAgo(lastReport.createdAt)}
            </span>
          )}
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Totaal aantal meldingen
          </div>
          <div className="text-2xl font-semibold">
            {totalReports || "–"}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Aantal &ldquo;Werkend&rdquo;
          </div>
          <div className="text-xl font-semibold">{workingCount}</div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Aantal &ldquo;Stuk/Problemen&rdquo;
          </div>
          <div className="text-xl font-semibold">
            {outCount + issuesCount}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Recente meldingen</h2>
        {reports.length === 0 && (
          <p className="text-xs text-gray-500">
            Er zijn nog geen meldingen voor deze machine.
          </p>
        )}
        {reports.length > 0 && (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b last:border-b-0 pb-2 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base">
                    {r.status === "WORKING"
                      ? "✅"
                      : r.status === "ISSUES"
                      ? "⚠️"
                      : "❌"}
                  </span>
                  <div>
                    <div className="font-medium text-xs">
                      {statusToLabel(r.status)}
                    </div>
                    {r.note && (
                      <div className="text-xs text-gray-700">
                        {r.note}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-gray-500">
                  {timeAgo(r.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4 space-y-3 text-sm">
        <h2 className="text-base font-semibold">Deze machine gebruiken</h2>
        <p className="text-gray-700">
          De status van deze statiegeldmachine is gebaseerd op meldingen van
          bezoekers. Check altijd zelf ter plekke of de machine werkt.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={`/?location=${encodeURIComponent(
              location.id
            )}#kaart`}
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100 text-xs"
          >
            Open op kaart
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              `${location.name}, ${location.address}, ${location.city}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100 text-xs"
          >
            Open in Google Maps
          </a>
        </div>
      </section>

      <section className="text-xs text-gray-500 space-y-1">
        <p>
          statiestatus.nl is een onafhankelijk community-project en geen
          officiële bron van supermarkten of fabrikanten.
        </p>
        <p>
          Meldingen worden anoniem opgeslagen; IP-adressen worden gehasht
          om misbruik te kunnen detecteren.
        </p>
      </section>
    </main>
  );
}

// src/app/stad/[city]/page.tsx  (server component — generates metadata)
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CityPageClient from "./_client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityName = decodeURIComponent(city);

  const count = await prisma.location.count({
    where: { city: { equals: cityName, mode: "insensitive" } },
  });

  const title = `Statiegeldmachines in ${cityName} – statiestatus.nl`;
  const description =
    count > 0
      ? `Overzicht van ${count} statiegeldmachine${count === 1 ? "" : "s"} in ${cityName}. Check de actuele status via community-meldingen.`
      : `Statiegeldmachines in ${cityName} – check de actuele status via statiestatus.nl.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function CityPage() {
  return <CityPageClient />;
}

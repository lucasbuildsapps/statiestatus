// src/app/machine/[id]/page.tsx  (server component — generates metadata)
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MachinePageClient from "./_client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const location = await prisma.location.findUnique({
    where: { id },
    select: { name: true, retailer: true, city: true },
  });

  if (!location) {
    return {
      title: "Locatie niet gevonden – statiestatus.nl",
    };
  }

  const title = `${location.name} (${location.retailer}) – statiestatus.nl`;
  const description = `Bekijk de actuele status van de statiegeldmachine bij ${location.name} in ${location.city}. Meld of de machine werkt via community-meldingen.`;

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

export default function MachinePage() {
  return <MachinePageClient />;
}

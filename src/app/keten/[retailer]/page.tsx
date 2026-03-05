// src/app/keten/[retailer]/page.tsx  (server component — generates metadata)
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RetailerPageClient from "./_client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ retailer: string }>;
}): Promise<Metadata> {
  const { retailer } = await params;
  const retailerName = decodeURIComponent(retailer);

  const count = await prisma.location.count({
    where: { retailer: { equals: retailerName, mode: "insensitive" } },
  });

  const title = `Statiegeldmachines bij ${retailerName} – statiestatus.nl`;
  const description =
    count > 0
      ? `Overzicht van ${count} statiegeldmachine${count === 1 ? "" : "s"} bij ${retailerName} in Nederland. Check de actuele status via community-meldingen.`
      : `Statiegeldmachines bij ${retailerName} – check de actuele status via statiestatus.nl.`;

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

export default function RetailerPage() {
  return <RetailerPageClient />;
}

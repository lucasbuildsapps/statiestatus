// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.statiestatus.nl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locations = await prisma.location.findMany({
    select: { id: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/stats`,
      lastModified: new Date(),
    },
  ];

  const machinePages: MetadataRoute.Sitemap = locations.map((l) => ({
    url: `${BASE_URL}/machine/${l.id}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...machinePages];
}

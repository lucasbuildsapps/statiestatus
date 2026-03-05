// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.statiestatus.nl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locations = await prisma.location.findMany({
    select: { id: true, city: true, retailer: true, createdAt: true },
  });

  const cities = [...new Set(locations.map((l) => l.city))];
  const retailers = [...new Set(locations.map((l) => l.retailer))];

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/privacy`, lastModified: new Date("2025-01-01") },
  ];

  const machinePages: MetadataRoute.Sitemap = locations.map((l) => ({
    url: `${BASE_URL}/machine/${l.id}`,
    lastModified: l.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/stad/${encodeURIComponent(city)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const retailerPages: MetadataRoute.Sitemap = retailers.map((retailer) => ({
    url: `${BASE_URL}/keten/${encodeURIComponent(retailer)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...machinePages, ...cityPages, ...retailerPages];
}

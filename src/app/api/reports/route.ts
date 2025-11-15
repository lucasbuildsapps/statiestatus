// src/app/api/locations/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type ApiLocation = {
  id: string;
  name: string;
  retailer: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  currentStatus: "WORKING" | "ISSUES" | "OUT_OF_ORDER" | null;
  lastReportAt: string | null;
  totalReports: number;
  lastReports: {
    id: string;
    status: "WORKING" | "ISSUES" | "OUT_OF_ORDER";
    note: string;
    createdAt: string;
  }[];
};

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        _count: {
          select: { reports: true },
        },
      },
    });

    const payload: ApiLocation[] = locations.map((loc) => {
      const [latest] = loc.reports;
      const lastReport = latest ?? null;

      return {
        id: loc.id,
        name: loc.name,
        retailer: loc.retailer,
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
        city: loc.city,
        currentStatus: lastReport ? lastReport.status : null,
        lastReportAt: lastReport
          ? lastReport.createdAt.toISOString()
          : null,
        totalReports: loc._count.reports,
        lastReports: loc.reports.map((r) => ({
          id: r.id,
          status: r.status,
          note: r.note ?? "",
          createdAt: r.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ locations: payload });
  } catch (err) {
    console.error("Error in /api/locations:", err);
    return NextResponse.json(
      { locations: [] as ApiLocation[], error: "Failed to load locations" },
      { status: 500 }
    );
  }
}

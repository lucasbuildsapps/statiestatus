// app/api/locations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 3 }, // last 3 reports
        _count: { select: { reports: true } },                // total reports count
      },
      orderBy: { createdAt: "desc" },
    });

    const data = locations.map((l) => ({
      id: l.id,
      name: l.name,
      retailer: l.retailer,
      lat: l.lat,
      lng: l.lng,
      address: l.address,
      city: l.city,
      currentStatus: deriveStatus(l.reports),
      lastReportAt: l.reports[0]?.createdAt ?? null,
      totalReports: l._count.reports,
      lastReports: l.reports.map((r) => ({
        id: r.id,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt,
      })),
    }));

    return NextResponse.json(
      { locations: data },
      { headers: { "Cache-Control": "s-maxage=60" } }
    );
  } catch (err) {
    console.error("GET /api/locations error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

// src/app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const nParam = searchParams.get("n");
    const sParam = searchParams.get("s");
    const eParam = searchParams.get("e");
    const wParam = searchParams.get("w");
    const limitParam = searchParams.get("limit");

    const north = nParam ? Number.parseFloat(nParam) : NaN;
    const south = sParam ? Number.parseFloat(sParam) : NaN;
    const east = eParam ? Number.parseFloat(eParam) : NaN;
    const west = wParam ? Number.parseFloat(wParam) : NaN;

    const hasBounds =
      !Number.isNaN(north) &&
      !Number.isNaN(south) &&
      !Number.isNaN(east) &&
      !Number.isNaN(west);

    // Default limit when fetching "global" set (no bounds).
    let limit: number | undefined;
    if (!hasBounds) {
      // hard cap; you can tweak this
      const parsed = limitParam ? Number.parseInt(limitParam, 10) : 500;
      limit = Math.max(1, Math.min(parsed || 500, 1000));
    }

    const where = hasBounds
      ? {
          lat: {
            gte: Math.min(south, north),
            lte: Math.max(south, north),
          },
          lng: {
            gte: Math.min(west, east),
            lte: Math.max(west, east),
          },
        }
      : undefined;

    const locations = await prisma.location.findMany({
      where,
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 3 }, // last 3 reports
        _count: { select: { reports: true } }, // total reports count
      },
      orderBy: { createdAt: "desc" },
      take: limit,
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
      {
        headers: {
          // short edge cache; lots of unique URLs due to bounds
          "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/locations error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}

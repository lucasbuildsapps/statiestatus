import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // if prisma is a default export, change this line to: import prisma from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

// Make sure this API route is *not* statically generated
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 3 }, // last 3
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
      lastReports: l.reports.map((r) => ({
        id: r.id,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt,
      })),
    }));

    // Cache at the CDN for 60s, but do not pre-render this route
    return NextResponse.json(
      { locations: data },
      { headers: { "Cache-Control": "s-maxage=60" } }
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

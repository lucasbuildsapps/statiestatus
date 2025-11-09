import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export async function GET() {
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

  return NextResponse.json(
    { locations: data },
    { headers: { "Cache-Control": "s-maxage=60" } }
  );
}

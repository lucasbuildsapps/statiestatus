// src/app/api/stad/[city]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  const cityName = decodeURIComponent((await params).city);

  try {
    const locations = await prisma.location.findMany({
      where: {
        city: {
          equals: cityName,
          mode: "insensitive",
        },
      },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (!locations.length) {
      return NextResponse.json(
        { error: `No locations found for city=${cityName}` },
        { status: 404 }
      );
    }

    const withStatus = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      retailer: loc.retailer,
      city: loc.city,
      address: loc.address,
      currentStatus: deriveStatus(loc.reports),
    }));

    return NextResponse.json({
      city: cityName,
      locations: withStatus,
    });
  } catch (e: any) {
    console.error("GET /api/stad/[city] error:", e);
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

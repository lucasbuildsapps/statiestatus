// src/app/api/keten/[retailer]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractRetailerFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean); // ["api","keten","<retailer>"]
    const last = parts[parts.length - 1];
    if (!last) return null;
    return decodeURIComponent(last);
  } catch (e) {
    console.error("extractRetailerFromUrl error:", e);
    return null;
  }
}

export async function GET(req: Request) {
  const retailerName = extractRetailerFromUrl(req.url);

  if (!retailerName) {
    return NextResponse.json(
      { error: "Missing retailer in URL." },
      { status: 400 }
    );
  }

  try {
    const locations = await prisma.location.findMany({
      where: {
        retailer: {
          equals: retailerName,
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
        city: "asc",
      },
    });

    if (!locations.length) {
      return NextResponse.json(
        { error: `No locations found for retailer=${retailerName}` },
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
      retailer: retailerName,
      locations: withStatus,
    });
  } catch (e: any) {
    console.error("GET /api/keten/[retailer] error:", e);
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

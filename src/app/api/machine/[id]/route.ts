// src/app/api/machine/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean); // ["api","machine","<id>"]
    const last = parts[parts.length - 1];
    return last || null;
  } catch (e) {
    console.error("extractIdFromUrl error:", e);
    return null;
  }
}

export async function GET(req: Request) {
  const id = extractIdFromUrl(req.url);

  if (!id) {
    return NextResponse.json(
      { error: "Missing machine ID in URL." },
      { status: 400 }
    );
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: `Location not found for id=${id}` },
        { status: 404 }
      );
    }

    const currentStatus = deriveStatus(location.reports);

    return NextResponse.json({
      location: {
        ...location,
        currentStatus,
      },
    });
  } catch (e: any) {
    console.error("GET /api/machine/[id] error:", e);
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

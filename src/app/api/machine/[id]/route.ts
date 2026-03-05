// src/app/api/machine/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/derive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  } catch (e) {
    console.error("GET /api/machine/[id] error:", e);
    return NextResponse.json(
      { error: "Interne serverfout." },
      { status: 500 }
    );
  }
}

// src/app/api/reports/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReportStatus = "WORKING" | "ISSUES" | "OUT_OF_ORDER";

type PostBody = {
  locationId?: string;
  status?: ReportStatus;
  note?: string;
};

export async function POST(req: Request) {
  try {
    // 1. Body uitlezen als JSON
    const body = (await req.json()) as PostBody;

    const locationId = body.locationId?.trim();
    const status = body.status;
    const note = body.note?.trim() || null;

    // 2. Basisvalidatie
    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId ontbreekt." },
        { status: 400 }
      );
    }

    if (!status || !["WORKING", "ISSUES", "OUT_OF_ORDER"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "status is ongeldig." },
        { status: 400 }
      );
    }

    // 3. Nieuwe melding opslaan in de database
    const report = await prisma.report.create({
      data: {
        locationId,
        status,
        note,
      },
    });

    // 4. Succes-response voor de frontend
    return NextResponse.json(
      { ok: true, reportId: report.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in POST /api/reports:", err);
    return NextResponse.json(
      { ok: false, error: "Interne serverfout." },
      { status: 500 }
    );
  }
}

// Optioneel: eenvoudige GET zodat je geen 405 krijgt als je eens via de browser kijkt
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Gebruik POST om een melding aan te maken.",
  });
}

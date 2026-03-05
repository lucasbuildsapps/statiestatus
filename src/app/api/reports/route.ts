// src/app/api/reports/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ipHash } from "@/lib/ip";
import { canSubmit, sanitizeNote } from "@/lib/antiSpam";

const postSchema = z.object({
  locationId: z.string().min(1),
  status: z.enum(["WORKING", "ISSUES", "OUT_OF_ORDER"]),
  note: z.string().max(280).optional().default(""),
});

export async function POST(req: Request) {
  try {
    // 1. Body uitlezen en valideren
    const parsed = postSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." },
        { status: 400 }
      );
    }

    const { locationId, status } = parsed.data;
    const note = sanitizeNote(parsed.data.note);

    // 2. IP bepalen en hashen (voor anti-spam / statistiek)
    const xff = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";
    const rawIp =
      xff.split(",")[0].trim() || realIp || "unknown"; // eerste IP uit de x-forwarded-for chain
    const secret = process.env.IP_HASH_SECRET ?? "default-secret";
    const hashedIp = ipHash(rawIp, secret);

    // 3. Rate limiting
    const rateCheck = canSubmit(hashedIp);
    if (!rateCheck.ok) {
      return NextResponse.json(
        { ok: false, error: "Te veel meldingen. Probeer het later opnieuw.", retryAfter: rateCheck.retryAfter },
        { status: 429 }
      );
    }

    // 4. Nieuwe melding opslaan in de database
    const report = await prisma.report.create({
      data: {
        locationId,
        status,
        note,
        ipHash: hashedIp, // verplicht veld in je Prisma-model
      },
    });

    // 5. Succes-response voor de frontend
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

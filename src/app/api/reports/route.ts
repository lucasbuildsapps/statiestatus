import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ipHash } from "@/lib/ip";
import { canSubmit, sanitizeNote } from "@/lib/antiSpam";

const Body = z.object({
  locationId: z.string().cuid(),
  status: z.enum(["WORKING", "ISSUES", "OUT_OF_ORDER"]),
  note: z.string().max(280).optional().default("")
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const ipKey = ipHash(ip, process.env.IP_HASH_SECRET || "changeme");
  const ok = canSubmit(ipKey);
  if (!ok.ok) return NextResponse.json({ error: `Rate limited. Retry in ${ok.retryAfter}s` }, { status: 429 });

  const { locationId, status, note } = parsed.data;
  const loc = await prisma.location.findUnique({ where: { id: locationId } });
  if (!loc) return NextResponse.json({ error: "Unknown location" }, { status: 404 });

  const created = await prisma.report.create({
    data: { locationId, status, note: sanitizeNote(note), ipHash: ipKey }
  });

  return NextResponse.json({ ok: true, id: created.id });
}

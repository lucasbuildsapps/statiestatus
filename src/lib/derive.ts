import { Report, Status } from "@prisma/client";

export function deriveStatus(reports: Report[]): Status | null {
  if (!reports.length) return null;
  const cutoff = Date.now() - 48 * 3600 * 1000;
  const weights: Record<Status, number> = { WORKING: 0, ISSUES: 0, OUT_OF_ORDER: 0 };
  for (const r of reports) {
    const t = new Date(r.createdAt).getTime();
    const ageH = Math.max(1, (Date.now() - t) / 3600000);
    const w = t >= cutoff ? 2 / ageH : 1 / ageH;
    weights[r.status] += w;
  }
  return Object.entries(weights).sort((a,b) => b[1]-a[1])[0][0] as Status;
}

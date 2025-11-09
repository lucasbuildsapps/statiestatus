const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 300);
const MAX = Number(process.env.RATE_LIMIT_MAX || 3);

const hits = new Map<string, { count: number; resetAt: number }>();

export function canSubmit(ipKey: string) {
  const now = Date.now();
  const rec = hits.get(ipKey);
  if (!rec || now > rec.resetAt) {
    hits.set(ipKey, { count: 1, resetAt: now + WINDOW * 1000 });
    return { ok: true };
  }
  if (rec.count >= MAX) return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  rec.count += 1;
  hits.set(ipKey, rec);
  return { ok: true };
}

const banned = ["fuck", "kanker", "idioot"];
export function sanitizeNote(note: string) {
  let n = note.trim();
  if (n.length > 280) n = n.slice(0, 280);
  for (const w of banned) n = n.replace(new RegExp(w, "gi"), "***");
  return n;
}

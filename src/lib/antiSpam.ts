// Note: canSubmit() (in-memory rate limiter) has been removed.
// Rate limiting is now handled persistently via the DB in the reports API route.

const banned = [
  // English
  "fuck", "shit", "asshole", "bitch",
  // Dutch
  "kanker", "idioot", "godverdomme", "godver", "tering",
  "tyfus", "klootzak", "kankerd", "debiel", "mongool",
  "eikel", "klote", "kut", "hoer", "flikker", "slet", "lul",
];

export function sanitizeNote(note: string) {
  let n = note.trim();
  if (n.length > 280) n = n.slice(0, 280);
  for (const w of banned) {
    n = n.replace(new RegExp(`\\b${w}\\b`, "gi"), "***");
  }
  return n;
}

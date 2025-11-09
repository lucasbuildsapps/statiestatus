import crypto from "crypto";
export function ipHash(ip: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

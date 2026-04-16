/**
 * Node-runtime dashboard auth — uses `node:crypto`, only imported from
 * API routes (server). Tokens are interoperable with the edge middleware
 * verifier in `dashboard-auth.ts`.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const TOKEN_VERSION = "v1";

function getSecret(): string {
  const secret = process.env.DASHBOARD_PASSWORD || "";
  return secret ? `${secret}|pacame-dashboard-${TOKEN_VERSION}` : "build-placeholder";
}

export function signDashboardToken(): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(8).toString("hex");
  const payload = `${ts}.${nonce}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyDashboardTokenNode(token: string | undefined): boolean {
  if (!token) return false;
  if (!process.env.DASHBOARD_PASSWORD) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  if (!ts || !nonce || !sig) return false;

  const expected = createHmac("sha256", getSecret()).update(`${ts}.${nonce}`).digest("hex");
  if (sig.length !== expected.length) return false;

  try {
    const ok = timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
    if (!ok) return false;
  } catch {
    return false;
  }

  const issued = parseInt(ts, 10);
  if (!Number.isFinite(issued)) return false;
  const age = Math.floor(Date.now() / 1000) - issued;
  if (age < 0 || age > TOKEN_TTL_SECONDS) return false;

  return true;
}

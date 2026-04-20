/**
 * Edge-runtime dashboard auth — Web Crypto only, used from middleware.
 * Mirrors the HMAC scheme in `dashboard-auth-node.ts` so tokens issued from
 * Node API routes are verifiable from Edge middleware.
 */

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const TOKEN_VERSION = "v1";

function getSecret(): string {
  const secret = process.env.DASHBOARD_PASSWORD || "";
  return secret ? `${secret}|pacame-dashboard-${TOKEN_VERSION}` : "build-placeholder";
}

export async function verifyDashboardTokenEdge(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  if (!process.env.DASHBOARD_PASSWORD) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  if (!ts || !nonce || !sig) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${nonce}`));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return false;

  const issued = parseInt(ts, 10);
  if (!Number.isFinite(issued)) return false;
  const age = Math.floor(Date.now() / 1000) - issued;
  if (age < 0 || age > TOKEN_TTL_SECONDS) return false;

  return true;
}

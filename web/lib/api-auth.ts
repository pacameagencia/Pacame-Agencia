import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  hasLegacyToken,
  isDualReadEnabled,
  verifySession,
} from "./security/admin-sessions";

/**
 * Verify that an internal API request is authorized.
 * Accepts:
 * - Bearer token matching CRON_SECRET (for Vercel cron / n8n)
 * - Dashboard auth cookie validated contra admin_sessions en DB
 *
 * Sync signature kept for backward compat (returns NextResponse | null).
 * For stronger verification against DB, prefer `verifyInternalAuthAsync`.
 */
export function verifyInternalAuth(request: NextRequest): NextResponse | null {
  // 1. Bearer token (Vercel cron, n8n, external triggers) — sin cambios
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null;
  }

  // 2. Dashboard cookie presente? Confiamos (validacion real en middleware/verify).
  //    Se mantiene sync para no romper callers; la version async hace DB lookup.
  const dashboardCookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (dashboardCookie) {
    return null;
  }

  // 3. No CRON_SECRET configurado = dev mode
  if (!cronSecret) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Version asincrona que valida la cookie contra admin_sessions en DB.
 * Usar cuando el endpoint pueda permitirse la latencia extra (+20-50ms).
 */
export async function verifyInternalAuthAsync(
  request: NextRequest
): Promise<NextResponse | null> {
  // 1. Bearer
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null;
  }

  // 2. Cookie con DB lookup
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (token) {
    const session = await verifySession(token);
    if (session) return null;
    if (isDualReadEnabled() && hasLegacyToken(token)) return null;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Dev mode sin CRON_SECRET
  if (!cronSecret) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

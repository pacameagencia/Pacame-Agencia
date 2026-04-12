import { NextRequest, NextResponse } from "next/server";

/**
 * Verify that an internal API request is authorized.
 * Accepts:
 * - Bearer token matching CRON_SECRET (for Vercel cron / n8n)
 * - Dashboard auth cookie (for calls from the dashboard)
 */
export function verifyInternalAuth(request: NextRequest): NextResponse | null {
  // 1. Check Bearer token (Vercel cron, n8n, external triggers)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null; // authorized
  }

  // 2. Check dashboard cookie (calls from the dashboard UI)
  const dashboardCookie = request.cookies.get("pacame_auth")?.value;
  if (dashboardCookie) {
    return null; // authorized (cookie validity checked by middleware)
  }

  // 3. No CRON_SECRET configured = dev mode, allow through
  if (!cronSecret) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardTokenNode } from "@/lib/dashboard-auth-node";

/**
 * Verify that an internal API request is authorized.
 * Accepts:
 * - Bearer token matching CRON_SECRET (for Vercel cron / n8n)
 * - Dashboard auth cookie with valid HMAC signature (dashboard UI)
 */
export function verifyInternalAuth(request: NextRequest): NextResponse | null {
  // 1. Check Bearer token (Vercel cron, n8n, external triggers)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null; // authorized
  }

  // 2. Check signed dashboard cookie (calls from the dashboard UI)
  const dashboardCookie = request.cookies.get("pacame_auth")?.value;
  if (verifyDashboardTokenNode(dashboardCookie)) {
    return null; // authorized with valid signature
  }

  // 3. No CRON_SECRET configured = dev mode, allow through
  // (Prod always has CRON_SECRET, so this only matches local dev.)
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

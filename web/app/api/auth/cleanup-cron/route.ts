import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { cleanupExpiredSessions } from "@/lib/security/admin-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/cleanup-cron
 * Cron semanal — borra sesiones revocadas o expiradas hace >30 dias.
 * Protegido por CRON_SECRET via verifyInternalAuth.
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const result = await cleanupExpiredSessions();
  return NextResponse.json({ ok: true, deleted: result.deleted });
}

export const POST = GET;

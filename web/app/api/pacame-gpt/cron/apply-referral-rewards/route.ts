/**
 * GET /api/pacame-gpt/cron/apply-referral-rewards
 *
 * Cron diario (recomendado: 1x/día a las 04:00 Madrid).
 * Aplica +30 días al current_period_end del referrer por cada referido que
 * ha pagado y aún no ha cobrado recompensa. Idempotente.
 *
 * Auth: header `x-cron-secret` con CRON_SECRET (igual que send-reminders).
 */

import { NextRequest, NextResponse } from "next/server";
import { applyPendingRewards } from "@/lib/lucia/referral-rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await applyPendingRewards();
  return NextResponse.json({ ok: true, ...result });
}

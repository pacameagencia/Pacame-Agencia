/**
 * GET /api/pacame-gpt/cron/drip?kind=trial_day_12|trial_day_14
 *
 * Cron diario (recomendado 1x/día a las 10:00 Madrid).
 * Llamar 2 veces seguidas, una por kind, o dejar `kind=all` para correr ambos.
 *
 * Auth: header x-cron-secret = CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { runDrip, type DripKind } from "@/lib/lucia/drip-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VALID_KINDS: DripKind[] = ["trial_day_12", "trial_day_14"];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const kindParam = req.nextUrl.searchParams.get("kind") || "all";
  const kinds: DripKind[] =
    kindParam === "all"
      ? VALID_KINDS
      : VALID_KINDS.includes(kindParam as DripKind)
        ? [kindParam as DripKind]
        : [];

  if (kinds.length === 0) {
    return NextResponse.json(
      { error: "invalid_kind", valid: VALID_KINDS },
      { status: 400 }
    );
  }

  const results: Record<string, unknown> = {};
  for (const k of kinds) {
    results[k] = await runDrip(k);
  }
  return NextResponse.json({ ok: true, results });
}

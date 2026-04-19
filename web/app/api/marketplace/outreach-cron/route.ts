import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getNicheForToday, getNicheBySlug } from "@/lib/outreach/niches";
import { runOutreachCampaign } from "@/lib/outreach/engine";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/marketplace/outreach-cron
 * Cron diario 10:00 UTC. Scrapea nicho rotativo, envia cold emails.
 *
 * Params:
 *   - niche=slug (optional): overridea el nicho del dia (util para testing)
 *   - count=N (optional): overridea target_count (default 5)
 *   - dry=true/false (optional): overridea OUTREACH_DRY_RUN
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const url = request.nextUrl;
  const forcedSlug = url.searchParams.get("niche");
  const countParam = url.searchParams.get("count");
  const dryParam = url.searchParams.get("dry");

  const niche = forcedSlug ? getNicheBySlug(forcedSlug) : getNicheForToday();
  if (!niche) {
    return NextResponse.json({ error: `Niche ${forcedSlug} not found` }, { status: 404 });
  }

  const targetCount = countParam ? Math.max(1, Math.min(20, parseInt(countParam, 10))) : 5;
  const dryRun =
    dryParam === "true" ? true : dryParam === "false" ? false : undefined;

  const log = getLogger();
  log.info({ niche: niche.slug, targetCount, dryRun }, "outreach-cron start");

  try {
    const result = await runOutreachCampaign({ niche, dryRun, targetCount });
    log.info({ ...result, niche: niche.slug }, "outreach-cron complete");
    return NextResponse.json({
      ok: true,
      niche: niche.slug,
      label: niche.label,
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ err, niche: niche.slug }, "outreach-cron failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

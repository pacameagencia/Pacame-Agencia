import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { generateDailyPlan } from "@/lib/brain/strategist";
import { getLogger } from "@/lib/observability/logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/marketplace/brain-cron
 *
 * Cron diario 07:00 UTC. Es el "cerebro" que piensa el dia:
 *   1. DIOS genera plan del dia + N proposals (brain_daily_plans + agent_proposals)
 *   2. Auto-approve proposals con confidence > 0.8 + effort=trivial
 *   3. Mark proposals expired
 *
 * Opcional ?force=true para generar plan aunque ya exista hoy.
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const log = getLogger();
  const supabase = createServerSupabase();

  try {
    // 1. Expirar proposals > 7 dias
    const expireCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: expiredCount } = await supabase
      .from("agent_proposals")
      .update({ status: "expired" }, { count: "exact" })
      .eq("status", "pending")
      .lt("created_at", expireCutoff);

    // 2. Generar plan del dia (skip si ya existe)
    const { planId, proposalIds, cost } = await generateDailyPlan();

    // 3. Auto-approve proposals alta confianza + low effort
    let autoApproved = 0;
    if (proposalIds.length > 0) {
      const { data: updated } = await supabase
        .from("agent_proposals")
        .update({
          status: "auto_approved",
          approved_by: "brain_auto",
          approved_at: new Date().toISOString(),
        })
        .in("id", proposalIds)
        .gte("confidence", 0.8)
        .eq("effort_estimate", "trivial")
        .select("id");
      autoApproved = updated?.length || 0;
    }

    log.info(
      { planId, proposalsCount: proposalIds.length, autoApproved, expiredCount, cost },
      "brain-cron complete"
    );

    return NextResponse.json({
      ok: true,
      plan_id: planId,
      proposals_created: proposalIds.length,
      auto_approved: autoApproved,
      expired: expiredCount || 0,
      cost_usd: cost,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ err }, "brain-cron failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

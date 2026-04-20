import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/growth
 *
 * Devuelve snapshot agregado para /dashboard/growth:
 *  - lifecycle_funnel: stats por email_type (ultimos 30d) + conversion open/click
 *  - nps: score global + breakdown + trend 8w
 *  - nps_recent: ultimas 10 respuestas con feedback
 *  - referrals_top: top 10 referrers
 *  - detractors_unaddressed: detractores ultimos 30d sin contacto todavia
 */

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const log = getLogger();

  try {
    const [lifecycle, nps, npsRecent, referralsTop, detractors, npsTrend] = await Promise.all([
      supabase.from("v_lifecycle_funnel_30d").select("*"),
      supabase.from("v_nps_score_30d").select("*").maybeSingle(),
      supabase
        .from("nps_surveys")
        .select("id, score, category, feedback, submitted_at, client_email_snapshot, client_id")
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(10),
      supabase.from("v_referrals_top").select("*").limit(10),
      supabase
        .from("nps_surveys")
        .select("id, score, feedback, submitted_at, client_email_snapshot, client_id, followup_sent")
        .eq("category", "detractor")
        .eq("followup_sent", false)
        .not("submitted_at", "is", null)
        .gt("submitted_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
        .order("submitted_at", { ascending: false }),
      // Trend semanal ultimas 8 semanas
      supabase.rpc("nps_weekly_trend", { weeks: 8 }).then(
        (r) => r,
        () => ({ data: null, error: null })
      ),
    ]);

    return NextResponse.json({
      ok: true,
      updated_at: new Date().toISOString(),
      lifecycle_funnel: lifecycle.data || [],
      nps: nps.data || null,
      nps_recent: npsRecent.data || [],
      nps_trend: npsTrend.data || [],
      referrals_top: referralsTop.data || [],
      detractors_unaddressed: detractors.data || [],
    });
  } catch (err) {
    log.error({ err }, "[dashboard-growth] query fallo");
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

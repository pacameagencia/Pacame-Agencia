import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/outreach — KPIs + campanas + leads recientes.
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();

  // 30d window
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // Campaigns (ultimas 50)
  const { data: campaigns } = await supabase
    .from("outreach_campaigns")
    .select(
      "id, niche_slug, niche_label, status, target_count, scraped_count, enriched_count, sent_count, replied_count, converted_count, dry_run, scheduled_for, started_at, completed_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Lead stats agregados
  const { data: leadStats } = await supabase
    .from("outreach_leads")
    .select("status", { count: "exact" });

  // Breakdown por status (via query manual — Supabase no tiene group by)
  const { data: statusBreakdown } = await supabase
    .rpc("count_outreach_leads_by_status")
    .then(
      (r) => r,
      () => ({ data: null })
    );

  // Fallback si el RPC no existe: do it in JS
  let byStatus: Record<string, number> = {};
  if (Array.isArray(statusBreakdown)) {
    byStatus = Object.fromEntries(
      (statusBreakdown as Array<{ status: string; count: number }>).map((r) => [r.status, r.count])
    );
  } else {
    const { data: rawLeads } = await supabase
      .from("outreach_leads")
      .select("status")
      .gte("created_at", thirtyDaysAgo);
    for (const l of rawLeads || []) {
      const s = (l.status as string) || "discovered";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }
  }

  // Top nichos por conversion
  const { data: nicheLeads } = await supabase
    .from("outreach_leads")
    .select("niche_slug, status");
  const nicheStats: Record<string, { total: number; emailed: number; replied: number; converted: number }> = {};
  for (const l of nicheLeads || []) {
    const n = l.niche_slug as string;
    if (!nicheStats[n]) nicheStats[n] = { total: 0, emailed: 0, replied: 0, converted: 0 };
    nicheStats[n].total++;
    const s = l.status as string;
    if (s === "emailed" || s === "replied" || s === "interested" || s === "converted") nicheStats[n].emailed++;
    if (s === "replied" || s === "interested" || s === "converted") nicheStats[n].replied++;
    if (s === "converted") nicheStats[n].converted++;
  }

  // Leads recientes con detalle
  const { data: recentLeads } = await supabase
    .from("outreach_leads")
    .select("id, business_name, email, niche_slug, status, last_touched_at, touch_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Touches ultimos 7 dias (para chart)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: recentTouches } = await supabase
    .from("outreach_touches")
    .select("touch_number, sent_at, opened_at, replied_at, bounced_at")
    .gte("sent_at", sevenDaysAgo)
    .order("sent_at", { ascending: false });

  return NextResponse.json({
    summary: {
      total_leads: (leadStats as unknown as { count?: number })?.count || (recentLeads?.length || 0),
      total_campaigns: campaigns?.length || 0,
      by_status: byStatus,
      active_campaigns: (campaigns || []).filter((c) =>
        ["pending", "scraping", "enriching", "sending"].includes(c.status as string)
      ).length,
    },
    campaigns: campaigns || [],
    niche_stats: nicheStats,
    recent_leads: recentLeads || [],
    touches_7d: recentTouches || [],
  });
}

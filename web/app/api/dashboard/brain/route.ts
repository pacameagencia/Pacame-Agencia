/**
 * GET /api/dashboard/brain
 *
 * Payload agregado para la pantalla "Cerebro":
 *  - propuestas pendientes + recientes
 *  - experimentos en curso
 *  - stats de canal (7d)
 *  - cola linkedin manual
 *  - plan del dia
 *  - resumen / totales
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface ChannelStatRow {
  channel: string;
  niche_slug: string | null;
  sent_count: number | null;
  replied_count: number | null;
  converted_count: number | null;
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const startOfDay = new Date(`${todayIso}T00:00:00.000Z`).toISOString();

  // 1. Propuestas pendientes
  const { data: proposalsPending } = await supabase
    .from("agent_proposals")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // 2. Propuestas recientes procesadas
  const { data: proposalsRecent } = await supabase
    .from("agent_proposals")
    .select("*")
    .in("status", ["executed", "approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(10);

  // 3. Experimentos en curso
  const { data: experimentsRunning } = await supabase
    .from("growth_experiments")
    .select("*")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(50);

  // 4. Channel stats — agregados 7d por canal
  const { data: channelRows } = await supabase
    .from("channel_stats")
    .select("channel, niche_slug, sent_count, replied_count, converted_count")
    .gte("window_start", sevenDaysAgo);

  const statsByChannel: Record<
    string,
    { sent: number; replied: number; converted: number; reply_rate: number }
  > = {};
  const statsByNicheChannel: Record<
    string,
    { sent: number; replied: number; converted: number; reply_rate: number }
  > = {};
  let totalSends7d = 0;

  for (const row of (channelRows || []) as ChannelStatRow[]) {
    const sent = row.sent_count || 0;
    const replied = row.replied_count || 0;
    const converted = row.converted_count || 0;
    totalSends7d += sent;

    const ch = row.channel;
    statsByChannel[ch] ??= { sent: 0, replied: 0, converted: 0, reply_rate: 0 };
    statsByChannel[ch].sent += sent;
    statsByChannel[ch].replied += replied;
    statsByChannel[ch].converted += converted;

    if (row.niche_slug) {
      const key = `${row.niche_slug}__${ch}`;
      statsByNicheChannel[key] ??= { sent: 0, replied: 0, converted: 0, reply_rate: 0 };
      statsByNicheChannel[key].sent += sent;
      statsByNicheChannel[key].replied += replied;
      statsByNicheChannel[key].converted += converted;
    }
  }
  for (const k of Object.keys(statsByChannel)) {
    const s = statsByChannel[k];
    s.reply_rate = s.sent > 0 ? +(s.replied / s.sent).toFixed(4) : 0;
  }
  for (const k of Object.keys(statsByNicheChannel)) {
    const s = statsByNicheChannel[k];
    s.reply_rate = s.sent > 0 ? +(s.replied / s.sent).toFixed(4) : 0;
  }

  // 5. LinkedIn queue pendiente
  const { data: linkedinQueue } = await supabase
    .from("linkedin_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  // 6. Plan del dia
  const { data: todayPlan } = await supabase
    .from("brain_daily_plans")
    .select("*")
    .eq("plan_date", todayIso)
    .maybeSingle();

  // 7. Resumen
  const { count: proposalsTodayCount } = await supabase
    .from("agent_proposals")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay);

  return NextResponse.json({
    proposals_pending: proposalsPending || [],
    proposals_recent: proposalsRecent || [],
    experiments_running: experimentsRunning || [],
    channel_stats: {
      by_channel: statsByChannel,
      by_niche_channel: statsByNicheChannel,
    },
    linkedin_queue_pending: linkedinQueue || [],
    today_plan: todayPlan || null,
    summary: {
      proposals_today: proposalsTodayCount || 0,
      proposals_pending_count: (proposalsPending || []).length,
      experiments_active: (experimentsRunning || []).length,
      linkedin_queue_count: (linkedinQueue || []).length,
      total_channel_sends_7d: totalSends7d,
    },
  });
}

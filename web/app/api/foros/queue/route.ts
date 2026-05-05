/**
 * GET /api/foros/queue
 *
 * Devuelve oportunidades con borradores generados, ordenadas por score desc.
 * Usado por dashboard /dashboard/foros.
 *
 * Query params (opcionales):
 *   limit (default 20, max 100)
 *   platform (reddit|forobeta|twitter|indiehackers|quora)
 *   intent (intent específico)
 *   min_score (default 0)
 *   status (default 'generated' · also: pending/approved/published/skipped)
 *
 * Auth: verifyInternalAuth (Pablo desde dashboard usa misma key).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

interface OpportunityWithDrafts {
  id: string;
  platform: string;
  source_key: string;
  thread_url: string;
  thread_title: string;
  thread_body: string;
  author_username: string;
  posted_at: string | null;
  intent: string;
  score: number;
  reach_proxy: number;
  competition_count: number;
  status: string;
  scraped_at: string;
  drafts: Array<{
    id: string;
    style: string;
    draft_body: string;
    edited_body: string | null;
    status: string;
    upvotes: number | null;
    leads_attributed: number;
  }>;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "20", 10));
  const platform = url.searchParams.get("platform") || null;
  const intent = url.searchParams.get("intent") || null;
  const minScore = parseInt(url.searchParams.get("min_score") ?? "0", 10);
  const status = url.searchParams.get("status") || "generated";

  const supabase = createServerSupabase();

  let q = supabase
    .from("foros_opportunities")
    .select("id, platform, source_key, thread_url, thread_title, thread_body, author_username, posted_at, intent, score, reach_proxy, competition_count, status, scraped_at")
    .eq("status", status)
    .gte("score", minScore)
    .order("score", { ascending: false })
    .limit(limit);

  if (platform) q = q.eq("platform", platform);
  if (intent) q = q.eq("intent", intent);

  const { data: opps, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!opps || opps.length === 0) {
    return NextResponse.json({ ok: true, count: 0, items: [] });
  }

  // Cargar borradores de las opps
  const oppIds = opps.map((o: { id: string }) => o.id);
  const { data: respsRaw } = await supabase
    .from("foros_responses")
    .select("id, opportunity_id, style, draft_body, edited_body, status, upvotes, leads_attributed")
    .in("opportunity_id", oppIds)
    .order("created_at", { ascending: true });

  const respsByOpp = new Map<string, OpportunityWithDrafts["drafts"]>();
  for (const r of respsRaw ?? []) {
    const row = r as {
      id: string; opportunity_id: string; style: string; draft_body: string;
      edited_body: string | null; status: string; upvotes: number | null; leads_attributed: number;
    };
    if (!respsByOpp.has(row.opportunity_id)) respsByOpp.set(row.opportunity_id, []);
    respsByOpp.get(row.opportunity_id)!.push({
      id: row.id,
      style: row.style,
      draft_body: row.draft_body,
      edited_body: row.edited_body,
      status: row.status,
      upvotes: row.upvotes,
      leads_attributed: row.leads_attributed,
    });
  }

  const items: OpportunityWithDrafts[] = opps.map((o) => {
    const opp = o as Omit<OpportunityWithDrafts, "drafts">;
    return { ...opp, drafts: respsByOpp.get(opp.id) ?? [] };
  });

  return NextResponse.json({ ok: true, count: items.length, items });
}

/**
 * POST /api/foros/queue/[id]/mark-published
 *
 * Pablo marca un borrador como publicado tras pegarlo manualmente en el thread.
 * Body: { response_id: uuid, edited_body?: string }
 *
 * - Marca foros_responses.status='published' + published_at=now
 * - Si edited_body presente, guarda en edited_body
 * - Marca foros_opportunities.status='published'
 * - Incrementa foros_subreddit_caps del día (rate limit cap 3/día)
 *
 * Auth: verifyInternalAuth.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const { id: opportunityId } = await ctx.params;
  let body: { response_id?: string; edited_body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const responseId = (body.response_id ?? "").trim();
  if (!responseId) return NextResponse.json({ error: "response_id required" }, { status: 400 });

  const supabase = createServerSupabase();
  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  // Update response
  const updates: Record<string, unknown> = {
    status: "published",
    published_at: now,
    updated_at: now,
  };
  if (body.edited_body) updates.edited_body = body.edited_body.slice(0, 8000);

  const { error: respErr } = await supabase
    .from("foros_responses")
    .update(updates)
    .eq("id", responseId)
    .eq("opportunity_id", opportunityId);
  if (respErr) return NextResponse.json({ error: respErr.message }, { status: 500 });

  // Mark opportunity published
  await supabase
    .from("foros_opportunities")
    .update({ status: "published" })
    .eq("id", opportunityId);

  // Increment subreddit cap del día
  const { data: oppRaw } = await supabase
    .from("foros_opportunities")
    .select("platform, source_key")
    .eq("id", opportunityId)
    .maybeSingle();
  if (oppRaw) {
    const opp = oppRaw as { platform: string; source_key: string };
    const { data: existing } = await supabase
      .from("foros_subreddit_caps")
      .select("id, posts_today")
      .eq("platform", opp.platform)
      .eq("source_key", opp.source_key)
      .eq("date", today)
      .maybeSingle();
    if (existing) {
      const row = existing as { id: string; posts_today: number };
      await supabase
        .from("foros_subreddit_caps")
        .update({ posts_today: row.posts_today + 1 })
        .eq("id", row.id);
    } else {
      await supabase.from("foros_subreddit_caps").insert({
        platform: opp.platform,
        source_key: opp.source_key,
        date: today,
        posts_today: 1,
      });
    }
  }

  return NextResponse.json({ ok: true, opportunity_id: opportunityId, response_id: responseId });
}

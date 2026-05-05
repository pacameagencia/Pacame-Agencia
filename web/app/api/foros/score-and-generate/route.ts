/**
 * GET /api/foros/score-and-generate
 *
 * Cerebro · post-scrape (cada 4h, 30min después). Para cada opportunity
 * status='pending':
 *   1. Clasifica intent (heurística + LLM fallback economy)
 *   2. Score 0-100 (6 dimensiones)
 *   3. Si score >= MIN_SCORE_GENERATE (60) → genera 3 borradores (Haiku)
 *   4. Status: 'generated' (con borradores) | 'skipped' (intent no_relevante o score bajo)
 *
 * Auth: verifyInternalAuth.
 * Query: ?dry-run=true · ?max=N (default 30) · ?min-score=N (default 60)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { classifyIntent, type ForoIntent } from "@/lib/foros/intent";
import { scoreOpportunity } from "@/lib/foros/scorer";
import { generateDrafts } from "@/lib/foros/generator";

export const runtime = "nodejs";
export const maxDuration = 300;

interface OpportunityRow {
  id: string;
  platform: string;
  source_key: string;
  thread_url: string;
  thread_title: string;
  thread_body: string;
  author_username: string;
  author_authority: number;
  posted_at: string | null;
  reach_proxy: number;
  competition_count: number;
}

const MIN_SCORE_GENERATE_DEFAULT = 60;
const MAX_DEFAULT = 30;

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry-run") === "true";
  const max = Math.min(100, parseInt(url.searchParams.get("max") ?? `${MAX_DEFAULT}`, 10));
  const minScore = Math.max(0, parseInt(url.searchParams.get("min-score") ?? `${MIN_SCORE_GENERATE_DEFAULT}`, 10));

  const log = getLogger();
  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // Cargar opportunities pending
  const { data: oppsRaw, error } = await supabase
    .from("foros_opportunities")
    .select("id, platform, source_key, thread_url, thread_title, thread_body, author_username, author_authority, posted_at, reach_proxy, competition_count")
    .eq("status", "pending")
    .order("scraped_at", { ascending: true })
    .limit(max);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const opps = (oppsRaw ?? []) as OpportunityRow[];
  if (opps.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, generated: 0, skipped: 0, duration_ms: Date.now() - startedAt });
  }

  // Cargar autor blacklist para skip
  const { data: blacklistRaw } = await supabase
    .from("foros_authors_blacklist")
    .select("platform, username");
  const blacklist = new Set(
    (blacklistRaw ?? []).map((b: { platform: string; username: string }) => `${b.platform}:${b.username}`)
  );

  let generated = 0;
  let skipped = 0;
  let blacklisted = 0;
  const detail: Array<{ id: string; intent: ForoIntent; score: number; action: string }> = [];

  for (const opp of opps) {
    // Skip blacklist
    if (blacklist.has(`${opp.platform}:${opp.author_username}`)) {
      blacklisted++;
      if (!dryRun) {
        await supabase.from("foros_opportunities")
          .update({ status: "blacklisted" }).eq("id", opp.id);
      }
      detail.push({ id: opp.id, intent: "no_relevante", score: 0, action: "blacklisted_author" });
      continue;
    }

    // Classify intent
    const text = `${opp.thread_title}\n\n${opp.thread_body}`.trim();
    const intent = await classifyIntent(text);

    // Si no_relevante → skip directo
    if (intent.intent === "no_relevante") {
      skipped++;
      if (!dryRun) {
        await supabase.from("foros_opportunities")
          .update({ status: "skipped", intent: "no_relevante", intent_confidence: intent.confidence })
          .eq("id", opp.id);
      }
      detail.push({ id: opp.id, intent: intent.intent, score: 0, action: "skipped_irrelevant" });
      continue;
    }

    // Score
    const { score } = scoreOpportunity({
      intent: intent.intent,
      intent_confidence: intent.confidence,
      author_authority: opp.author_authority,
      posted_at: opp.posted_at,
      reach_proxy: opp.reach_proxy,
      competition_count: opp.competition_count,
    });

    if (score < minScore) {
      skipped++;
      if (!dryRun) {
        await supabase.from("foros_opportunities")
          .update({
            status: "skipped",
            intent: intent.intent,
            intent_confidence: intent.confidence,
            score,
          })
          .eq("id", opp.id);
      }
      detail.push({ id: opp.id, intent: intent.intent, score, action: `skipped_low_score (${score})` });
      continue;
    }

    if (dryRun) {
      generated++;
      detail.push({ id: opp.id, intent: intent.intent, score, action: `dry-run: would generate (score=${score})` });
      continue;
    }

    // Generar 3 borradores
    let drafts: { style: string; body: string }[] = [];
    try {
      drafts = await generateDrafts({
        intent: intent.intent,
        thread_title: opp.thread_title,
        thread_body: opp.thread_body,
        platform: opp.platform,
      });
    } catch (err) {
      log.warn({ id: opp.id, err: err instanceof Error ? err.message : String(err) }, "[foros-cerebro] generate failed");
    }

    if (drafts.length === 0) {
      skipped++;
      detail.push({ id: opp.id, intent: intent.intent, score, action: "skipped_generation_failed" });
      continue;
    }

    // Update opportunity status + insert drafts
    await supabase.from("foros_opportunities")
      .update({
        status: "generated",
        intent: intent.intent,
        intent_confidence: intent.confidence,
        score,
      })
      .eq("id", opp.id);

    const utmContent = opp.id.slice(0, 12);
    for (const d of drafts) {
      await supabase.from("foros_responses").insert({
        opportunity_id: opp.id,
        style: d.style,
        draft_body: d.body,
        status: "draft",
        utm_content: utmContent,
      });
    }
    generated++;
    detail.push({ id: opp.id, intent: intent.intent, score, action: `generated (${drafts.length} drafts)` });
  }

  log.info(
    { processed: opps.length, generated, skipped, blacklisted, ms: Date.now() - startedAt, dryRun },
    "[foros-cerebro] done"
  );

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    processed: opps.length,
    generated,
    skipped,
    blacklisted,
    duration_ms: Date.now() - startedAt,
    detail,
  });
}

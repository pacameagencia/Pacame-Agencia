/**
 * GET /api/agents/research-trends
 *
 * Cron diario · 05:00 UTC (07:00 ES) · disparado por master-cron.
 *
 * Scrape vía Apify de N hashtags IA prioritarios → almacena top posts/engagement
 * en `daily_trends`. Output sirve a:
 *   - tier `trend` stories (compose-stories valida apify_scrape_id existe)
 *   - tier `noticia` carruseles (generate-brief usa como source verificable)
 *
 * Hashtags ES + LATAM hispanohablantes (audiencia OBJETIVO @darkroomcreative.cloud).
 *
 * Reglas memoria respetadas:
 *   - feedback_research_first_escalado_por_tier.md → output es input obligatorio
 *     para tier trend/noticia.
 *   - feedback_audiencia_real_darkroomcreative.md → hashtags LATAM-friendly +
 *     mainstream IA (no solo creators jóvenes ES).
 *
 * Coste Apify: instagram-hashtag-scraper · ~$0.001/post · 10 posts × 8 hashtags
 *   = ~$0.08/día = ~$2.4/mes. Despreciable.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

// 8 hashtags IA priorizados para audiencia LATAM + ES creators IA + emprendedores
const HASHTAGS = [
  "ia",
  "inteligenciaartificial",
  "chatgpt",
  "claudeai",
  "midjourney",
  "promptengineering",
  "ainegocio",
  "emprendedoria",
];

const APIFY_ACTOR = "apify~instagram-hashtag-scraper";
const POSTS_PER_HASHTAG = 10;

interface ApifyPost {
  url?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  hashtags?: string[];
  ownerUsername?: string;
  timestamp?: string;
}

async function scrapeHashtag(hashtag: string, apifyToken: string): Promise<ApifyPost[]> {
  const input = {
    hashtags: [hashtag],
    resultsLimit: POSTS_PER_HASHTAG,
    resultsType: "posts",
    onlyPostsNewerThan: "1 day",
  };

  // Apify run-sync-get-dataset-items endpoint (timeout 90s)
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${apifyToken}&timeout=90`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(95_000),
    });
    if (!r.ok) {
      console.warn(`[research-trends] Apify ${r.status} for #${hashtag}`);
      return [];
    }
    const data = (await r.json()) as ApifyPost[];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.warn(`[research-trends] Apify error #${hashtag}: ${msg.slice(0, 100)}`);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const apifyToken = process.env.APIFY_API_KEY;
  if (!apifyToken) {
    return NextResponse.json({ ok: false, error: "APIFY_API_KEY missing" }, { status: 500 });
  }

  const supabase = createServerSupabase();
  const startedAt = Date.now();
  const insertedRows: Array<{ hashtag: string; engagement: number; url: string | null }> = [];

  // Scrape cada hashtag (en serie para no rate-limit Apify)
  for (const hashtag of HASHTAGS) {
    const posts = await scrapeHashtag(hashtag, apifyToken);
    if (posts.length === 0) continue;

    // Top 1 por engagement (likes + 5×comments)
    const topPost = posts
      .map((p) => ({
        ...p,
        engagement: (p.likesCount || 0) + (p.commentsCount || 0) * 5,
      }))
      .sort((a, b) => b.engagement - a.engagement)[0];

    const summary = (topPost.caption || "").slice(0, 200).replace(/\n/g, " ");

    const { error } = await supabase.from("daily_trends").insert({
      source: "apify-instagram-hashtag-scraper",
      hashtag: `#${hashtag}`,
      top_post_url: topPost.url || null,
      top_post_engagement: topPost.engagement,
      trend_summary: summary,
      raw_data: { posts: posts.slice(0, 5) }, // guardamos top 5 raw para auditoría
    });

    if (error) {
      console.warn(`[research-trends] insert fail #${hashtag}: ${error.message}`);
      continue;
    }

    insertedRows.push({
      hashtag: `#${hashtag}`,
      engagement: topPost.engagement,
      url: topPost.url || null,
    });
  }

  await logAgentActivity({
    agentId: "core",
    type: "update",
    title: `Research trends · ${insertedRows.length}/${HASHTAGS.length} hashtags scrapeados`,
    description: insertedRows
      .slice(0, 5)
      .map((r) => `${r.hashtag} (eng=${r.engagement})`)
      .join(" · "),
    metadata: {
      source: "research-trends-cron",
      hashtags_attempted: HASHTAGS,
      inserted: insertedRows,
      total_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json({
    ok: true,
    hashtags_scraped: insertedRows.length,
    hashtags_total: HASHTAGS.length,
    rows: insertedRows,
    elapsed_ms: Date.now() - startedAt,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

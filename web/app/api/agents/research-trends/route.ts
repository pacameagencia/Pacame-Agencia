/**
 * GET /api/agents/research-trends
 *
 * Cron diario · 05:00 UTC (07:00 ES) · disparado por master-cron.
 *
 * Multi-source fetcher de noticias IA frescas (últimas 24h). Sin Apify
 * (cuenta agotada · plan free → usa fuentes RSS/JSON gratis):
 *
 *   - TechCrunch AI · RSS feed XML
 *   - The Verge AI · RSS feed XML
 *   - Reddit r/artificial top day · JSON
 *   - Reddit r/MachineLearning top day · JSON
 *   - Hacker News Algolia search "AI" · JSON
 *
 * Cada source devuelve N items · ranking por engagement (score Reddit / points HN /
 * fecha TechCrunch). Top 8-10 entries → tabla daily_trends.
 *
 * Output sirve a:
 *   - tier `trend` stories (compose-stories valida apify_scrape_id existe)
 *   - tier `noticia` carruseles (generate-brief usa como source verificable)
 *
 * Reglas memoria respetadas:
 *   - feedback_research_first_escalado_por_tier.md → output input obligatorio para
 *     tier trend/noticia.
 *   - feedback_audiencia_real_darkroomcreative.md → priorizamos noticias IA mainstream
 *     (no nicho-creator-jóvenes-ES).
 *
 * Coste: $0/mes · todas las fuentes son free + sin auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

interface TrendItem {
  source: string;
  hashtag: string; // tema o subreddit como pseudo-hashtag para reusar schema
  url: string;
  title: string;
  engagement: number; // score numérico unificado para ranking
  published_at: string;
  raw: Record<string, unknown>;
}

// ─── 1. TechCrunch AI RSS ─────────────────────────────────────────

async function fetchTechCrunchAI(): Promise<TrendItem[]> {
  try {
    const r = await fetch("https://techcrunch.com/category/artificial-intelligence/feed/", {
      headers: { "User-Agent": "DarkRoomCreative-Bot/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items: TrendItem[] = [];

    // Parse RSS muy básico · regex para items (no XML parser por keep-it-simple)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xml)) !== null && count < 5) {
      const block = match[1];
      const title = (block.match(/<title>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1] || "";
      const link = (block.match(/<link>([^<]+)<\/link>/) || [])[1] || "";
      const pubDate = (block.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1] || "";
      if (!title || !link) continue;

      // Solo items <24h
      const pubMs = new Date(pubDate).getTime();
      if (Date.now() - pubMs > 24 * 3600 * 1000) continue;

      items.push({
        source: "techcrunch-ai",
        hashtag: "#ia",
        url: link.trim(),
        title: title.trim().slice(0, 200),
        engagement: Math.max(1, Math.floor((Date.now() - pubMs) / 3600 / 1000)), // hours-since-pub inverted later
        published_at: new Date(pubMs).toISOString(),
        raw: { title, link, pubDate },
      });
      count++;
    }
    return items;
  } catch (e) {
    console.warn("[research-trends] TechCrunch fail:", e instanceof Error ? e.message : "unknown");
    return [];
  }
}

// ─── 2. The Verge AI RSS ──────────────────────────────────────────

async function fetchTheVergeAI(): Promise<TrendItem[]> {
  try {
    const r = await fetch("https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", {
      headers: { "User-Agent": "DarkRoomCreative-Bot/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items: TrendItem[] = [];

    // Atom feed · entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    let count = 0;
    while ((match = entryRegex.exec(xml)) !== null && count < 5) {
      const block = match[1];
      const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1] || "";
      const link = (block.match(/<link[^>]*href="([^"]+)"/) || [])[1] || "";
      const published = (block.match(/<published>([^<]+)<\/published>/) || [])[1] || "";
      if (!title || !link) continue;

      const pubMs = new Date(published).getTime();
      if (Date.now() - pubMs > 24 * 3600 * 1000) continue;

      items.push({
        source: "the-verge-ai",
        hashtag: "#ia",
        url: link.trim(),
        title: title.trim().slice(0, 200),
        engagement: Math.max(1, Math.floor((Date.now() - pubMs) / 3600 / 1000)),
        published_at: new Date(pubMs).toISOString(),
        raw: { title, link, published },
      });
      count++;
    }
    return items;
  } catch (e) {
    console.warn("[research-trends] TheVerge fail:", e instanceof Error ? e.message : "unknown");
    return [];
  }
}

// ─── 3. Reddit subreddits ─────────────────────────────────────────

interface RedditPost {
  data: {
    title: string;
    permalink: string;
    score: number;
    num_comments: number;
    created_utc: number;
    url: string;
    selftext?: string;
    subreddit: string;
  };
}

async function fetchRedditSubreddit(subreddit: string): Promise<TrendItem[]> {
  try {
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/top/.json?t=day&limit=5`, {
      headers: { "User-Agent": "DarkRoomCreative-Bot/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { data: { children: RedditPost[] } };
    const posts = data?.data?.children || [];
    return posts.slice(0, 5).map((p) => ({
      source: `reddit-${subreddit.toLowerCase()}`,
      hashtag: `#${subreddit.toLowerCase()}`,
      url: `https://reddit.com${p.data.permalink}`,
      title: p.data.title.slice(0, 200),
      engagement: p.data.score + p.data.num_comments * 5,
      published_at: new Date(p.data.created_utc * 1000).toISOString(),
      raw: { score: p.data.score, comments: p.data.num_comments, ext_url: p.data.url },
    }));
  } catch (e) {
    console.warn(`[research-trends] reddit ${subreddit} fail:`, e instanceof Error ? e.message : "unknown");
    return [];
  }
}

// ─── 4. Hacker News Algolia (fresh AI-related stories) ────────────

interface HNHit {
  title: string;
  url: string;
  story_id: number;
  points: number;
  num_comments: number;
  created_at_i: number;
  objectID: string;
}

async function fetchHackerNewsAI(): Promise<TrendItem[]> {
  try {
    const since = Math.floor(Date.now() / 1000) - 24 * 3600;
    const url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI&numericFilters=created_at_i>${since}&hitsPerPage=10`;
    const r = await fetch(url, {
      headers: { "User-Agent": "DarkRoomCreative-Bot/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { hits: HNHit[] };
    return (data.hits || []).slice(0, 5).map((h) => ({
      source: "hackernews",
      hashtag: "#ia",
      url: h.url || `https://news.ycombinator.com/item?id=${h.story_id || h.objectID}`,
      title: (h.title || "").slice(0, 200),
      engagement: (h.points || 0) + (h.num_comments || 0) * 3,
      published_at: new Date(h.created_at_i * 1000).toISOString(),
      raw: { points: h.points, comments: h.num_comments, hn_id: h.story_id || h.objectID },
    }));
  } catch (e) {
    console.warn("[research-trends] HN fail:", e instanceof Error ? e.message : "unknown");
    return [];
  }
}

// ─── Endpoint principal ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // Lanzar las 5 fuentes en paralelo
  const [tc, tv, redditAI, redditML, hn] = await Promise.all([
    fetchTechCrunchAI(),
    fetchTheVergeAI(),
    fetchRedditSubreddit("artificial"),
    fetchRedditSubreddit("MachineLearning"),
    fetchHackerNewsAI(),
  ]);

  const allItems: TrendItem[] = [...tc, ...tv, ...redditAI, ...redditML, ...hn];

  if (allItems.length === 0) {
    await logAgentActivity({
      agentId: "core",
      type: "update",
      title: "Research trends · 0 items · TODAS las fuentes vacías",
      description: "TechCrunch + Verge + Reddit + HN devolvieron 0 items relevantes <24h",
      metadata: { source: "research-trends-cron", elapsed_ms: Date.now() - startedAt },
    });
    return NextResponse.json({ ok: false, items: 0, message: "all sources empty" });
  }

  // Top N por engagement
  const sorted = allItems.sort((a, b) => b.engagement - a.engagement).slice(0, 10);

  // Insert
  const inserted: Array<{ source: string; title: string; engagement: number }> = [];
  for (const item of sorted) {
    const { error } = await supabase.from("daily_trends").insert({
      source: item.source,
      hashtag: item.hashtag,
      top_post_url: item.url,
      top_post_engagement: item.engagement,
      trend_summary: item.title,
      raw_data: { ...item.raw, published_at: item.published_at },
    });
    if (!error) {
      inserted.push({ source: item.source, title: item.title, engagement: item.engagement });
    }
  }

  await logAgentActivity({
    agentId: "core",
    type: "update",
    title: `Research trends · ${inserted.length}/${sorted.length} items insertados`,
    description: inserted
      .slice(0, 3)
      .map((r) => `${r.source}: "${r.title.slice(0, 60)}" (eng=${r.engagement})`)
      .join(" · "),
    metadata: {
      source: "research-trends-cron",
      sources_used: ["techcrunch-ai", "the-verge-ai", "reddit-artificial", "reddit-machinelearning", "hackernews"],
      total_fetched: allItems.length,
      total_inserted: inserted.length,
      elapsed_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json({
    ok: true,
    items_fetched: allItems.length,
    items_inserted: inserted.length,
    sources: {
      techcrunch: tc.length,
      verge: tv.length,
      reddit_artificial: redditAI.length,
      reddit_ml: redditML.length,
      hackernews: hn.length,
    },
    top_items: inserted.slice(0, 5),
    elapsed_ms: Date.now() - startedAt,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

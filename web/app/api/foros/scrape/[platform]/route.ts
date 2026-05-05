/**
 * GET /api/foros/scrape/[platform]
 *
 * Worker individual de cada plataforma. Recolector → upsert en
 * `foros_opportunities` (UNIQUE thread_url evita duplicados).
 *
 * Auth: verifyInternalAuth.
 * Query: ?dry-run=true (no escribe DB)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import {
  scrapeReddit,
  scrapeForobeta,
  scrapeTwitter,
  scrapeIndieHackers,
  scrapeQuora,
  type ScrapedItem,
} from "@/lib/foros/scrapers";

export const runtime = "nodejs";
export const maxDuration = 280;

interface SourceRow {
  platform: string;
  source_key: string;
  intent_hints: string[] | null;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ platform: string }> }
) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const { platform } = await ctx.params;
  const validPlatforms = ["reddit", "forobeta", "twitter", "indiehackers", "quora"];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: `unknown platform: ${platform}` }, { status: 400 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry-run") === "true";
  const log = getLogger();
  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // Cargar sources active
  const { data: sourcesRaw, error: srcErr } = await supabase
    .from("foros_sources")
    .select("platform, source_key, intent_hints")
    .eq("platform", platform)
    .eq("active", true);

  if (srcErr) {
    return NextResponse.json({ error: srcErr.message }, { status: 500 });
  }
  const sources = (sourcesRaw ?? []) as SourceRow[];
  if (sources.length === 0) {
    return NextResponse.json({ ok: true, scraped: 0, inserted: 0, note: "no active sources" });
  }
  const sourceKeys = sources.map((s) => s.source_key);

  // Ejecutar scraper
  let items: ScrapedItem[] = [];
  try {
    if (platform === "reddit") items = await scrapeReddit(sourceKeys, 48, 25);
    else if (platform === "forobeta") items = await scrapeForobeta(sourceKeys, 30);
    else if (platform === "twitter") items = await scrapeTwitter(sourceKeys, 48);
    else if (platform === "indiehackers") items = await scrapeIndieHackers(72);
    else if (platform === "quora") items = await scrapeQuora(sourceKeys);
  } catch (err) {
    log.error({ platform, err: err instanceof Error ? err.message : String(err) }, "[foros-scrape] worker failed");
    return NextResponse.json({ error: err instanceof Error ? err.message : "scraper error" }, { status: 500 });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      platform,
      scraped: items.length,
      inserted: 0,
      sample: items.slice(0, 3),
      duration_ms: Date.now() - startedAt,
    });
  }

  // Upsert opportunities · UNIQUE thread_url evita duplicados
  let inserted = 0;
  for (const item of items) {
    const { error: upErr } = await supabase
      .from("foros_opportunities")
      .upsert(
        {
          platform: item.platform,
          source_key: item.source_key,
          thread_url: item.thread_url,
          thread_title: item.thread_title.slice(0, 500),
          thread_body: item.thread_body.slice(0, 6000),
          author_username: item.author_username.slice(0, 80),
          author_authority: item.author_authority,
          posted_at: item.posted_at,
          reach_proxy: item.reach_proxy,
          competition_count: item.competition_count,
          status: "pending",
        },
        { onConflict: "thread_url", ignoreDuplicates: false }
      );
    if (!upErr) inserted++;
  }

  // Update last_scraped_at + counter
  for (const sk of sourceKeys) {
    await supabase
      .from("foros_sources")
      .update({
        last_scraped_at: new Date().toISOString(),
        total_scraped: items.filter((i) => i.source_key === sk).length,
      })
      .eq("platform", platform)
      .eq("source_key", sk);
  }

  log.info(
    { platform, scraped: items.length, inserted, ms: Date.now() - startedAt },
    "[foros-scrape] worker done"
  );

  return NextResponse.json({
    ok: true,
    platform,
    scraped: items.length,
    inserted,
    duration_ms: Date.now() - startedAt,
  });
}

/**
 * GET /api/agents/auto-publish
 *
 * Cron auto-publisher de Instagram. Disparado por master-cron 2× al día
 * (mañana 09:00 UTC = 11:00 ES · noche 19:00 UTC = 21:00 ES) o adhoc.
 *
 * Flujo:
 *  1. Lee `content_queue` con status='pending' y scheduled_at <= now()
 *  2. Para cada fila: marca 'publishing' → llama a publishCarousel/publishPost
 *     → marca 'published' (post_id+permalink) o 'failed' (error)
 *  3. Devuelve resumen de lo publicado
 *
 * El upload físico de imágenes a un host público (catbox.moe) ya está
 * resuelto upstream: la fila guarda image_urls como array de URLs públicas
 * directamente consumibles por IG Graph API. El cron NO sube nada — solo
 * orquesta el publish.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { createServerSupabase } from "@/lib/supabase/server";
import { publishCarousel, publishPost } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 300;

interface QueueRow {
  id: string;
  scheduled_at: string;
  brand: "darkroom" | "pacame";
  slot: string | null;
  format: "carousel" | "post" | "story";
  image_urls: string[];
  caption: string;
  hashtags: string | null;
  attempts: number;
}

const MAX_ATTEMPTS = 3;
const MAX_PER_RUN = 4;

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const now = new Date().toISOString();

  const { data: rows, error: qErr } = await supabase
    .from("content_queue")
    .select("id, scheduled_at, brand, slot, format, image_urls, caption, hashtags, attempts")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .lt("attempts", MAX_ATTEMPTS)
    .order("scheduled_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (qErr) {
    return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
  }

  const queue = (rows as QueueRow[] | null) || [];
  if (queue.length === 0) {
    return NextResponse.json({ ok: true, dispatched: 0, message: "no pending content" });
  }

  const results: Array<{ id: string; brand: string; format: string; status: string; post_id?: string; error?: string }> = [];

  for (const row of queue) {
    // Mark publishing
    await supabase
      .from("content_queue")
      .update({ status: "publishing", attempts: row.attempts + 1 })
      .eq("id", row.id);

    try {
      let res: { success: boolean; postId?: string; error?: string };

      if (row.format === "carousel") {
        const items = row.image_urls.map((url) => ({ imageUrl: url }));
        res = await publishCarousel(items, row.caption, row.hashtags || undefined);
      } else if (row.format === "post") {
        res = await publishPost({
          imageUrl: row.image_urls[0],
          caption: row.caption,
          hashtags: row.hashtags || undefined,
        });
      } else {
        res = { success: false, error: `format ${row.format} no soportado todavía` };
      }

      if (res.success && res.postId) {
        const permalink = await fetchPermalink(res.postId);
        await supabase
          .from("content_queue")
          .update({
            status: "published",
            post_id: res.postId,
            permalink,
            published_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", row.id);

        results.push({ id: row.id, brand: row.brand, format: row.format, status: "published", post_id: res.postId });
      } else {
        const willRetry = row.attempts + 1 < MAX_ATTEMPTS;
        await supabase
          .from("content_queue")
          .update({
            status: willRetry ? "pending" : "failed",
            error: res.error || "publish returned no postId",
          })
          .eq("id", row.id);

        results.push({ id: row.id, brand: row.brand, format: row.format, status: willRetry ? "retry" : "failed", error: res.error });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      const willRetry = row.attempts + 1 < MAX_ATTEMPTS;
      await supabase
        .from("content_queue")
        .update({
          status: willRetry ? "pending" : "failed",
          error: msg,
        })
        .eq("id", row.id);
      results.push({ id: row.id, brand: row.brand, format: row.format, status: willRetry ? "retry" : "failed", error: msg });
    }
  }

  const published = results.filter((r) => r.status === "published").length;
  const failed = results.filter((r) => r.status === "failed").length;

  await logAgentActivity({
    agentId: "pulse",
    type: "update",
    title: `Auto-publish IG (${published} OK, ${failed} fail)`,
    description: results.map((r) => `${r.brand}/${r.format}: ${r.status}${r.post_id ? ` ${r.post_id}` : ""}${r.error ? ` (${r.error})` : ""}`).join(" | "),
    metadata: { results, total: results.length, source: "auto-publish-cron" },
  });

  return NextResponse.json({
    ok: failed === 0,
    dispatched: results.length,
    published,
    failed,
    results,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

async function fetchPermalink(postId: string): Promise<string | null> {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) return null;
    const r = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=permalink&access_token=${token}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { permalink?: string };
    return j.permalink || null;
  } catch {
    return null;
  }
}

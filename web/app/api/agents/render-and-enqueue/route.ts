/**
 * GET /api/agents/render-and-enqueue
 *
 * Cron diario · 06:00 UTC (08:00 ES) · disparado por master-cron.
 *
 * Lee briefs generated de hoy en `daily_briefs` · para cada uno:
 *   1. Genera N slides PNG via Sharp+SVG (carrusel) o 1 PNG (story/post)
 *   2. Upload a catbox.moe
 *   3. Update content_queue draft → pending con caption + image_urls + hashtags
 *   4. Update daily_brief status=enqueued
 *
 * Reels (DARK_FRAMES) NO se procesan aquí · van por render-piece.mjs manual con
 * doble OK Pablo + cost-guard (regla feedback_doble_aprobacion_videos.md).
 *
 * MVP: render minimal pero on-brand · fondo bg #0A0A0A + texto Anton+SpaceGrotesk
 *      mediante Sharp+SVG. compose-slides.mjs custom queda para piezas hero futuras.
 *      Cumple safe areas IG (TOP 100px · BOT 260px · MARGIN 60px).
 *
 * Reglas memoria respetadas:
 *   - feedback_calidad_top_no_pilotos.md → si brief inválido o slides fallan →
 *     marca skipped (no publica relleno).
 *   - feedback_research_first_escalado_por_tier.md → solo procesa briefs que pasaron
 *     validación tier en generate-brief.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { createServerSupabase } from "@/lib/supabase/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 300;

const W_CAROUSEL = 1080;
const H_CAROUSEL = 1350;
const W_STORY = 1080;
const H_STORY = 1920;

interface SlideSpec {
  n: number;
  type?: string;
  headline?: string;
  subline?: string;
  visual_hint?: string;
}

interface BriefData {
  title?: string;
  hook?: string;
  slides?: SlideSpec[];
  caption?: string;
  hashtags?: string;
  research_tier?: string;
  source?: { source_url?: string; source_quote?: string; source_date?: string };
  cited_data?: Array<{ value: string; source: string }>;
  skip_reason?: string;
}

interface BriefRow {
  id: string;
  content_queue_id: string;
  brief: BriefData;
  research_tier: string;
  content_type: string;
}

interface DraftRow {
  id: string;
  format: "carousel" | "story" | "post" | "reel";
  scheduled_at: string;
}

// ─── SVG slide generator (carrusel 1080×1350) ─────────────────────

function buildCarouselSlideSvg(slide: SlideSpec, slideIdx: number, totalSlides: number): string {
  const headline = (slide.headline || "").slice(0, 120);
  const subline = (slide.subline || "").slice(0, 200);
  const isCover = slide.type === "cover" || slideIdx === 0;
  const isCta = slide.type === "cta" || slideIdx === totalSlides - 1;

  const headlineFontSize = isCover ? 90 : 60;
  const sublineFontSize = isCover ? 36 : 30;

  // Word-wrap simple: divide en líneas de máx N chars
  function wrap(text: string, maxChars: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length > maxChars && current) {
        lines.push(current.trim());
        current = w;
      } else {
        current += " " + w;
      }
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
  }

  const headlineLines = wrap(headline, isCover ? 18 : 22);
  const sublineLines = wrap(subline, 35);

  const headlineSvg = headlineLines
    .map((line, i) => {
      const y = 400 + i * (headlineFontSize + 10);
      return `<text x="540" y="${y}" font-family="'Anton', Impact, sans-serif" font-size="${headlineFontSize}" fill="#CFFF00" text-anchor="middle" font-weight="900" letter-spacing="-2">${escapeXml(line.toUpperCase())}</text>`;
    })
    .join("");

  const sublineY = 400 + headlineLines.length * (headlineFontSize + 10) + 40;
  const sublineSvg = sublineLines
    .map((line, i) => {
      const y = sublineY + i * (sublineFontSize + 6);
      return `<text x="540" y="${y}" font-family="'Space Grotesk', sans-serif" font-size="${sublineFontSize}" fill="#F2F2F2" text-anchor="middle" font-weight="500">${escapeXml(line)}</text>`;
    })
    .join("");

  // Counter "n/total" en mono · esquina inferior derecha (dentro safe area · y < 1090)
  const counterSvg = `<text x="${W_CAROUSEL - 60}" y="1070" font-family="'JetBrains Mono', monospace" font-size="22" fill="#8E8E8E" text-anchor="end">${slideIdx + 1}/${totalSlides}</text>`;

  // Brand mark esquina inferior izquierda
  const brandSvg = `<text x="60" y="1070" font-family="'JetBrains Mono', monospace" font-size="22" fill="#8E8E8E">DARKROOMCREATIVE.CLOUD</text>`;

  // CTA específico para último slide
  let ctaSvg = "";
  if (isCta) {
    ctaSvg = `
      <rect x="240" y="950" width="600" height="80" fill="#CFFF00" rx="40"/>
      <text x="540" y="1003" font-family="'Anton', Impact, sans-serif" font-size="36" fill="#0A0A0A" text-anchor="middle" font-weight="900">14 DIAS GRATIS · BIO</text>
    `;
  }

  return `<svg width="${W_CAROUSEL}" height="${H_CAROUSEL}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W_CAROUSEL}" height="${H_CAROUSEL}" fill="#0A0A0A"/>
  ${headlineSvg}
  ${sublineSvg}
  ${ctaSvg}
  ${counterSvg}
  ${brandSvg}
</svg>`;
}

function buildStorySvg(headline: string, subline: string): string {
  const TOP_UNSAFE = 250;
  const BOT_UNSAFE = 250;

  const headlineLines = wrapText(headline.slice(0, 100), 16);
  const sublineLines = wrapText(subline.slice(0, 120), 30);

  const headlineSvg = headlineLines
    .map((line, i) => {
      const y = 600 + i * 110;
      return `<text x="540" y="${y}" font-family="'Anton', Impact, sans-serif" font-size="100" fill="#CFFF00" text-anchor="middle" font-weight="900" letter-spacing="-3">${escapeXml(line.toUpperCase())}</text>`;
    })
    .join("");

  const sublineY = 600 + headlineLines.length * 110 + 60;
  const sublineSvg = sublineLines
    .map((line, i) => {
      const y = sublineY + i * 50;
      return `<text x="540" y="${y}" font-family="'Space Grotesk', sans-serif" font-size="40" fill="#F2F2F2" text-anchor="middle" font-weight="500">${escapeXml(line)}</text>`;
    })
    .join("");

  const brandSvg = `<text x="540" y="${H_STORY - BOT_UNSAFE - 40}" font-family="'JetBrains Mono', monospace" font-size="26" fill="#8E8E8E" text-anchor="middle">DARKROOMCREATIVE.CLOUD</text>`;

  return `<svg width="${W_STORY}" height="${H_STORY}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W_STORY}" height="${H_STORY}" fill="#0A0A0A"/>
  ${headlineSvg}
  ${sublineSvg}
  ${brandSvg}
</svg>`;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current += " " + w;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Catbox upload ────────────────────────────────────────────────

async function uploadCatbox(buffer: Buffer, filename: string): Promise<string> {
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  // Convertir Buffer → Uint8Array para BlobPart compatibility (TS strict)
  const uint8 = new Uint8Array(buffer);
  fd.append("fileToUpload", new Blob([uint8], { type: "image/jpeg" }), filename);
  const r = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: fd,
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) throw new Error(`catbox HTTP ${r.status}`);
  const url = (await r.text()).trim();
  if (!url.startsWith("https://")) throw new Error(`catbox bad: ${url.slice(0, 100)}`);
  return url;
}

// ─── Render slide → PNG buffer → JPEG upload ──────────────────────

async function renderSlide(svg: string): Promise<Buffer> {
  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 90, progressive: false, chromaSubsampling: "4:2:0" })
    .toBuffer();
}

// ─── Endpoint principal ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // Lee briefs de HOY con status=generated
  const today = new Date().toISOString().slice(0, 10);
  const { data: briefRows, error: bErr } = await supabase
    .from("daily_briefs")
    .select("id, content_queue_id, brief, research_tier, content_type")
    .eq("date", today)
    .eq("status", "generated")
    .limit(20);

  if (bErr) {
    return NextResponse.json({ ok: false, error: bErr.message }, { status: 500 });
  }

  const briefs = (briefRows as BriefRow[]) || [];

  if (briefs.length === 0) {
    return NextResponse.json({ ok: true, message: "no briefs to render", date: today });
  }

  const results: Array<{
    briefId: string;
    draftId: string;
    status: string;
    error?: string;
    image_count?: number;
  }> = [];

  for (const brief of briefs) {
    try {
      // Cargar el draft asociado
      const { data: draftData, error: dErr } = await supabase
        .from("content_queue")
        .select("id, format, scheduled_at")
        .eq("id", brief.content_queue_id)
        .single();

      if (dErr || !draftData) {
        results.push({ briefId: brief.id, draftId: brief.content_queue_id, status: "draft_not_found", error: dErr?.message });
        continue;
      }

      const draft = draftData as DraftRow;

      // Skip reels (van por render-piece manual)
      if (draft.format === "reel") {
        results.push({ briefId: brief.id, draftId: draft.id, status: "skipped_reel_manual" });
        continue;
      }

      // Marcar brief rendering
      await supabase.from("daily_briefs").update({ status: "rendering" }).eq("id", brief.id);

      const briefData = brief.brief as BriefData;

      // Si Claude marcó skip_reason en el brief, marcamos draft skipped
      if (briefData.skip_reason) {
        await supabase
          .from("content_queue")
          .update({ status: "skipped", error: `brief skip: ${String(briefData.skip_reason).slice(0, 200)}` })
          .eq("id", draft.id);
        await supabase.from("daily_briefs").update({ status: "skipped", error: String(briefData.skip_reason).slice(0, 500) }).eq("id", brief.id);
        results.push({ briefId: brief.id, draftId: draft.id, status: "skipped_by_brief" });
        continue;
      }

      const slides = briefData.slides || [];
      const caption = briefData.caption || "";
      const hashtags = briefData.hashtags || "";

      const imageUrls: string[] = [];

      if (draft.format === "carousel") {
        // Render slides (cap 10 max IG)
        const useSlides = slides.slice(0, 10);
        if (useSlides.length === 0) {
          await supabase.from("daily_briefs").update({ status: "failed", error: "no slides in brief" }).eq("id", brief.id);
          results.push({ briefId: brief.id, draftId: draft.id, status: "failed", error: "no slides" });
          continue;
        }

        for (let i = 0; i < useSlides.length; i++) {
          const svg = buildCarouselSlideSvg(useSlides[i], i, useSlides.length);
          const buf = await renderSlide(svg);
          const url = await uploadCatbox(buf, `slide-${draft.id.slice(0, 8)}-${i + 1}.jpg`);
          imageUrls.push(url);
        }
      } else if (draft.format === "story") {
        // Render 1 PNG story
        const headline = briefData.title || briefData.hook || "Dark Room";
        const subline = (briefData.caption || "").split("\n")[0].slice(0, 150);
        const svg = buildStorySvg(headline, subline);
        const buf = await renderSlide(svg);
        const url = await uploadCatbox(buf, `story-${draft.id.slice(0, 8)}.jpg`);
        imageUrls.push(url);
      } else if (draft.format === "post") {
        const headline = briefData.title || briefData.hook || "Dark Room";
        const subline = (briefData.caption || "").split("\n")[0].slice(0, 150);
        const svg = buildStorySvg(headline, subline); // post usa 1080×1920 también para simplificar MVP
        const buf = await renderSlide(svg);
        const url = await uploadCatbox(buf, `post-${draft.id.slice(0, 8)}.jpg`);
        imageUrls.push(url);
      } else {
        results.push({ briefId: brief.id, draftId: draft.id, status: "skipped_unknown_format" });
        continue;
      }

      // Update content_queue draft → pending
      const { error: uErr } = await supabase
        .from("content_queue")
        .update({
          status: "pending",
          caption,
          hashtags,
          image_urls: imageUrls,
        })
        .eq("id", draft.id);

      if (uErr) {
        await supabase.from("daily_briefs").update({ status: "failed", error: `enqueue fail: ${uErr.message.slice(0, 200)}` }).eq("id", brief.id);
        results.push({ briefId: brief.id, draftId: draft.id, status: "failed", error: uErr.message });
        continue;
      }

      await supabase.from("daily_briefs").update({ status: "enqueued" }).eq("id", brief.id);

      results.push({
        briefId: brief.id,
        draftId: draft.id,
        status: "enqueued",
        image_count: imageUrls.length,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      await supabase.from("daily_briefs").update({ status: "failed", error: msg.slice(0, 500) }).eq("id", brief.id);
      results.push({ briefId: brief.id, draftId: brief.content_queue_id, status: "failed", error: msg.slice(0, 200) });
    }
  }

  const summary = {
    enqueued: results.filter((r) => r.status === "enqueued").length,
    skipped_reel: results.filter((r) => r.status === "skipped_reel_manual").length,
    skipped_brief: results.filter((r) => r.status === "skipped_by_brief").length,
    failed: results.filter((r) => r.status === "failed").length,
    total_images: results.reduce((s, r) => s + (r.image_count || 0), 0),
  };

  await logAgentActivity({
    agentId: "core",
    type: "update",
    title: `Render-and-enqueue · ${summary.enqueued} OK · ${summary.failed} fail · ${summary.skipped_brief + summary.skipped_reel} skip`,
    description: `Imágenes generadas+subidas: ${summary.total_images} · Briefs hoy: ${briefs.length}`,
    metadata: {
      source: "render-and-enqueue-cron",
      summary,
      results,
      total_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json({
    ok: summary.failed === 0,
    briefs_processed: briefs.length,
    results: summary,
    elapsed_ms: Date.now() - startedAt,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

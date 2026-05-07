/**
 * GET /api/agents/render-and-enqueue
 *
 * Cron diario · 06:00 UTC (08:00 ES) · disparado por master-cron.
 *
 * Lee briefs generated de hoy en `daily_briefs` · para cada uno:
 *   1. Genera N slides PNG via Sharp+SVG (carrusel) o 1 PNG (story/post)
 *   2. Upload a Supabase Storage bucket `social-public` (público · accesible IG Graph)
 *   3. Update content_queue draft → pending con caption + image_urls + hashtags
 *   4. Update daily_brief status=enqueued
 *
 * Reels (DARK_FRAMES) NO se procesan aquí · van por render-piece.mjs manual con
 * doble OK Pablo + cost-guard (regla feedback_doble_aprobacion_videos.md).
 *
 * v2: usa opentype.js para convertir texto a SVG paths · idéntico patrón a
 *     compose-slides.mjs local. Garantiza fonts on-brand (Anton + SpaceGrotesk
 *     + JetBrainsMono) en runtime Vercel sin depender de fonts del sistema.
 *     TTFs leídas desde public/fonts/ que Next bundlea como assets estáticos.
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
import * as opentype from "opentype.js";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 300;

const W_CAROUSEL = 1080;
const H_CAROUSEL = 1350;
const W_STORY = 1080;
const H_STORY = 1920;

// IG safe areas (compose-slides.mjs)
const TOP_UNSAFE = 100;
const BOT_UNSAFE = 260;
const MARGIN_X = 60;

// Brand colors
const C = {
  bg: "#0A0A0A",
  acid: "#CFFF00",
  white: "#F2F2F2",
  ghost: "#8E8E8E",
};

// ─── Font loading (sync at module init · runtime Vercel) ──────────

function loadFont(filename: string): opentype.Font {
  const fontPath = path.join(process.cwd(), "public", "fonts", filename);
  const buffer = fs.readFileSync(fontPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const font = opentype.parse(arrayBuffer);
  if (!font) throw new Error(`Failed to parse font: ${filename}`);
  return font;
}

let FONTS: { anton: opentype.Font; sgB: opentype.Font; jbm: opentype.Font } | null = null;

function getFonts() {
  if (!FONTS) {
    FONTS = {
      anton: loadFont("Anton-Regular.ttf"),
      sgB: loadFont("SpaceGrotesk-Bold.ttf"),
      jbm: loadFont("JetBrainsMono-Regular.ttf"),
    };
  }
  return FONTS;
}

// ─── Text → SVG path helpers ──────────────────────────────────────

function textPath(opts: {
  text: string;
  font: opentype.Font;
  size: number;
  x: number;
  y: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  letterSpacing?: number;
}): string {
  const { text, font, size, x, y, fill = "#fff", anchor = "start", letterSpacing = 0 } = opts;
  if (!text) return "";

  let drawX = x;
  let totalW = 0;
  let paths = "";

  if (letterSpacing === 0) {
    totalW = font.getAdvanceWidth(text, size);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    paths = font
      .getPath(text, drawX, y, size)
      .toSVG(2)
      .replace(/<path /, `<path fill="${fill}" `);
  } else {
    const widths = [...text].map((ch) => font.getAdvanceWidth(ch, size));
    totalW = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, text.length - 1);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    let cur = drawX;
    [...text].forEach((ch, i) => {
      paths += font
        .getPath(ch, cur, y, size)
        .toSVG(2)
        .replace(/<path /, `<path fill="${fill}" `);
      cur += widths[i] + letterSpacing;
    });
  }
  return paths;
}

// Word-wrap: divide en líneas que no excedan maxWidth en pixeles
function wrapText(text: string, font: opentype.Font, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const testLine = current ? `${current} ${w}` : w;
    const width = font.getAdvanceWidth(testLine, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── SVG slide builder (carrusel 1080×1350) ───────────────────────

interface SlideSpec {
  n?: number;
  type?: string;
  headline?: string;
  subline?: string;
  visual_hint?: string;
}

function buildCarouselSlideSvg(slide: SlideSpec, slideIdx: number, totalSlides: number): string {
  const fonts = getFonts();
  const headline = (slide.headline || "").slice(0, 120).toUpperCase();
  const subline = (slide.subline || "").slice(0, 200);
  const isCover = slide.type === "cover" || slideIdx === 0;
  const isCta = slide.type === "cta" || slideIdx === totalSlides - 1;

  const headlineFontSize = isCover ? 90 : 64;
  const sublineFontSize = isCover ? 36 : 30;
  const maxTextWidth = W_CAROUSEL - 2 * MARGIN_X;

  const headlineLines = wrapText(headline, fonts.anton, headlineFontSize, maxTextWidth);
  const sublineLines = wrapText(subline, fonts.sgB, sublineFontSize, maxTextWidth);

  // Vertical centering inside safe area
  const totalHeight =
    headlineLines.length * (headlineFontSize + 10) + 40 + sublineLines.length * (sublineFontSize + 6);
  const safeHeight = H_CAROUSEL - TOP_UNSAFE - BOT_UNSAFE;
  let y = TOP_UNSAFE + Math.max(80, (safeHeight - totalHeight) / 2);

  let headlineSvg = "";
  for (const line of headlineLines) {
    y += headlineFontSize;
    headlineSvg += textPath({
      text: line,
      font: fonts.anton,
      size: headlineFontSize,
      x: W_CAROUSEL / 2,
      y,
      fill: C.acid,
      anchor: "middle",
      letterSpacing: -2,
    });
    y += 10;
  }

  y += 30;
  let sublineSvg = "";
  for (const line of sublineLines) {
    y += sublineFontSize;
    sublineSvg += textPath({
      text: line,
      font: fonts.sgB,
      size: sublineFontSize,
      x: W_CAROUSEL / 2,
      y,
      fill: C.white,
      anchor: "middle",
    });
    y += 6;
  }

  // Counter "n/total" mono · esquina inf der dentro safe area
  const counterSvg = textPath({
    text: `${slideIdx + 1}/${totalSlides}`,
    font: fonts.jbm,
    size: 22,
    x: W_CAROUSEL - MARGIN_X,
    y: H_CAROUSEL - 90,
    fill: C.ghost,
    anchor: "end",
  });

  // Brand mark esquina inf izq
  const brandSvg = textPath({
    text: "DARKROOMCREATIVE.CLOUD",
    font: fonts.jbm,
    size: 22,
    x: MARGIN_X,
    y: H_CAROUSEL - 90,
    fill: C.ghost,
  });

  // CTA pill al último slide
  let ctaSvg = "";
  if (isCta) {
    const pillX = (W_CAROUSEL - 600) / 2;
    const pillY = H_CAROUSEL - 220;
    ctaSvg = `
      <rect x="${pillX}" y="${pillY}" width="600" height="80" fill="${C.acid}" rx="40"/>
      ${textPath({
        text: "14 DIAS GRATIS · BIO",
        font: fonts.anton,
        size: 36,
        x: W_CAROUSEL / 2,
        y: pillY + 56,
        fill: C.bg,
        anchor: "middle",
        letterSpacing: -1,
      })}
    `;
  }

  return `<svg width="${W_CAROUSEL}" height="${H_CAROUSEL}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W_CAROUSEL}" height="${H_CAROUSEL}" fill="${C.bg}"/>
    ${headlineSvg}
    ${sublineSvg}
    ${ctaSvg}
    ${counterSvg}
    ${brandSvg}
  </svg>`;
}

function buildStorySvg(headline: string, subline: string): string {
  const fonts = getFonts();
  const story_TOP_UNSAFE = 250;
  const story_BOT_UNSAFE = 250;
  const maxTextWidth = W_STORY - 2 * MARGIN_X;

  const headlineUpper = headline.slice(0, 100).toUpperCase();
  const headlineLines = wrapText(headlineUpper, fonts.anton, 100, maxTextWidth);
  const sublineLines = wrapText(subline.slice(0, 120), fonts.sgB, 40, maxTextWidth);

  const totalHeight = headlineLines.length * 110 + 60 + sublineLines.length * 50;
  const safeHeight = H_STORY - story_TOP_UNSAFE - story_BOT_UNSAFE;
  let y = story_TOP_UNSAFE + Math.max(80, (safeHeight - totalHeight) / 2);

  let headlineSvg = "";
  for (const line of headlineLines) {
    y += 100;
    headlineSvg += textPath({
      text: line,
      font: fonts.anton,
      size: 100,
      x: W_STORY / 2,
      y,
      fill: C.acid,
      anchor: "middle",
      letterSpacing: -3,
    });
    y += 10;
  }

  y += 50;
  let sublineSvg = "";
  for (const line of sublineLines) {
    y += 40;
    sublineSvg += textPath({
      text: line,
      font: fonts.sgB,
      size: 40,
      x: W_STORY / 2,
      y,
      fill: C.white,
      anchor: "middle",
    });
    y += 10;
  }

  const brandSvg = textPath({
    text: "DARKROOMCREATIVE.CLOUD",
    font: fonts.jbm,
    size: 26,
    x: W_STORY / 2,
    y: H_STORY - story_BOT_UNSAFE - 40,
    fill: C.ghost,
    anchor: "middle",
  });

  return `<svg width="${W_STORY}" height="${H_STORY}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W_STORY}" height="${H_STORY}" fill="${C.bg}"/>
    ${headlineSvg}
    ${sublineSvg}
    ${brandSvg}
  </svg>`;
}

// ─── Supabase Storage upload ──────────────────────────────────────
// Sustituye catbox.moe (HTTP 412 desde Vercel runtime · server uploads bloqueados).
// Usamos bucket `social-public` (público · ya creado · accesible por IG Graph API).

async function uploadSupabaseStorage(
  supabase: ReturnType<typeof createServerSupabase>,
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const objectPath = `${today}/${filename}`;

  const { error } = await supabase.storage
    .from("social-public")
    .upload(objectPath, new Uint8Array(buffer), {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`supabase storage upload fail: ${error.message.slice(0, 200)}`);
  }

  const { data } = supabase.storage.from("social-public").getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new Error("supabase storage getPublicUrl returned empty");
  }
  return data.publicUrl;
}

async function renderSlide(svg: string): Promise<Buffer> {
  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 90, progressive: false, chromaSubsampling: "4:2:0" })
    .toBuffer();
}

// ─── Endpoint ─────────────────────────────────────────────────────

interface BriefData {
  title?: string;
  hook?: string;
  slides?: SlideSpec[];
  caption?: string;
  hashtags?: string;
  research_tier?: string;
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

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // Pre-load fonts (sanity check)
  try {
    getFonts();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `font load failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 },
    );
  }

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

      if (draft.format === "reel") {
        results.push({ briefId: brief.id, draftId: draft.id, status: "skipped_reel_manual" });
        continue;
      }

      await supabase.from("daily_briefs").update({ status: "rendering" }).eq("id", brief.id);

      const briefData = brief.brief as BriefData;

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
        const useSlides = slides.slice(0, 10);
        if (useSlides.length === 0) {
          await supabase.from("daily_briefs").update({ status: "failed", error: "no slides in brief" }).eq("id", brief.id);
          results.push({ briefId: brief.id, draftId: draft.id, status: "failed", error: "no slides" });
          continue;
        }
        for (let i = 0; i < useSlides.length; i++) {
          const svg = buildCarouselSlideSvg(useSlides[i], i, useSlides.length);
          const buf = await renderSlide(svg);
          const url = await uploadSupabaseStorage(supabase, buf, `slide-${draft.id.slice(0, 8)}-${i + 1}.jpg`);
          imageUrls.push(url);
        }
      } else if (draft.format === "story" || draft.format === "post") {
        const headline = briefData.title || briefData.hook || "Dark Room";
        const subline = (briefData.caption || "").split("\n")[0].slice(0, 150);
        const svg = buildStorySvg(headline, subline);
        const buf = await renderSlide(svg);
        const url = await uploadSupabaseStorage(supabase, buf, `${draft.format}-${draft.id.slice(0, 8)}.jpg`);
        imageUrls.push(url);
      } else {
        results.push({ briefId: brief.id, draftId: draft.id, status: "skipped_unknown_format" });
        continue;
      }

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
      results.push({ briefId: brief.id, draftId: draft.id, status: "enqueued", image_count: imageUrls.length });
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

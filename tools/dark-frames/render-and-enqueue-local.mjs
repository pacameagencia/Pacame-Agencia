#!/usr/bin/env node
/**
 * render-and-enqueue-local.mjs · workaround Vercel rate-limit (2026-05-07 noche).
 *
 * Replica /api/agents/render-and-enqueue corriendo LOCAL en Node:
 *   - Lee daily_briefs.status='generated' del día actual
 *   - Por cada uno: opentype.js → SVG → Sharp PNG → Supabase Storage social-public
 *   - Update content_queue draft → pending con caption + image_urls reales
 *   - Update daily_briefs status=enqueued
 *
 * Por qué existe: Vercel free tier saturó 100 deploys/día (reset 8-may 23:39 ES).
 * El endpoint web sigue con código viejo (catbox HTTP 412). Este script bypassa
 * Vercel para llenar pending hoy · mañana cron auto-publish (ya vivo en prod) los
 * despacha solo a IG.
 *
 * Uso:
 *   node tools/dark-frames/render-and-enqueue-local.mjs [--date=YYYY-MM-DD]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? "true"];
  }),
);

const TARGET_DATE = args.date || new Date().toISOString().slice(0, 10);

const W_CAROUSEL = 1080;
const H_CAROUSEL = 1350;
const W_STORY = 1080;
const H_STORY = 1920;
const TOP_UNSAFE = 100;
const BOT_UNSAFE = 260;
const MARGIN_X = 60;

const C = {
  bg: "#0A0A0A",
  acid: "#CFFF00",
  white: "#F2F2F2",
  ghost: "#8E8E8E",
};

// ─── Fonts (lazy) ─────────────────────────────────────────────────

const FONTS_DIR = path.join(ROOT, "web", "public", "fonts");

function loadFont(filename) {
  const buf = fs.readFileSync(path.join(FONTS_DIR, filename));
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return opentype.parse(arrayBuffer);
}

const FONTS = {
  anton: loadFont("Anton-Regular.ttf"),
  sgB: loadFont("SpaceGrotesk-Bold.ttf"),
  jbm: loadFont("JetBrainsMono-Regular.ttf"),
};

// ─── Text → SVG path helpers ──────────────────────────────────────

function textPath({ text, font, size, x, y, fill = "#fff", anchor = "start", letterSpacing = 0 }) {
  if (!text) return "";
  let drawX = x;
  let totalW = 0;
  let paths = "";

  if (letterSpacing === 0) {
    totalW = font.getAdvanceWidth(text, size);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    paths = font.getPath(text, drawX, y, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `);
  } else {
    const widths = [...text].map((ch) => font.getAdvanceWidth(ch, size));
    totalW = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, text.length - 1);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    let cur = drawX;
    [...text].forEach((ch, i) => {
      paths += font.getPath(ch, cur, y, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `);
      cur += widths[i] + letterSpacing;
    });
  }
  return paths;
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const testLine = current ? `${current} ${w}` : w;
    if (font.getAdvanceWidth(testLine, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Carousel slide builder ───────────────────────────────────────

function buildCarouselSlideSvg(slide, slideIdx, totalSlides) {
  const headline = (slide.headline || "").slice(0, 120).toUpperCase();
  const subline = (slide.subline || "").slice(0, 200);
  const isCover = slide.type === "cover" || slideIdx === 0;
  const isCta = slide.type === "cta" || slideIdx === totalSlides - 1;

  const headlineFontSize = isCover ? 90 : 64;
  const sublineFontSize = isCover ? 36 : 30;
  const maxTextWidth = W_CAROUSEL - 2 * MARGIN_X;

  const headlineLines = wrapText(headline, FONTS.anton, headlineFontSize, maxTextWidth);
  const sublineLines = wrapText(subline, FONTS.sgB, sublineFontSize, maxTextWidth);

  const totalHeight = headlineLines.length * (headlineFontSize + 10) + 40 + sublineLines.length * (sublineFontSize + 6);
  const safeHeight = H_CAROUSEL - TOP_UNSAFE - BOT_UNSAFE;
  let y = TOP_UNSAFE + Math.max(80, (safeHeight - totalHeight) / 2);

  let headlineSvg = "";
  for (const line of headlineLines) {
    y += headlineFontSize;
    headlineSvg += textPath({ text: line, font: FONTS.anton, size: headlineFontSize, x: W_CAROUSEL / 2, y, fill: C.acid, anchor: "middle", letterSpacing: -2 });
    y += 10;
  }

  y += 30;
  let sublineSvg = "";
  for (const line of sublineLines) {
    y += sublineFontSize;
    sublineSvg += textPath({ text: line, font: FONTS.sgB, size: sublineFontSize, x: W_CAROUSEL / 2, y, fill: C.white, anchor: "middle" });
    y += 6;
  }

  const counterSvg = textPath({ text: `${slideIdx + 1}/${totalSlides}`, font: FONTS.jbm, size: 22, x: W_CAROUSEL - MARGIN_X, y: H_CAROUSEL - 90, fill: C.ghost, anchor: "end" });
  const brandSvg = textPath({ text: "DARKROOMCREATIVE.CLOUD", font: FONTS.jbm, size: 22, x: MARGIN_X, y: H_CAROUSEL - 90, fill: C.ghost });

  let ctaSvg = "";
  if (isCta) {
    const pillX = (W_CAROUSEL - 600) / 2;
    const pillY = H_CAROUSEL - 220;
    ctaSvg = `<rect x="${pillX}" y="${pillY}" width="600" height="80" fill="${C.acid}" rx="40"/>${textPath({ text: "14 DIAS GRATIS · BIO", font: FONTS.anton, size: 36, x: W_CAROUSEL / 2, y: pillY + 56, fill: C.bg, anchor: "middle", letterSpacing: -1 })}`;
  }

  return `<svg width="${W_CAROUSEL}" height="${H_CAROUSEL}" xmlns="http://www.w3.org/2000/svg"><rect width="${W_CAROUSEL}" height="${H_CAROUSEL}" fill="${C.bg}"/>${headlineSvg}${sublineSvg}${ctaSvg}${counterSvg}${brandSvg}</svg>`;
}

function buildStorySvg(headline, subline) {
  const TOP = 250;
  const BOT = 250;
  const maxW = W_STORY - 2 * MARGIN_X;

  const hUpper = headline.slice(0, 100).toUpperCase();
  const hLines = wrapText(hUpper, FONTS.anton, 100, maxW);
  const sLines = wrapText(subline.slice(0, 120), FONTS.sgB, 40, maxW);

  const totalH = hLines.length * 110 + 60 + sLines.length * 50;
  const safeH = H_STORY - TOP - BOT;
  let y = TOP + Math.max(80, (safeH - totalH) / 2);

  let hSvg = "";
  for (const line of hLines) {
    y += 100;
    hSvg += textPath({ text: line, font: FONTS.anton, size: 100, x: W_STORY / 2, y, fill: C.acid, anchor: "middle", letterSpacing: -3 });
    y += 10;
  }

  y += 50;
  let sSvg = "";
  for (const line of sLines) {
    y += 40;
    sSvg += textPath({ text: line, font: FONTS.sgB, size: 40, x: W_STORY / 2, y, fill: C.white, anchor: "middle" });
    y += 10;
  }

  const brandSvg = textPath({ text: "DARKROOMCREATIVE.CLOUD", font: FONTS.jbm, size: 26, x: W_STORY / 2, y: H_STORY - BOT - 40, fill: C.ghost, anchor: "middle" });

  return `<svg width="${W_STORY}" height="${H_STORY}" xmlns="http://www.w3.org/2000/svg"><rect width="${W_STORY}" height="${H_STORY}" fill="${C.bg}"/>${hSvg}${sSvg}${brandSvg}</svg>`;
}

async function renderSlide(svg) {
  return await sharp(Buffer.from(svg)).jpeg({ quality: 90, progressive: false, chromaSubsampling: "4:2:0" }).toBuffer();
}

// ─── Supabase ─────────────────────────────────────────────────────

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function uploadStorage(buffer, filename) {
  const objectPath = `${TARGET_DATE}/${filename}`;
  const { error } = await sb.storage.from("social-public").upload(objectPath, new Uint8Array(buffer), {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`storage upload: ${error.message}`);
  const { data } = sb.storage.from("social-public").getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error("getPublicUrl empty");
  return data.publicUrl;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`📋 render-and-enqueue-local · date=${TARGET_DATE}`);

  const { data: briefs, error: bErr } = await sb
    .from("daily_briefs")
    .select("id, content_queue_id, brief, content_type, research_tier")
    .eq("date", TARGET_DATE)
    .eq("status", "generated");

  if (bErr) { console.error("ERR briefs:", bErr.message); process.exit(1); }
  if (!briefs?.length) { console.log("✓ no briefs to render (all enqueued or skipped)"); return; }

  console.log(`  ${briefs.length} briefs to process`);

  let okCount = 0;
  let failCount = 0;

  for (const brief of briefs) {
    try {
      const { data: draft, error: dErr } = await sb
        .from("content_queue")
        .select("id, format")
        .eq("id", brief.content_queue_id)
        .single();
      if (dErr || !draft) { failCount++; console.warn(`  ✗ ${brief.id.slice(0, 8)} draft not found`); continue; }
      if (draft.format === "reel") { console.log(`  ⏭ ${brief.id.slice(0, 8)} reel · skip (manual)`); continue; }

      await sb.from("daily_briefs").update({ status: "rendering" }).eq("id", brief.id);

      const briefData = brief.brief || {};
      if (briefData.skip_reason) {
        await sb.from("content_queue").update({ status: "skipped", error: `brief skip: ${String(briefData.skip_reason).slice(0, 200)}` }).eq("id", draft.id);
        await sb.from("daily_briefs").update({ status: "skipped", error: String(briefData.skip_reason).slice(0, 500) }).eq("id", brief.id);
        console.log(`  ⏭ ${brief.id.slice(0, 8)} skipped by brief`);
        continue;
      }

      const slides = briefData.slides || [];
      const caption = briefData.caption || "";
      const hashtags = briefData.hashtags || "";
      const imageUrls = [];

      if (draft.format === "carousel") {
        const useSlides = slides.slice(0, 10);
        if (!useSlides.length) {
          await sb.from("daily_briefs").update({ status: "failed", error: "no slides" }).eq("id", brief.id);
          failCount++; console.warn(`  ✗ ${brief.id.slice(0, 8)} no slides`); continue;
        }
        for (let i = 0; i < useSlides.length; i++) {
          const svg = buildCarouselSlideSvg(useSlides[i], i, useSlides.length);
          const buf = await renderSlide(svg);
          const url = await uploadStorage(buf, `slide-${draft.id.slice(0, 8)}-${i + 1}.jpg`);
          imageUrls.push(url);
        }
      } else if (draft.format === "story" || draft.format === "post") {
        const headline = briefData.title || briefData.hook || "Dark Room";
        const subline = (briefData.caption || "").split("\n")[0].slice(0, 150);
        const svg = buildStorySvg(headline, subline);
        const buf = await renderSlide(svg);
        const url = await uploadStorage(buf, `${draft.format}-${draft.id.slice(0, 8)}.jpg`);
        imageUrls.push(url);
      } else {
        console.log(`  ⏭ ${brief.id.slice(0, 8)} unknown format ${draft.format}`); continue;
      }

      const { error: uErr } = await sb.from("content_queue").update({
        status: "pending",
        caption,
        hashtags,
        image_urls: imageUrls,
      }).eq("id", draft.id);

      if (uErr) {
        await sb.from("daily_briefs").update({ status: "failed", error: `enqueue: ${uErr.message.slice(0, 200)}` }).eq("id", brief.id);
        failCount++; console.warn(`  ✗ ${brief.id.slice(0, 8)} enqueue: ${uErr.message}`); continue;
      }

      await sb.from("daily_briefs").update({ status: "enqueued" }).eq("id", brief.id);
      okCount++;
      console.log(`  ✓ ${brief.id.slice(0, 8)} ${draft.format} · ${imageUrls.length} imgs`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sb.from("daily_briefs").update({ status: "failed", error: msg.slice(0, 500) }).eq("id", brief.id);
      failCount++;
      console.warn(`  ✗ ${brief.id.slice(0, 8)} error: ${msg.slice(0, 150)}`);
    }
  }

  console.log(`\n✅ Done · ${okCount} OK · ${failCount} FAIL`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });

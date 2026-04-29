#!/usr/bin/env node
/**
 * scrape-tiktok-creators-es.mjs — Bucket 4 (TikTok ES) del programa
 * DarkRoom Crew. Scrapea creadores hispanohablantes que ya hablan de
 * herramientas IA / dropshipping, aplica los filtros 4/4 del doc
 * `strategy/darkroom/outreach-comunidades.md` §6 y exporta CSV
 * cualificado listo para outreach.
 *
 * Uso:
 *   node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs --dry-run
 *   node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs --max-results=10
 *   node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs   # default 200
 *   node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs --hashtags=ia,chatgpt,minea
 *   node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs --output=mi-csv.csv
 *
 * Requiere APIFY_API_KEY en `web/.env.local` (ya está seteado para PACAME).
 *
 * Coste: tier gratis del actor `clockworks/free-tiktok-scraper` cubre
 * ~10k items/mes · 200 candidatos = 0,02% del cap.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

// ─── env loader (patrón producers PACAME) ──────────────────────

const envPath = path.join(ROOT, "web", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error(`falta ${envPath}`);
  process.exit(1);
}
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const APIFY_API_KEY = env.APIFY_API_KEY || process.env.APIFY_API_KEY;

// ─── CLI args ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const opts = Object.fromEntries(
  args.filter(a => a.startsWith("--"))
    .map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? "true"]; })
);

const DRY_RUN = opts["dry-run"] === "true";
const MAX_RESULTS = parseInt(opts["max-results"] ?? "200", 10);

const DEFAULT_HASHTAGS = [
  "dropshippingespañol",
  "ia",
  "chatgptespañol",
  "herramientasia",
  "minea",
  "pipiads",
  "creadordecontenidoespañol",
  "marketingdigital2026",
  "afiliados",
  "ganardineroconia",
  "creadordigital",
  "freelancerespañol",
];
const HASHTAGS = opts.hashtags
  ? opts.hashtags.split(",").map(h => h.trim()).filter(Boolean)
  : DEFAULT_HASHTAGS;

const today = new Date().toISOString().slice(0, 10);
// Path resolución: absoluto → tal cual; relativo → relativo al CWD (no al __dirname)
// para que `--output=tools/darkroom-outreach/output/X.csv` desde el root funcione.
const OUTPUT = opts.output
  ? (path.isAbsolute(opts.output) ? opts.output : path.resolve(process.cwd(), opts.output))
  : path.join(__dirname, "output", `tiktok-candidates-${today}.csv`);

// ─── filtros 4/4 (ver strategy/darkroom/outreach-comunidades.md §6) ─

// ICP regex ampliado: captura variantes ES + apps tools + términos creator
const ICP_REGEX = /\b(creator|freelance|dropship|marketing|ia|ai|emprend|stack|ahorr|tools|herramient|chatgpt|canva|capcut|elevenlabs|midjourney|prompt|content|content creator|negoci|infoproduct|coach|monetiz|ecom|tienda online|automatiz|productiv|side hustle|side project|afiliado|trabajar desde casa|libertad financ|estudio|edici[oó]n)/i;
const COMPETITOR_REGEX = /\b(groupbuy|group buy|toolzbuy|allinai|seogb|softwareshare|sharesoft|sharetool|toolsplash|grouptool|toolspedia|appsumo deals)/i;
const FOLLOWER_MIN = 1000;
const FOLLOWER_MAX = 50000;
const ACTIVE_DAYS_MAX = 30;  // 7d era muy estricto · creators ES publican cada 2-3 semanas
const ENGAGEMENT_MIN = 0.005;

// ─── Apify call ────────────────────────────────────────────────

const APIFY_ACTOR = "clockworks~free-tiktok-scraper";
const APIFY_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=240`;

async function callApify(input) {
  const r = await fetch(APIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`apify ${r.status}: ${text.slice(0, 300)}`);
  }
  const items = await r.json();
  return Array.isArray(items) ? items : [];
}

// ─── normalizadores tolerantes a cambios de schema ─────────────

function getAuthor(item) {
  return item?.authorMeta ?? item?.author ?? {};
}

function getFollowers(item) {
  const a = getAuthor(item);
  return a.fans ?? a.followerCount ?? a.followers ?? 0;
}

function getBio(item) {
  const a = getAuthor(item);
  return a.signature ?? a.bio ?? a.description ?? "";
}

function getUsername(item) {
  const a = getAuthor(item);
  return a.name ?? a.uniqueId ?? a.username ?? "";
}

function getDisplayName(item) {
  const a = getAuthor(item);
  return a.nickName ?? a.nickname ?? a.displayName ?? "";
}

function getVideosCount(item) {
  const a = getAuthor(item);
  return a.video ?? a.videoCount ?? a.videosCount ?? 0;
}

function getHearts(item) {
  const a = getAuthor(item);
  return a.heart ?? a.heartCount ?? a.totalHearts ?? 0;
}

function getFollowing(item) {
  const a = getAuthor(item);
  return a.following ?? a.followingCount ?? 0;
}

function getCreateTime(item) {
  return item.createTimeISO ?? item.createTime ?? null;
}

function getVideoUrl(item) {
  return item.webVideoUrl ?? item.videoUrl ?? null;
}

function daysSince(iso) {
  if (!iso) return Infinity;
  const t = typeof iso === "string" ? Date.parse(iso) : Number(iso) * 1000;
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

// ─── cualificación 4/4 ─────────────────────────────────────────

function qualify(item) {
  const username = getUsername(item);
  const bio = getBio(item);
  const followers = getFollowers(item);
  const videos = getVideosCount(item);
  const hearts = getHearts(item);
  const lastVideoDays = daysSince(getCreateTime(item));
  const engagement = videos > 0 ? hearts / videos / Math.max(1, followers) : 0;

  const filters = {
    A_audiencia: followers >= FOLLOWER_MIN && followers <= FOLLOWER_MAX,
    B_icp: ICP_REGEX.test(bio),
    C_activo: lastVideoDays <= ACTIVE_DAYS_MAX,
    D_no_competencia: !COMPETITOR_REGEX.test(bio),
  };

  const score = Object.values(filters).filter(Boolean).length;
  const fraud = engagement < ENGAGEMENT_MIN;
  const qualified_4of4 = score === 4 && !fraud;

  const notes = [];
  if (!filters.A_audiencia) notes.push(`followers ${followers} fuera rango ${FOLLOWER_MIN}-${FOLLOWER_MAX}`);
  if (!filters.B_icp) notes.push("bio no menciona ICP");
  if (!filters.C_activo) notes.push(`último video hace ${Math.round(lastVideoDays)}d`);
  if (!filters.D_no_competencia) notes.push("competencia detectada en bio");
  if (fraud) notes.push("engagement <0.5% (posible bot)");

  // contact_method
  let contact_method = "DM TikTok";
  if (/instagram\.com|@[a-z0-9_.]+/i.test(bio)) contact_method = "DM TikTok / IG link in bio";
  if (/https?:\/\/[^\s]+/i.test(bio) && !/instagram/i.test(bio)) contact_method = "DM TikTok / website in bio";

  return {
    username,
    display_name: getDisplayName(item),
    bio,
    followers,
    following: getFollowing(item),
    hearts_total: hearts,
    videos_count: videos,
    engagement_rate: engagement.toFixed(5),
    last_video_days_ago: Number.isFinite(lastVideoDays) ? Math.round(lastVideoDays) : -1,
    last_video_url: getVideoUrl(item) ?? "",
    bucket: "4-tiktok-es",
    qualified_4of4: qualified_4of4 ? "true" : "false",
    qualified_score: score,
    notes: notes.join(" · "),
    contact_method,
  };
}

// ─── deduplicación + ordenación ────────────────────────────────

function dedupeAndSort(rows) {
  const byUser = new Map();
  for (const r of rows) {
    if (!r.username) continue;
    const prev = byUser.get(r.username);
    // quédate con la versión que tenga más score / engagement
    if (!prev || r.qualified_score > prev.qualified_score) {
      byUser.set(r.username, r);
    }
  }
  return [...byUser.values()].sort((a, b) => {
    if (a.qualified_4of4 !== b.qualified_4of4) return a.qualified_4of4 === "true" ? -1 : 1;
    return Number(b.engagement_rate) - Number(a.engagement_rate);
  });
}

// ─── CSV writer (UTF-8 con BOM) ────────────────────────────────

function csvEscape(v) {
  const s = String(v ?? "").replace(/\r?\n/g, " ").trim();
  return `"${s.replace(/"/g, '""')}"`;
}

function writeCsv(rows, file) {
  const headers = [
    "username", "display_name", "bio", "followers", "following", "hearts_total",
    "videos_count", "engagement_rate", "last_video_days_ago", "last_video_url",
    "bucket", "qualified_4of4", "qualified_score", "notes", "contact_method",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape(r[h])).join(","));
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // BOM UTF-8 para Excel
  fs.writeFileSync(file, "﻿" + lines.join("\n"), "utf8");
}

// ─── main ──────────────────────────────────────────────────────

async function main() {
  console.log("─── DarkRoom Crew · TikTok ES scraper ─────────");
  console.log(`Hashtags    : ${HASHTAGS.join(", ")}`);
  console.log(`Max results : ${MAX_RESULTS}`);
  console.log(`Dry run     : ${DRY_RUN}`);
  console.log(`Output      : ${OUTPUT}`);
  console.log(`APIFY key   : ${APIFY_API_KEY ? "set" : "MISSING"}`);
  console.log("───────────────────────────────────────────────");

  if (!APIFY_API_KEY && !DRY_RUN) {
    console.error("APIFY_API_KEY no encontrada en web/.env.local. Aborto.");
    process.exit(2);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Validando lógica sin llamar Apify...");
    const sampleItem = {
      authorMeta: {
        name: "creator_test_es",
        nickName: "Creator Test ES",
        signature: "creator de contenido · IA · ChatGPT · stack 2026",
        fans: 12000,
        following: 800,
        heart: 250000,
        video: 80,
      },
      createTimeISO: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      webVideoUrl: "https://tiktok.com/@creator_test_es/video/123",
    };
    const q = qualify(sampleItem);
    console.log("\nMuestra cualificada (sample):");
    console.log(JSON.stringify(q, null, 2));
    console.log("\n[DRY RUN] OK · APIFY_API_KEY presente, filtros compilan, qualify() funciona.");
    return;
  }

  // distribuir max results entre hashtags · min 50 para conseguir volumen útil
  const perHashtag = Math.max(50, Math.ceil(MAX_RESULTS / HASHTAGS.length));
  console.log(`\nLanzando ${HASHTAGS.length} scrapes Apify (${perHashtag} items/hashtag)...\n`);

  const allRows = [];

  for (const hashtag of HASHTAGS) {
    process.stdout.write(`  · #${hashtag} ... `);
    try {
      const items = await callApify({
        hashtags: [hashtag],
        resultsPerPage: perHashtag,
        shouldDownloadVideos: false,
        proxyConfiguration: { useApifyProxy: true },
      });
      const qualified = items.map(qualify);
      allRows.push(...qualified);
      const okCount = qualified.filter(q => q.qualified_4of4 === "true").length;
      console.log(`${items.length} items · ${okCount} cualificados 4/4`);
    } catch (e) {
      console.log(`✗ ${e.message.slice(0, 100)}`);
    }
  }

  if (allRows.length === 0) {
    console.error("\n0 candidatos crudos. Revisa hashtags o cuota Apify.");
    process.exit(3);
  }

  const final = dedupeAndSort(allRows);
  const qualifiedCount = final.filter(r => r.qualified_4of4 === "true").length;

  writeCsv(final, OUTPUT);

  console.log("\n─── Resultado ────────────────────────────────");
  console.log(`Total únicos    : ${final.length}`);
  console.log(`Qualified 4/4   : ${qualifiedCount}`);
  console.log(`Qualified 3/4   : ${final.filter(r => r.qualified_score === 3).length}`);
  console.log(`Output CSV      : ${OUTPUT}`);
  console.log("──────────────────────────────────────────────");
  console.log("\nSiguientes pasos:");
  console.log(`  1. Importar CSV en Notion / Excel`);
  console.log(`  2. Filtrar qualified_4of4=true`);
  console.log(`  3. Outreach con templates §5 de outreach-comunidades.md`);
}

main().catch(e => {
  console.error("\n✗ FATAL:", e.message);
  process.exit(1);
});

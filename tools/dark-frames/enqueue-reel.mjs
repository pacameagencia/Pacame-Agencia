#!/usr/bin/env node
/**
 * Enqueue REEL DARK_FRAMES con quality gate de 8 checks.
 *
 * Sustituye al `publish-reel.mjs` manual del flujo antiguo. Si los 8 checks
 * pasan, el MP4 entra a `content_queue` con format='reel' y el cron
 * `/api/agents/auto-publish` lo publica automáticamente en la ventana
 * programada via `publishReel()` de `web/lib/instagram.ts`.
 *
 * Si CUALQUIER check falla → aborta sin insertar fila + registra rechazo
 * en `dark_frames_quality_log` para debug e iteración del gate.
 *
 * Memory: feedback_no_video_auto.md (revisada 2026-05-07).
 *
 * Uso:
 *   node tools/dark-frames/enqueue-reel.mjs <carpeta-output-concept> --when=2026-05-12T17:30:00Z
 *
 * Carpeta esperada (output de render-piece.mjs):
 *   <folder>/
 *     reel.mp4         (1080x1920, 5-90s, outro Dark Room en últimos 2s)
 *     CAPTION.md       (bloque ``` ``` con caption + hashtags)
 *     meta.json        (concept_id, cost_guard_token, visual_reviewer_status, etc)
 *
 * Flags:
 *   --when=ISO          fecha programada (default: now)
 *   --brand=darkroom    siempre darkroom para esta serie (default)
 *   --slot=adhoc        morning|evening|adhoc (default: adhoc)
 *   --skip-gate         BYPASS del quality gate (solo para debug, REGISTRA rechazo)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";
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

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--"));
if (!folder) {
  console.error("uso: enqueue-reel.mjs <carpeta-output> [--when=ISO] [--slot=adhoc] [--skip-gate]");
  process.exit(1);
}

const opts = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v ?? "true"];
    }),
);

const BRAND = opts.brand || "darkroom";
const SLOT = opts.slot || "adhoc";
const WHEN = opts.when ? new Date(opts.when).toISOString() : new Date().toISOString();
const SKIP_GATE = opts["skip-gate"] === "true";

const folderPath = path.resolve(folder);
if (!fs.existsSync(folderPath)) {
  console.error(`no existe: ${folderPath}`);
  process.exit(1);
}

console.log(`📋 enqueue-reel · folder=${path.basename(folderPath)} · when=${WHEN}`);

// ─── Quality Gate ──────────────────────────────────────────────────

const reelPath = path.join(folderPath, "reel.mp4");
const captionPath = path.join(folderPath, "CAPTION.md");
const metaPath = path.join(folderPath, "meta.json");
const outroRefPath = path.resolve(__dirname, "assets", "outro-darkroom-2s.mp4");

const checks = {};
let failedCheck = null;
let failedReason = null;

function fail(check, reason) {
  if (!failedCheck) {
    failedCheck = check;
    failedReason = reason;
  }
  checks[check] = { passed: false, reason };
}

function pass(check, info) {
  checks[check] = { passed: true, ...(info ? { info } : {}) };
}

// CHECK 1: archivos obligatorios presentes
if (!fs.existsSync(reelPath)) fail("files_present", "reel.mp4 no existe");
else if (!fs.existsSync(captionPath)) fail("files_present", "CAPTION.md no existe");
else if (!fs.existsSync(metaPath)) fail("files_present", "meta.json no existe");
else pass("files_present");

// CHECK 2: meta.json válido + concept_id registrado
let meta = null;
let conceptId = null;
if (!failedCheck) {
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    conceptId = meta.concept_id;
    if (!conceptId || typeof conceptId !== "string") {
      fail("concept_id_present", "meta.json sin concept_id (string)");
    } else {
      const conceptFile = path.resolve(__dirname, "concepts", `${conceptId}.json`);
      if (!fs.existsSync(conceptFile)) {
        fail("concept_id_registered", `concept_id=${conceptId} no existe en tools/dark-frames/concepts/`);
      } else {
        pass("concept_id_present", { concept_id: conceptId });
        pass("concept_id_registered", { concept_file: path.basename(conceptFile) });
      }
    }
  } catch (e) {
    fail("meta_json_valid", `meta.json malformado: ${e.message}`);
  }
}

// CHECK 3: cost-guard token válido (si modelo es Veo o Seedance)
if (!failedCheck && meta) {
  const expensiveModels = ["veo3", "veo3lite", "veo3.1", "seedance", "soul_cinema"];
  const usedExpensive = (meta.models_used || []).some((m) => expensiveModels.some((e) => m.toLowerCase().includes(e)));
  if (usedExpensive) {
    if (!meta.cost_guard_token || typeof meta.cost_guard_token !== "string" || meta.cost_guard_token.length < 16) {
      fail("cost_guard_token", "modelo premium usado pero sin cost_guard_token válido (min 16 chars)");
    } else {
      pass("cost_guard_token", { token_prefix: meta.cost_guard_token.slice(0, 8) + "…" });
    }
  } else {
    pass("cost_guard_token", { skipped: "no expensive model used" });
  }
}

// CHECK 4: visual-reviewer aprobó
if (!failedCheck && meta) {
  if (meta.visual_reviewer_status !== "approved") {
    fail("visual_reviewer_approved", `visual_reviewer_status='${meta.visual_reviewer_status}', se esperaba 'approved'`);
  } else {
    pass("visual_reviewer_approved", { reviewed_at: meta.visual_reviewer_at });
  }
}

// CHECK 5: duración 5-90s y resolución 1080x1920 (ffprobe)
let probe = null;
if (!failedCheck) {
  try {
    const ffprobeRaw = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name,duration -of json "${reelPath}"`,
      { encoding: "utf8" },
    );
    const parsed = JSON.parse(ffprobeRaw);
    probe = parsed.streams[0];
    const dur = parseFloat(probe.duration);
    const w = parseInt(probe.width);
    const h = parseInt(probe.height);

    if (dur < 5 || dur > 90) {
      fail("duration_range", `duration=${dur}s fuera de [5, 90]s`);
    } else if (w !== 1080 || h !== 1920) {
      fail("resolution_correct", `${w}x${h} no es 1080x1920 (9:16)`);
    } else {
      pass("duration_range", { duration_s: dur });
      pass("resolution_correct", { width: w, height: h, codec: probe.codec_name });
    }
  } catch (e) {
    fail("ffprobe_run", `ffprobe falló: ${e.message}`);
  }
}

// CHECK 6: outro Dark Room presente (frame del segundo final vs referencia)
if (!failedCheck && fs.existsSync(outroRefPath)) {
  try {
    const dur = parseFloat(probe.duration);
    const tmpFrame = path.join(folderPath, ".outro-check-frame.png");
    const tmpRef = path.join(folderPath, ".outro-ref-frame.png");
    execSync(
      `ffmpeg -y -ss ${(dur - 0.5).toFixed(2)} -i "${reelPath}" -vframes 1 "${tmpFrame}"`,
      { stdio: "pipe" },
    );
    execSync(`ffmpeg -y -ss 1.5 -i "${outroRefPath}" -vframes 1 "${tmpRef}"`, { stdio: "pipe" });

    const frameStats = await sharp(tmpFrame).resize(64, 64).greyscale().raw().toBuffer();
    const refStats = await sharp(tmpRef).resize(64, 64).greyscale().raw().toBuffer();
    let diff = 0;
    for (let i = 0; i < frameStats.length; i++) diff += Math.abs(frameStats[i] - refStats[i]);
    const meanDiff = diff / frameStats.length;

    fs.unlinkSync(tmpFrame);
    fs.unlinkSync(tmpRef);

    // Threshold ~25 = mismo brand frame con tolerancia. >40 = outro distinto/ausente.
    if (meanDiff > 40) {
      fail("outro_present", `outro Dark Room no detectado (frame diff promedio ${meanDiff.toFixed(1)} > 40)`);
    } else {
      pass("outro_present", { mean_pixel_diff: meanDiff.toFixed(1) });
    }
  } catch (e) {
    fail("outro_check", `outro check falló: ${e.message}`);
  }
} else if (!failedCheck) {
  console.log("  ⚠️  outro reference no existe aún, skipping check (primer reel del proyecto)");
  pass("outro_present", { skipped: "outro reference not found yet" });
}

// CHECK 7: caption tiene CTA Dark Room
let caption = "";
let hashtags = "";
if (!failedCheck) {
  const raw = fs.readFileSync(captionPath, "utf8");
  const m = raw.match(/```[a-z]*\s*\n([\s\S]*?)\n```/);
  if (!m) {
    fail("caption_block_present", "CAPTION.md sin bloque ``` ```");
  } else {
    const full = m[1].trim();
    const idx = full.lastIndexOf("\n#");
    if (idx > 0 && full.slice(idx + 1).match(/^#\w+/)) {
      caption = full.slice(0, idx).trim();
      hashtags = full.slice(idx + 1).trim();
    } else {
      caption = full;
    }
    const lower = (caption + " " + hashtags).toLowerCase();
    if (!lower.includes("dark room") && !lower.includes("darkroom")) {
      fail("caption_has_cta", "caption sin mención 'Dark Room' o 'darkroomcreative.cloud'");
    } else {
      pass("caption_has_cta");
    }
  }
}

// CHECK 8: hashtag de serie presente
if (!failedCheck) {
  const seriesTag = (meta?.series_hashtag || "#DarkFrames").toLowerCase();
  if (!hashtags.toLowerCase().includes(seriesTag)) {
    fail("series_hashtag_present", `hashtag '${seriesTag}' no encontrado en CAPTION`);
  } else {
    pass("series_hashtag_present", { tag: seriesTag });
  }
}

// ─── Resultado del gate ───────────────────────────────────────────

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const passed = !failedCheck;

console.log(`\n${passed ? "✅" : "❌"} Quality gate · ${Object.keys(checks).length} checks`);
for (const [name, r] of Object.entries(checks)) {
  console.log(`  ${r.passed ? "✓" : "✗"} ${name}${r.reason ? ` — ${r.reason}` : ""}`);
}

// Registrar SIEMPRE en quality_log (pase o no, sirve para debug e iteración)
const logRow = {
  concept_id: conceptId || "unknown",
  folder_path: path.basename(folderPath),
  passed,
  failed_check: failedCheck,
  failed_reason: failedReason,
  checks,
};

if (!passed && !SKIP_GATE) {
  await supabase.from("dark_frames_quality_log").insert(logRow);
  console.error(`\n❌ ABORTADO · check fallido: ${failedCheck} — ${failedReason}`);
  console.error("   No se ha encolado nada. Revisa el reel y vuelve a intentar.");
  console.error("   Para forzar bypass del gate (debug solo): añade --skip-gate");
  process.exit(2);
}

if (!passed && SKIP_GATE) {
  console.warn("\n⚠️  --skip-gate activo · gate falló pero continúa por petición explícita");
}

// ─── Subir MP4 a catbox.moe + insert content_queue ────────────────

console.log("\n↑ subiendo reel.mp4 a catbox.moe…");

async function uploadCatboxVideo(localPath) {
  const buf = fs.readFileSync(localPath);
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", new Blob([buf], { type: "video/mp4" }), path.basename(localPath));
  const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
  if (!r.ok) throw new Error(`catbox ${r.status}`);
  const url = (await r.text()).trim();
  if (!url.startsWith("https://")) throw new Error(`catbox bad: ${url.slice(0, 100)}`);
  return url;
}

const videoUrl = await uploadCatboxVideo(reelPath);
console.log(`  ✓ ${videoUrl}`);

const insertRow = {
  scheduled_at: WHEN,
  brand: BRAND,
  slot: SLOT,
  format: "reel",
  image_urls: null,
  video_url: videoUrl,
  caption,
  hashtags: hashtags || null,
  source: "dark-frames-pipeline",
  notes: `concept=${conceptId} folder=${path.basename(folderPath)}`,
  video_meta: {
    duration_s: probe ? parseFloat(probe.duration) : null,
    width: probe ? parseInt(probe.width) : null,
    height: probe ? parseInt(probe.height) : null,
    codec: probe?.codec_name,
    source_concept_id: conceptId,
    cost_guard_token: meta?.cost_guard_token || null,
    visual_reviewer_status: meta?.visual_reviewer_status,
    visual_reviewer_at: meta?.visual_reviewer_at,
    models_used: meta?.models_used || [],
    quality_gate_checks: checks,
  },
};

const { data, error } = await supabase
  .from("content_queue")
  .insert(insertRow)
  .select("id")
  .single();

if (error) {
  console.error(`\n❌ insert fail: ${error.message}`);
  process.exit(1);
}

logRow.enqueued_id = data.id;
await supabase.from("dark_frames_quality_log").insert(logRow);

console.log(`\n✅ encolado · id=${data.id} · scheduled=${WHEN}`);
console.log(`   El cron /api/agents/auto-publish lo publicará en la ventana programada.`);

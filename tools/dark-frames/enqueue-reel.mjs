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
import crypto from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { runSemanticGate } from "./lib/semantic-gate.mjs";

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

// CHECK 3: cost-guard token VERIFICADO contra Supabase (si modelo premium)
// (fix CRITICAL #2 · 2026-05-07 · migration 045_cost_guard_tokens.sql)
// Antes: solo verificábamos length ≥16. Cualquiera podía generar uno sin autorización.
// Ahora: el token debe haber sido emitido vía emit-cost-guard.mjs por persona autorizada,
// estar vinculado a este concept_id, no usado, no expirado.
// Se consume atómicamente vía función Postgres consume_cost_guard_token() — single-use.
const supabaseEarly = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

if (!failedCheck && meta) {
  const expensiveModels = ["veo3", "veo3lite", "veo3.1", "seedance", "soul_cinema", "cinema_studio_video"];
  const usedExpensive = (meta.models_used || []).some((m) =>
    expensiveModels.some((e) => m.toLowerCase().replace(/[._]/g, "").includes(e.replace(/[._]/g, ""))),
  );
  if (usedExpensive) {
    if (!meta.cost_guard_token || typeof meta.cost_guard_token !== "string") {
      fail("cost_guard_token_present", "modelo premium usado pero sin cost_guard_token en meta.json");
    } else {
      // Verificar + consumir atomically vía función Postgres
      const { data: rpcResult, error: rpcErr } = await supabaseEarly.rpc("consume_cost_guard_token", {
        p_token: meta.cost_guard_token,
        p_concept_id: meta.concept_id,
        p_render_id: path.basename(folderPath),
      });

      if (rpcErr) {
        fail("cost_guard_token_verify", `Supabase RPC error: ${rpcErr.message}`);
      } else if (!rpcResult || rpcResult.length === 0) {
        fail("cost_guard_token_verify", "RPC devolvió respuesta vacía");
      } else {
        const { success, error_message } = rpcResult[0];
        if (!success) {
          fail("cost_guard_token_valid", error_message || "token rejected sin razón específica");
        } else {
          pass("cost_guard_token", {
            token_prefix: meta.cost_guard_token.slice(0, 8) + "…",
            consumed_for: path.basename(folderPath),
          });
        }
      }
    }
  } else {
    pass("cost_guard_token", { skipped: "no premium model used" });
  }
}

// CHECK 4: visual-reviewer aprobó CON FIRMA CRIPTOGRÁFICA Ed25519 válida
// (fix CRITICAL #1 · 2026-05-07 · regla feedback_signed_approvals.md)
// El campo visual_reviewer_status='approved' ya NO basta — debe ir firmado
// con clave privada Ed25519 (PACAME_VISUAL_REVIEWER_PRIVATE_KEY) y verificado
// contra la pública en tools/dark-frames/keys/visual-reviewer.pub.pem.
if (!failedCheck && meta) {
  if (meta.visual_reviewer_status !== "approved") {
    fail("visual_reviewer_approved", `visual_reviewer_status='${meta.visual_reviewer_status}', se esperaba 'approved'`);
  } else if (!meta.visual_reviewer_signature || !meta.visual_reviewer_mp4_sha256) {
    fail(
      "visual_reviewer_signed",
      "approval sin firma criptográfica · ejecuta sign-approval.mjs <folder> --reason='...'",
    );
  } else {
    // Verificar firma:
    // 1. Recalcular SHA-256 del MP4 actual
    // 2. Comparar con meta.visual_reviewer_mp4_sha256 (detecta tampering del MP4 post-aprobación)
    // 3. Verificar firma Ed25519 sobre el hash con clave pública
    try {
      const reelBufferNow = fs.readFileSync(reelPath);
      const sha256Now = crypto.createHash("sha256").update(reelBufferNow).digest("hex");

      if (sha256Now !== meta.visual_reviewer_mp4_sha256) {
        fail(
          "visual_reviewer_mp4_unmodified",
          `MP4 modificado tras aprobación · sha256 actual ${sha256Now.slice(0, 16)}… ≠ aprobado ${meta.visual_reviewer_mp4_sha256.slice(0, 16)}…`,
        );
      } else {
        const pubKeyPath = path.resolve(__dirname, "keys", "visual-reviewer.pub.pem");
        if (!fs.existsSync(pubKeyPath)) {
          fail("visual_reviewer_pubkey", `clave pública no existe en ${pubKeyPath}`);
        } else {
          const pubKeyPem = fs.readFileSync(pubKeyPath, "utf8");
          const publicKey = crypto.createPublicKey({ key: pubKeyPem, format: "pem", type: "spki" });
          const signatureBuf = Buffer.from(meta.visual_reviewer_signature, "base64");
          const valid = crypto.verify(null, Buffer.from(sha256Now, "hex"), publicKey, signatureBuf);
          if (!valid) {
            fail(
              "visual_reviewer_signature_valid",
              "firma Ed25519 inválida · meta.json fue editado a mano sin pasar por sign-approval.mjs",
            );
          } else {
            pass("visual_reviewer_approved", {
              reviewed_at: meta.visual_reviewer_at,
              signed_by: meta.visual_reviewer_signed_by,
              reason: (meta.visual_reviewer_reason || "").slice(0, 60),
              signature_prefix: meta.visual_reviewer_signature.slice(0, 16) + "…",
            });
          }
        }
      }
    } catch (e) {
      fail("visual_reviewer_signature_verify", `error verificando firma: ${e.message}`);
    }
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

// CHECK 9: gate semántico Claude Vision (FIX CRITICAL #3 · 2026-05-07)
// Antes: los 8 checks técnicos NO detectaban contenido problemático.
// Ahora: extrae 4 frames del MP4 y los pasa a Claude Vision para análisis de:
// NSFW, hate symbols, recognizable faces, copyright leak, legible text, brand logos.
// Si CUALQUIER dimensión >70/100 → bloquea con razón específica.
// Coste ~$0.01-0.03 por análisis. Para 4 reels/mes ≈ $0.10. Despreciable.
if (!failedCheck && !SKIP_GATE) {
  const claudeKey = env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY;
  if (!claudeKey) {
    console.warn("  ⚠️  CLAUDE_API_KEY/ANTHROPIC_API_KEY ausente · gate semántico SKIPPED");
    pass("semantic_content_safe", { skipped: "no Claude API key" });
  } else {
    try {
      // Cargar concept JSON original (necesario para context del análisis)
      const conceptFilePath = path.resolve(__dirname, "concepts", `${conceptId}.json`);
      const conceptData = JSON.parse(fs.readFileSync(conceptFilePath, "utf8"));

      console.log(`  🔍 ejecutando gate semántico Claude Vision (~5-10s)…`);
      const result = await runSemanticGate({
        mp4Path: reelPath,
        concept: conceptData,
        apiKey: claudeKey,
      });

      if (!result.passed) {
        fail("semantic_content_safe", result.blocking_reason);
      } else {
        pass("semantic_content_safe", {
          scores: {
            nsfw: result.scores.nsfw_risk,
            hate: result.scores.hate_symbols,
            faces: result.scores.recognizable_faces,
            copyright: result.scores.copyright_leak,
            text: result.scores.legible_text,
            logos: result.scores.brand_logos,
          },
          assessment: (result.scores.overall_assessment || "").slice(0, 100),
        });
      }
    } catch (e) {
      // Si gate semántico falla técnicamente, NO bloqueamos automáticamente
      // (puede ser timeout API, rate limit). Loggeamos warning y continuamos.
      // Pero si era una violación real detectada, sí bloqueamos arriba.
      console.warn(`  ⚠️  gate semántico error técnico: ${e.message.slice(0, 200)}`);
      fail("semantic_content_safe_run", `Claude Vision falló: ${e.message.slice(0, 200)} · revisa manualmente o reintenta`);
    }
  }
}

// ─── Resultado del gate ───────────────────────────────────────────

// Reusamos el cliente Supabase ya creado en CHECK 3 (supabaseEarly)
const supabase = supabaseEarly;

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

/**
 * cost-guard.mjs — Hard guard contra gasto accidental en modelos vídeo premium.
 *
 * POR QUÉ EXISTE
 *   Pablo perdió ~20€ generando vídeos Veo 3.1 en pruebas de prompt sin querer.
 *   Las "memorias" no sirven: solo aplican a Claude, no a un script que un dev/agente
 *   puede ejecutar a las tantas. Esto vive en código y aborta el proceso si falta
 *   aprobación explícita y vigente.
 *
 * MODELO DE CONFIANZA
 *   - Tarifa por modelo conocida (ATLAS Cloud · ver carruseles-darkroom/lib/cost-guard-rates.json).
 *   - Antes de llamar a un modelo premium, el script estima coste total y exige un
 *     "approval token" depositado en `carruseles-darkroom/.approvals/` con:
 *       - id único (model + timestamp)
 *       - propósito (what_for)
 *       - tope monetario aprobado (cap_usd)
 *       - caducidad (expires_at, default +30 min)
 *       - usos restantes (uses_left, default 1 — un solo run)
 *   - Cada llamada consume 1 uso del token. Si caduca o se agota → abort.
 *   - Sin token → abort con instrucciones claras de cómo crearlo.
 *
 * MODELOS BLOQUEADOS POR DEFECTO (premium)
 *   - google/veo3*           ($0.05–$0.20 por segundo)
 *   - bytedance/seedance-2*  ($0.10–$0.13 por segundo)
 *   - kwaivgi/kling-v*       ($0.09–$0.20 por segundo)
 *   - openai/sora-2*         ($0.10 por segundo)
 *   - runway/*               (variable)
 *
 * MODELOS PERMITIDOS SIN TOKEN
 *   - Cualquier modelo de imagen (text-to-image, image-to-image)
 *   - Modelos vídeo "lite/fast" expresamente listados en SAFE_VIDEO_MODELS
 *   - TTS (ElevenLabs, etc.)
 *
 * USO EN UN PRODUCER
 *   import { assertVideoApproved } from "./lib/cost-guard.mjs";
 *
 *   // Antes del primer atlasVideo()
 *   await assertVideoApproved({
 *     model: "google/veo3.1/image-to-video",
 *     scenes: 5,
 *     durationPerScene: 6,
 *     purpose: "teaser-pacame-v2 produccion final",
 *   });
 *
 *   // Si falla, el proceso aborta con código de salida 2.
 *
 * APROBAR UN RUN (Pablo)
 *   node carruseles-darkroom/lib/cost-guard.mjs approve \
 *     --model="google/veo3.1/image-to-video" \
 *     --cap=8 \
 *     --uses=1 \
 *     --ttl=30 \
 *     --what="teaser-pacame-v2 produccion final"
 *
 *   Imprime el token. La aprobación caduca en 30 min y permite 1 ejecución.
 *
 * REVOCAR / LISTAR
 *   node carruseles-darkroom/lib/cost-guard.mjs list
 *   node carruseles-darkroom/lib/cost-guard.mjs revoke <token-id>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPROVALS_DIR = path.resolve(__dirname, "..", ".approvals");
const RATES_FILE = path.join(__dirname, "cost-guard-rates.json");

fs.mkdirSync(APPROVALS_DIR, { recursive: true });

// ───────── Tarifas y clasificación de modelos ─────────

let RATES;
try {
  RATES = JSON.parse(fs.readFileSync(RATES_FILE, "utf8"));
} catch {
  // Defaults razonables — actualizar via cost-guard-rates.json si Atlas cambia precios.
  RATES = {
    "google/veo3.1/image-to-video":        { usd_per_sec: 0.20, kind: "premium" },
    "google/veo3.1-fast/image-to-video":   { usd_per_sec: 0.10, kind: "premium" },
    "google/veo3.1-lite/image-to-video":   { usd_per_sec: 0.05, kind: "premium" },
    "google/veo3/image-to-video":          { usd_per_sec: 0.20, kind: "premium" },
    "bytedance/seedance-2.0/image-to-video":      { usd_per_sec: 0.127, kind: "premium" },
    "bytedance/seedance-2.0-fast/image-to-video": { usd_per_sec: 0.101, kind: "premium" },
    "kwaivgi/kling-v3.0-pro/image-to-video":      { usd_per_sec: 0.095, kind: "premium" },
    "kwaivgi/kling-v2.6/image-to-video":          { usd_per_sec: 0.10, kind: "premium" },
    "kwaivgi/kling-v2.1-pro/image-to-video":      { usd_per_sec: 0.10, kind: "premium" },
    "openai/sora-2/image-to-video":               { usd_per_sec: 0.10, kind: "premium" },
    // Modelos baratos — permitidos sin token (kind=safe)
    "alibaba/wan-2.7-pro/text-to-image":   { usd_per_unit: 0.064, kind: "safe" },
    "google/nano-banana-2/text-to-image":  { usd_per_unit: 0.039, kind: "safe" },
    "google/nano-banana-pro/text-to-image":{ usd_per_unit: 0.039, kind: "safe" },
  };
}

function classify(model) {
  if (!model) return { kind: "unknown" };
  if (RATES[model]) return RATES[model];
  // Heurística por prefijo si el modelo exacto no está en la tabla
  if (/^(google\/veo|bytedance\/seedance|kwaivgi\/kling|openai\/sora|runway\/)/i.test(model)) {
    return { kind: "premium", usd_per_sec: 0.20 }; // peor caso, conservador
  }
  if (/text-to-image|image-to-image/i.test(model)) {
    return { kind: "safe", usd_per_unit: 0.10 };
  }
  return { kind: "unknown" };
}

// ───────── Approval tokens ─────────

function tokenPath(id) {
  return path.join(APPROVALS_DIR, `${id}.json`);
}

function listTokens() {
  if (!fs.existsSync(APPROVALS_DIR)) return [];
  return fs.readdirSync(APPROVALS_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(APPROVALS_DIR, f), "utf8")); }
      catch { return null; }
    })
    .filter(Boolean);
}

function findActiveToken({ model }) {
  const now = Date.now();
  return listTokens().find(t =>
    t.model === model &&
    t.uses_left > 0 &&
    new Date(t.expires_at).getTime() > now
  );
}

function consumeToken(token) {
  token.uses_left -= 1;
  token.last_used_at = new Date().toISOString();
  fs.writeFileSync(tokenPath(token.id), JSON.stringify(token, null, 2));
  if (token.uses_left <= 0) {
    // Lo dejamos en disco como historial; el findActiveToken filtra por uses_left>0
  }
}

// ───────── API pública ─────────

/**
 * Aborta el proceso si no hay aprobación vigente para un modelo premium.
 *
 * @param {object} args
 * @param {string} args.model — identificador exacto del modelo Atlas (e.g., "google/veo3.1/image-to-video")
 * @param {number} [args.scenes=1] — número de clips
 * @param {number} [args.durationPerScene] — segundos por clip (para premium video)
 * @param {string} [args.purpose] — qué se está produciendo (para auditoría)
 * @returns {Promise<{approved: true, token: object, estimated_usd: number}>}
 */
export async function assertVideoApproved({ model, scenes = 1, durationPerScene = 0, purpose = "(no purpose)" }) {
  const meta = classify(model);
  const totalSec = scenes * durationPerScene;
  const estimated_usd =
    meta.usd_per_sec ? totalSec * meta.usd_per_sec :
    meta.usd_per_unit ? scenes * meta.usd_per_unit :
    null;

  // 1. Modelos seguros pasan sin token
  if (meta.kind === "safe") {
    return { approved: true, token: null, estimated_usd };
  }

  // 2. Modelos desconocidos → bloqueamos por seguridad (mejor falso positivo que coste sorpresa)
  if (meta.kind === "unknown") {
    abort(`COST GUARD · modelo desconocido "${model}".\nNo está clasificado en cost-guard-rates.json. Por seguridad se bloquea.\nAñádelo con kind="safe" o kind="premium" y un usd_per_sec/usd_per_unit antes de seguir.`);
  }

  // 3. Modelos premium: necesitan token vigente
  const token = findActiveToken({ model });
  if (!token) {
    abort(buildMissingTokenMessage({ model, scenes, durationPerScene, estimated_usd, purpose }));
  }

  // 4. Verificar que el cap del token cubre el coste estimado
  if (estimated_usd != null && estimated_usd > token.cap_usd) {
    abort(`COST GUARD · token ${token.id} aprueba hasta $${token.cap_usd.toFixed(2)} pero la estimación es $${estimated_usd.toFixed(2)}.\nReaprobar con --cap=${Math.ceil(estimated_usd * 1.2)}`);
  }

  consumeToken(token);
  console.log(`✓ COST GUARD · ${model} aprobado por token ${token.id} (estimado $${(estimated_usd ?? 0).toFixed(2)}, usos restantes ${token.uses_left})`);
  return { approved: true, token, estimated_usd };
}

function buildMissingTokenMessage({ model, scenes, durationPerScene, estimated_usd, purpose }) {
  const cap = estimated_usd != null ? Math.ceil(estimated_usd * 1.2) : 5;
  return [
    `COST GUARD · NO HAY APROBACIÓN VIGENTE para modelo premium "${model}".`,
    ``,
    `   Propósito declarado: ${purpose}`,
    `   Estimación: ${scenes} escena(s) × ${durationPerScene}s = ${(scenes * durationPerScene)}s` +
      (estimated_usd != null ? ` ≈ $${estimated_usd.toFixed(2)} USD` : ` (sin coste estimable)`),
    ``,
    `Para aprobar este run (1 ejecución, caduca en 30 min):`,
    ``,
    `   node carruseles-darkroom/lib/cost-guard.mjs approve \\`,
    `     --model="${model}" \\`,
    `     --cap=${cap} \\`,
    `     --uses=1 \\`,
    `     --ttl=30 \\`,
    `     --what="${purpose}"`,
    ``,
    `Después relanza este script. La aprobación es de un solo uso.`,
    ``,
    `Si NO querías gastar dinero, simplemente NO ejecutes el approve. Este script aborta aquí.`,
  ].join("\n");
}

function abort(msg) {
  console.error("\n╔════════════════════════════════════════════════════════════════╗");
  console.error("║                       COST GUARD ABORT                        ║");
  console.error("╚════════════════════════════════════════════════════════════════╝\n");
  console.error(msg);
  console.error("");
  process.exit(2);
}

// ───────── CLI: approve / list / revoke ─────────

async function cliMain() {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = Object.fromEntries(
    rest.filter(a => a.startsWith("--"))
      .map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? "true"]; })
  );

  if (cmd === "approve") {
    const model = opts.model;
    const cap = parseFloat(opts.cap ?? "5");
    const uses = parseInt(opts.uses ?? "1", 10);
    const ttlMin = parseFloat(opts.ttl ?? "30");
    const what = opts.what ?? "(unspecified)";
    if (!model) { console.error("--model required"); process.exit(1); }

    const id = `${model.replace(/[\/.]/g, "_")}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const expires = new Date(Date.now() + ttlMin * 60 * 1000).toISOString();
    const token = {
      id,
      model,
      cap_usd: cap,
      uses_left: uses,
      what_for: what,
      issued_at: new Date().toISOString(),
      expires_at: expires,
    };
    fs.writeFileSync(tokenPath(id), JSON.stringify(token, null, 2));
    console.log(`✓ APPROVED ${id}`);
    console.log(`   model: ${model}`);
    console.log(`   cap: $${cap.toFixed(2)} USD`);
    console.log(`   uses: ${uses}`);
    console.log(`   expires: ${expires} (${ttlMin} min)`);
    console.log(`   purpose: ${what}`);
    return;
  }

  if (cmd === "list") {
    const tokens = listTokens();
    const now = Date.now();
    if (tokens.length === 0) { console.log("(no approval tokens)"); return; }
    for (const t of tokens) {
      const expired = new Date(t.expires_at).getTime() <= now;
      const exhausted = t.uses_left <= 0;
      const status = expired ? "EXPIRED" : exhausted ? "EXHAUSTED" : "ACTIVE";
      console.log(`[${status}] ${t.id}`);
      console.log(`   model: ${t.model} · cap: $${t.cap_usd.toFixed(2)} · uses_left: ${t.uses_left}`);
      console.log(`   expires: ${t.expires_at} · purpose: ${t.what_for}`);
    }
    return;
  }

  if (cmd === "revoke") {
    const id = rest.find(a => !a.startsWith("--"));
    if (!id) { console.error("token id required"); process.exit(1); }
    const p = tokenPath(id);
    if (!fs.existsSync(p)) { console.error(`no such token: ${id}`); process.exit(1); }
    fs.unlinkSync(p);
    console.log(`✓ REVOKED ${id}`);
    return;
  }

  if (cmd === "test-abort") {
    // Para pruebas: simula una llamada a Veo sin token
    await assertVideoApproved({
      model: "google/veo3.1/image-to-video",
      scenes: 1,
      durationPerScene: 6,
      purpose: "smoke test cost-guard",
    });
    console.log("(no debería llegar aquí)");
    return;
  }

  console.log("uso:");
  console.log("  cost-guard.mjs approve --model=<m> --cap=<usd> [--uses=1] [--ttl=30] [--what=...]");
  console.log("  cost-guard.mjs list");
  console.log("  cost-guard.mjs revoke <id>");
  console.log("  cost-guard.mjs test-abort   # smoke test (debe abortar)");
}

// Solo ejecuta CLI si se invoca como script (no si se importa)
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` ||
    process.argv[1].endsWith("cost-guard.mjs")) {
  cliMain().catch(e => { console.error(e); process.exit(1); });
}

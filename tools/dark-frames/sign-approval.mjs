#!/usr/bin/env node
/**
 * Firma criptográfica del visual-reviewer approval (fix CRITICAL #1).
 *
 * Uso:
 *   node tools/dark-frames/sign-approval.mjs <output-folder>
 *
 * Lo ejecuta el visual-reviewer subagent SOLO si aprueba la pieza tras revisión.
 * Si Pablo o yo editamos meta.json a mano poniendo "approved" sin pasar por aquí,
 * la firma estará ausente o inválida y enqueue-reel.mjs BLOQUEARÁ.
 *
 * Operación:
 *   1. Calcula SHA-256 del reel.mp4
 *   2. Firma el hash con clave privada Ed25519 (env: PACAME_VISUAL_REVIEWER_PRIVATE_KEY)
 *   3. Actualiza meta.json:
 *      - visual_reviewer_status = 'approved'
 *      - visual_reviewer_at = ISO timestamp
 *      - visual_reviewer_mp4_sha256 = hash hex
 *      - visual_reviewer_signature = firma base64
 *      - visual_reviewer_signed_by = 'visual-reviewer-subagent' o 'pablo-manual'
 *
 * Reglas duras:
 *   - NO firmar sin haber visto el output (este script asume que el caller ya lo revisó).
 *   - NO firmar si --reason está ausente (auditoría obligatoria).
 *
 * Memoria: feedback_research_first_escalado_por_tier.md + nueva regla
 *   feedback_signed_approvals.md (creada en este fix).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--"));
if (!folder) {
  console.error("uso: sign-approval.mjs <folder> --reason='<razón visual review>' [--signed-by=<id>]");
  process.exit(1);
}

const opts = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=") || "true"];
    }),
);

const REASON = opts.reason || opts.r;
const SIGNED_BY = opts["signed-by"] || "visual-reviewer-subagent";

if (!REASON || REASON === "true" || REASON.length < 20) {
  console.error("ERROR: --reason='<descripción detallada visual review>' obligatorio (min 20 chars)");
  console.error("       Esta razón se loggea en meta.json para auditoría futura.");
  process.exit(1);
}

const folderPath = path.resolve(folder);
const reelPath = path.join(folderPath, "reel.mp4");
const metaPath = path.join(folderPath, "meta.json");

if (!fs.existsSync(reelPath)) {
  console.error(`ERROR: ${reelPath} no existe`);
  process.exit(1);
}
if (!fs.existsSync(metaPath)) {
  console.error(`ERROR: ${metaPath} no existe`);
  process.exit(1);
}

// Cargar clave privada desde .env.local
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

const privKeyPem = (env.PACAME_VISUAL_REVIEWER_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (!privKeyPem.includes("BEGIN PRIVATE KEY")) {
  console.error("ERROR: PACAME_VISUAL_REVIEWER_PRIVATE_KEY ausente o malformada en web/.env.local");
  console.error("       Genera el par con:");
  console.error("       node -e \"const{generateKeyPairSync}=require('crypto');const{publicKey,privateKey}=generateKeyPairSync('ed25519');console.log(privateKey.export({type:'pkcs8',format:'pem'}));console.log(publicKey.export({type:'spki',format:'pem'}))\"");
  process.exit(1);
}

// Calcular SHA-256 del reel.mp4
const reelBuffer = fs.readFileSync(reelPath);
const sha256 = crypto.createHash("sha256").update(reelBuffer).digest("hex");

// Firmar el hash
const privateKey = crypto.createPrivateKey({ key: privKeyPem, format: "pem", type: "pkcs8" });
const signature = crypto.sign(null, Buffer.from(sha256, "hex"), privateKey).toString("base64");

// Actualizar meta.json
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
meta.visual_reviewer_status = "approved";
meta.visual_reviewer_at = new Date().toISOString();
meta.visual_reviewer_mp4_sha256 = sha256;
meta.visual_reviewer_signature = signature;
meta.visual_reviewer_signed_by = SIGNED_BY;
meta.visual_reviewer_reason = REASON;

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log(`✅ Visual reviewer approval firmado`);
console.log(`   folder:       ${path.basename(folderPath)}`);
console.log(`   mp4 sha-256:  ${sha256.slice(0, 16)}…${sha256.slice(-8)}`);
console.log(`   signature:    ${signature.slice(0, 24)}… (Ed25519)`);
console.log(`   signed_by:    ${SIGNED_BY}`);
console.log(`   reason:       ${REASON.slice(0, 80)}${REASON.length > 80 ? "…" : ""}`);
console.log(`\n   enqueue-reel.mjs ahora aceptará esta pieza tras pasar los 10 checks restantes.`);

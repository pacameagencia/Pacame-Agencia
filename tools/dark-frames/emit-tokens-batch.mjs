#!/usr/bin/env node
/**
 * Pre-emisión batch de cost-guard tokens para los 10 reels DARK_FRAMES del periodo.
 *
 * Lee `content_queue` filas con status='draft' format='reel' source='calendar-skeleton%'
 * y emite un token por cada concept_id_planned, con expiry = scheduled_at + 12h buffer.
 *
 * Tokens se imprimen + guardan en JSON local `tools/dark-frames/tokens-batch-<timestamp>.json`
 * para referencia (Pablo puede consultarlos cuando renderice).
 *
 * Si un concept_id ya tiene token activo (no usado, no expirado), salta.
 *
 * Uso:
 *   node tools/dark-frames/emit-tokens-batch.mjs [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const DRY = process.argv.includes("--dry-run");

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("📋 Pre-emisión batch tokens DARK_FRAMES");

// 1. Leer reels del skeleton
const { data: reels, error: rErr } = await supabase
  .from("content_queue")
  .select("id, scheduled_at, concept_id_planned, notes, day_of_week")
  .eq("status", "draft")
  .eq("format", "reel")
  .like("source", "calendar-skeleton%")
  .order("scheduled_at", { ascending: true });

if (rErr) {
  console.error("ERROR leyendo reels:", rErr.message);
  process.exit(1);
}

console.log(`   ${reels.length} reels detectados en skeleton\n`);

// 2. Verificar tokens activos existentes para cada concept_id
const { data: existingTokens } = await supabase
  .from("cost_guard_tokens")
  .select("concept_id, token, expires_at, used_at")
  .in("concept_id", reels.map((r) => r.concept_id_planned))
  .is("used_at", null)
  .gt("expires_at", new Date().toISOString());

const activeTokens = new Map();
for (const t of existingTokens || []) {
  activeTokens.set(t.concept_id, t);
}

// 3. Para cada reel sin token activo, emitir uno
const emitted = [];
const skipped = [];

for (const reel of reels) {
  const conceptId = reel.concept_id_planned;
  const scheduledAt = new Date(reel.scheduled_at);
  const ttlHours = Math.ceil((scheduledAt.getTime() - Date.now()) / 3600 / 1000) + 12;

  if (activeTokens.has(conceptId)) {
    const existing = activeTokens.get(conceptId);
    skipped.push({ concept_id: conceptId, reason: "token activo ya existe", token_prefix: existing.token.slice(0, 8) + "…" });
    continue;
  }

  if (ttlHours <= 0) {
    skipped.push({ concept_id: conceptId, reason: `scheduled_at en pasado (${scheduledAt.toISOString()})` });
    continue;
  }

  const reason = `Calendar batch · concept ${conceptId} · scheduled ${scheduledAt.toISOString().slice(0, 16)} ES · pre-aprobado por Pablo en bloque calendario operacional 2026-05-07`;

  if (DRY) {
    emitted.push({ concept_id: conceptId, would_emit: true, ttl_hours: ttlHours, scheduled_at: reel.scheduled_at });
    console.log(`  [dry] ${conceptId} · TTL ${ttlHours}h · scheduled ${reel.scheduled_at.slice(0, 16)}`);
    continue;
  }

  const { data: token, error: emitErr } = await supabase.rpc("emit_cost_guard_token", {
    p_concept_id: conceptId,
    p_emitted_by: "pablo-calendar-batch",
    p_reason: reason,
    p_ttl_hours: ttlHours,
  });

  if (emitErr) {
    console.error(`  ✗ ${conceptId} ERROR: ${emitErr.message}`);
    continue;
  }

  emitted.push({ concept_id: conceptId, token, ttl_hours: ttlHours, scheduled_at: reel.scheduled_at, expires_at: new Date(Date.now() + ttlHours * 3600 * 1000).toISOString() });
  console.log(`  ✓ ${conceptId} · token=${token.slice(0, 8)}…${token.slice(-4)} · TTL ${ttlHours}h`);
}

// 4. Guardar JSON local para referencia
if (!DRY && emitted.length > 0) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = path.join(__dirname, `tokens-batch-${ts}.json`);
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        emitted_at: new Date().toISOString(),
        emitted_by: "pablo-calendar-batch",
        period: "2026-05-07 → 2026-05-31",
        tokens: emitted,
        skipped,
      },
      null,
      2,
    ),
  );
  console.log(`\n📄 Backup guardado: tools/dark-frames/${path.basename(outFile)}`);
  console.log(`   ⚠️  Este archivo contiene tokens · NO commitear (añadir a .gitignore si no está)`);
}

console.log(`\n✅ Batch completo · ${emitted.length} emitidos · ${skipped.length} skipped`);
if (skipped.length > 0) {
  console.log(`\nSkipped:`);
  for (const s of skipped) console.log(`  - ${s.concept_id}: ${s.reason}`);
}
console.log(`\nTokens disponibles para render-piece.mjs cuando toque cada reel.`);
console.log(`Pablo puede consultarlos en Supabase:`);
console.log(`  select concept_id, token, expires_at, used_at from cost_guard_tokens`);
console.log(`  where used_at is null and expires_at > now() order by concept_id;`);

#!/usr/bin/env node
/**
 * Auto-content pipeline · Dark Room en @pacamespain
 *
 * Stub orquestador. Las funciones lib/* son TODO en próximos PRs.
 * Diseño en `tools/auto-content/README.md` y
 * `strategy/darkroom/calendario-mayo-2026-pivot-observatorio.md`.
 *
 * Uso (manual):
 *   node tools/auto-content/daily-pipeline.mjs --date=2026-05-09 [--dry-run]
 *
 * Uso (automático): cron GitHub Actions 05:00 UTC diario.
 *
 * Pipeline:
 *   1. research()        Apify scrape hashtags IA top 24h
 *   2. brief(trends)     Claude genera 3 briefs según rotación 6 pilares
 *   3. render(briefs)    Higgsfield CLI background + composer 10 slides + caption
 *   4. enqueue(folder)   catbox upload + Supabase content_queue insert
 *   5. digest()          Telegram resumen
 */

import { parseArgs } from "node:util";

const ARGS = parseArgs({
  options: {
    date: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    slot: { type: "string" }, // 'am' | 'mid' | 'pm' | 'all'
    pilar: { type: "string" }, // override pilar manualmente
  },
}).values;

const TODAY = ARGS.date || new Date().toISOString().slice(0, 10);
const DRY = ARGS["dry-run"];
const SLOT = ARGS.slot || "all";

console.log(`📅 daily-pipeline · date=${TODAY} · slot=${SLOT} · dry=${DRY}`);

// ─── Pilares y rotación ─────────────────────────────────────────────

/**
 * Rotación de pilares por slot diario, alineada con calendario-mayo-2026.
 * Cada slot AM/MID/PM rota entre los pilares según día de la semana
 * para mantener la mezcla 35/25/15/15/5/5 a lo largo del mes.
 */
const ROTATION = {
  // Día semana (0=Dom, 1=Lun...) → { am, mid, pm }
  0: { am: 1, mid: 2, pm: 4 },  // Dom: tendencia · valor · DR
  1: { am: 1, mid: 2, pm: 3 },  // Lun: tendencia · valor · stack
  2: { am: 1, mid: 6, pm: 4 },  // Mar: tendencia · BTS · DR
  3: { am: 1, mid: 2, pm: 5 },  // Mié: tendencia · valor · provocador
  4: { am: 1, mid: 2, pm: 3 },  // Jue: tendencia · valor · stack
  5: { am: 1, mid: 6, pm: 4 },  // Vie: tendencia · BTS · DR
  6: { am: 1, mid: 2, pm: 3 },  // Sáb: tendencia · valor · stack
};

const PILAR_TO_MODEL = {
  1: "gpt_image_2",        // Tendencia · UNLIMITED · text-heavy noticias
  2: "gpt_image_2",        // VALOR · UNLIMITED · UI/frameworks
  3: "seedream_v5_lite",   // Stack práctico · UNLIMITED · aesthetic
  4: "soul_location",      // Dark Room directo · 0.12 cr · cuarto oscuro
  5: "nano_banana_flash",  // Provocador · UNLIMITED · acid impacto
  6: "text2image_soul_v2", // BTS Pablo · 0.12 cr · Soul Character PACAME
};

// ─── Pipeline ──────────────────────────────────────────────────────

async function main() {
  const dow = new Date(TODAY + "T12:00:00Z").getUTCDay();
  const todays = ROTATION[dow];
  console.log(`Pilares hoy: AM=${todays.am} MID=${todays.mid} PM=${todays.pm}`);

  if (DRY) {
    console.log("\n⚠️ DRY-RUN · no genera ni encola nada");
    console.log("Pipeline planificado:");
    for (const slot of ["am", "mid", "pm"]) {
      const p = todays[slot];
      console.log(`  · ${slot.toUpperCase()} pilar=${p} modelo=${PILAR_TO_MODEL[p]}`);
    }
    return;
  }

  // TODO: implementar las 4 fases
  // 1. const trends = await research();
  // 2. const briefs = await brief(trends, todays);
  // 3. const folders = await render(briefs);
  // 4. const ids = await enqueue(folders);
  // 5. await digest({ trends, briefs, ids });

  console.log("\n🚧 Implementación en próximos PRs:");
  console.log("  · lib/research.mjs (Apify wrapper)");
  console.log("  · lib/brief.mjs (Claude API)");
  console.log("  · lib/render.mjs (Higgsfield + composer)");
  console.log("  · lib/enqueue.mjs (catbox + Supabase)");
}

main().catch((err) => {
  console.error("❌ pipeline error:", err);
  process.exit(1);
});

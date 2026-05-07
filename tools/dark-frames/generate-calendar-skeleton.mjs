#!/usr/bin/env node
/**
 * Generator del calendario operacional skeleton (2026-05-07).
 *
 * Lee `strategy/calendario-7may-31may-2026.md` (implícito · valores hardcodeados
 * del calendario maestro) y genera las 232 filas en `content_queue` con
 * status='draft' que el cron `/api/agents/render-and-enqueue` llenará con
 * contenido real (research + brief + render + outro + gates) cuando toque.
 *
 * Periodo: 2026-05-07 (mié) → 2026-05-31 (sáb) = 25 días (24 días completos + día 0).
 * Volumen: ~232 piezas:
 *   - 24 carruseles AM (pilar 1 · 09:00 ES)
 *   - 24 carruseles MID (pilar 2/6 · 14:30 ES)
 *   - 24 carruseles PM (pilar 3/4/5 · 19:30 ES, override mar/jue/vie por reel)
 *   - 144 stories (6 slots × 24 días)
 *   - 7 reels DARK_FRAMES martes/viernes (19:30 ES, sustituye carrusel PM)
 *   - 3 hero jueves DARK_FRAMES (19:30 ES, sustituye carrusel PM)
 *   - 6 adhocs tendencia hot (slot=adhoc, fechas variables)
 *
 * Uso:
 *   node tools/dark-frames/generate-calendar-skeleton.mjs [--dry-run] [--purge-existing-drafts]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const PURGE = args.includes("--purge-existing-drafts");

// ─── Calendario maestro · constantes del periodo ──────────────────

const PERIOD_START = new Date("2026-05-07T00:00:00Z"); // mié
const PERIOD_END = new Date("2026-05-31T23:59:59Z"); // sáb

// 3 fases (ver calendario-7may-31may-2026.md sección 1)
function phaseOf(date) {
  const d = date.toISOString().slice(0, 10);
  if (d <= "2026-05-15") return "educar";
  if (d <= "2026-05-23") return "introducir";
  return "drop_lifetime";
}

// Rotación de pilares por slot según día (alineada con calendario maestro sección 4)
// 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
const ROTATION = {
  educar: {
    // Fase 1: pilar 4 (Dark Room directo) SUSPENDIDO
    0: { am: 1, mid: 2, pm: 3 }, // Dom
    1: { am: 1, mid: 2, pm: 3 }, // Lun
    2: { am: 1, mid: 6, pm: 3 }, // Mar (PM = reel DARK_FRAMES)
    3: { am: 1, mid: 2, pm: 5 }, // Mié
    4: { am: 1, mid: 2, pm: 3 }, // Jue (PM = hero jueves)
    5: { am: 1, mid: 6, pm: 3 }, // Vie (PM = reel DARK_FRAMES)
    6: { am: 1, mid: 2, pm: 3 }, // Sáb
  },
  introducir: {
    // Fase 2: pilar 4 al 20% del mix
    0: { am: 1, mid: 2, pm: 4 }, // Dom · DR
    1: { am: 1, mid: 2, pm: 3 }, // Lun
    2: { am: 1, mid: 6, pm: 4 }, // Mar (PM = reel DARK_FRAMES)
    3: { am: 1, mid: 2, pm: 5 }, // Mié · provocador
    4: { am: 1, mid: 2, pm: 4 }, // Jue (PM = hero jueves)
    5: { am: 1, mid: 6, pm: 4 }, // Vie (PM = reel DARK_FRAMES)
    6: { am: 1, mid: 2, pm: 3 }, // Sáb
  },
  drop_lifetime: {
    // Fase 3: pilar 4 al 30% (pitch alto autorizado por evento drop)
    0: { am: 1, mid: 2, pm: 4 }, // Dom · DR
    1: { am: 1, mid: 2, pm: 4 }, // Lun · DR
    2: { am: 1, mid: 6, pm: 4 }, // Mar (PM = reel DARK_FRAMES + DR caption)
    3: { am: 1, mid: 2, pm: 5 }, // Mié · provocador
    4: { am: 1, mid: 2, pm: 4 }, // Jue (PM = hero jueves)
    5: { am: 1, mid: 6, pm: 4 }, // Vie (PM = reel DARK_FRAMES + DR caption)
    6: { am: 1, mid: 2, pm: 4 }, // Sáb · DR cierre
  },
};

// Slots horarios (ES) → UTC ES en mayo es UTC+2 (CEST)
const ES_TO_UTC = -2; // ES = UTC+2 → UTC = ES - 2
const SLOTS = [
  { slot: "story_morning", hour_es: 8, minute_es: 30, format: "story", role: "tendencia 1-frase" },
  { slot: "morning", hour_es: 9, minute_es: 0, format: "carousel", role: "AM Tendencia" },
  { slot: "story_repromo_am", hour_es: 11, minute_es: 30, format: "story", role: "repromo AM" },
  { slot: "story_value", hour_es: 13, minute_es: 0, format: "story", role: "tip valor" },
  { slot: "evening", hour_es: 14, minute_es: 30, format: "carousel", role: "MID VALOR/BTS" },
  { slot: "story_bts", hour_es: 17, minute_es: 0, format: "story", role: "BTS Pablo" },
  { slot: "evening", hour_es: 19, minute_es: 30, format: "carousel", role: "PM Stack/DR/Provocador" }, // override mar/jue/vie a reel
  { slot: "story_repromo_pm", hour_es: 20, minute_es: 0, format: "story", role: "repromo PM" },
  { slot: "story_recap", hour_es: 22, minute_es: 30, format: "story", role: "recap + CTA DR" },
];

// Reels DARK_FRAMES (mar+vie 19:30 ES, sustituyen carrusel PM)
// Hero jueves DARK_FRAMES (jue 19:30 ES, sustituyen carrusel PM)
// Concept_ids: dark-frames-001..004 existen, 005-010 son backlog del serie-dark-frames.md
// Días reales del calendario (verificados):
// 2026-05-07 jue · 5-08 vie · 5-12 mar · 5-14 jue · 5-15 vie · 5-19 mar · 5-21 jue
// · 5-22 vie · 5-26 mar · 5-28 jue · 5-29 vie
const DARK_FRAMES_PLAN = [
  // Mes 1 inicial (4 conceptos ya creados con research v2)
  { date: "2026-05-08", concept_id: "dark-frames-001", role: "Reel vie sci-fi Wallace Corp BR2049" },
  { date: "2026-05-12", concept_id: "dark-frames-002", role: "Reel mar Tarantino × Stranger Things" },
  { date: "2026-05-14", concept_id: "dark-frames-003", role: "HERO jueves GTA Tokio POV" },
  { date: "2026-05-15", concept_id: "dark-frames-004", role: "Reel vie Mad Max Tokio (alta complejidad)" },
  // Backlog activado (conceptos 005+ del serie-dark-frames.md · aún sin JSON · requieren creación)
  { date: "2026-05-19", concept_id: "dark-frames-005", role: "Reel mar Cyberpunk Tokyo bike chase" },
  { date: "2026-05-21", concept_id: "dark-frames-006", role: "HERO jueves Western moderno cowboy IA" },
  { date: "2026-05-22", concept_id: "dark-frames-007", role: "Reel vie Akira live-action moto bike" },
  { date: "2026-05-26", concept_id: "dark-frames-008", role: "Reel mar Wes Anderson dirige GTA" },
  { date: "2026-05-28", concept_id: "dark-frames-009", role: "HERO jueves Backrooms liminal POV" },
  { date: "2026-05-29", concept_id: "dark-frames-010", role: "Reel vie Witcher 4 fake trailer" },
];

// ─── Construcción de las filas ─────────────────────────────────────

const rows = [];

function dateAtSlotES(yyyymmdd, hourES, minuteES) {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  const hourUTC = hourES + ES_TO_UTC;
  return new Date(Date.UTC(y, m - 1, d, hourUTC, minuteES, 0));
}

const dayMs = 24 * 3600 * 1000;
const totalDays = Math.floor((PERIOD_END - PERIOD_START) / dayMs) + 1;

// ─── content_type rotation por día de la semana + slot ─────────────
// Alineado con strategy/calendario-7may-31may-2026.md sección "Calendario semanal patrón (10 tipos rotando)"
// dow: 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
// slots: morning (09:00 AM), evening_mid (14:30 MID), evening_pm (19:30 PM)
const CONTENT_TYPE_BY_DOW_SLOT = {
  // Lun: idea negocio + lista top + comparativa
  1: { am: "idea_negocio", mid: "lista_top", pm: "comparativa" },
  // Mar: caso real + IA cotidiana + DARK_FRAMES (reel)
  2: { am: "caso_real", mid: "ia_cotidiana", pm: "dark_frames_storytime" },
  // Mié: prompt/workflow + humor/meme + idea negocio #2
  3: { am: "prompt_workflow", mid: "humor_meme", pm: "idea_negocio" },
  // Jue: lista TOP X (ancla) + tendencia hot + HERO DARK_FRAMES
  4: { am: "lista_top", mid: "tendencia_hot", pm: "dark_frames_storytime" },
  // Vie: storytime BTS reel + IA cotidiana + DARK_FRAMES (reel)
  5: { am: "dark_frames_storytime", mid: "ia_cotidiana", pm: "dark_frames_storytime" },
  // Sáb: comparativa + humor/meme + prompt/workflow
  6: { am: "comparativa", mid: "humor_meme", pm: "prompt_workflow" },
  // Dom: tutorial 60s reel + recap semana + storytime emocional (1×mes)
  0: { am: "tutorial_60s", mid: "recap_semana", pm: "storytime_emocional" },
};

function contentTypeForSlot(dow, slotName, slotHourES, isReel) {
  // Stories siempre type general
  if (slotName.startsWith("story_")) return "story_general";
  // Recap story → técnicamente story pero con CTA · ya capturado arriba
  // Adhocs
  if (slotName === "adhoc") return "tendencia_hot";

  // Carruseles / reels: mapear según slot horario
  const map = CONTENT_TYPE_BY_DOW_SLOT[dow];
  if (!map) return null;

  if (slotName === "morning") return map.am;
  if (slotName === "evening" && slotHourES === 14) return map.mid;
  if (slotName === "evening" && slotHourES === 19) {
    // PM puede ser carrusel o reel · si es reel forzamos dark_frames_storytime
    if (isReel) return "dark_frames_storytime";
    return map.pm;
  }
  return null;
}

for (let offset = 0; offset < totalDays; offset++) {
  const date = new Date(PERIOD_START.getTime() + offset * dayMs);
  const dateStr = date.toISOString().slice(0, 10);
  const dow = date.getUTCDay(); // 0=Dom .. 6=Sáb
  const phase = phaseOf(date);
  const rotation = ROTATION[phase][dow];

  for (const slot of SLOTS) {
    let pilar = null;
    let format = slot.format;
    let conceptIdPlanned = null;
    let notes = `slot=${slot.slot} role="${slot.role}"`;

    // Determinar pilar según slot
    if (slot.slot === "morning") {
      pilar = rotation.am;
    } else if (slot.slot === "evening" && slot.hour_es === 14) {
      pilar = rotation.mid;
    } else if (slot.slot === "evening" && slot.hour_es === 19) {
      // Slot PM 19:30 → puede ser carrusel o reel DARK_FRAMES si toca día
      const dfHit = DARK_FRAMES_PLAN.find((d) => d.date === dateStr);
      if (dfHit) {
        format = "reel";
        conceptIdPlanned = dfHit.concept_id;
        pilar = rotation.pm; // pilar nominal (3/4/5) pero formato reel
        notes = `slot=evening role="${dfHit.role}" concept=${dfHit.concept_id}`;
      } else {
        pilar = rotation.pm;
      }
    } else {
      // Stories: heredan tono del slot principal cercano
      pilar = slot.slot.includes("recap") ? 4 : null; // recap final del día siempre CTA Dark Room
    }

    const isReel = format === "reel";
    const contentType = contentTypeForSlot(dow, slot.slot, slot.hour_es, isReel);

    rows.push({
      scheduled_at: dateAtSlotES(dateStr, slot.hour_es, slot.minute_es).toISOString(),
      brand: "darkroom",
      slot: slot.slot,
      format,
      caption: null,
      hashtags: null,
      image_urls: null,
      video_url: null,
      status: "draft",
      attempts: 0,
      source: "calendar-skeleton-v2",
      notes,
      pilar,
      phase,
      concept_id_planned: conceptIdPlanned,
      day_of_week: dow,
      day_offset: offset,
      content_type: contentType,
    });
  }
}

// 6 adhocs tendencia hot · uno cada 4 días aprox (mier de cada semana en intervalos)
const adhocDates = ["2026-05-08", "2026-05-12", "2026-05-17", "2026-05-21", "2026-05-26", "2026-05-30"];
for (const adhocDate of adhocDates) {
  const date = new Date(adhocDate + "T00:00:00Z");
  const dow = date.getUTCDay();
  const phase = phaseOf(date);
  const offset = Math.floor((date - PERIOD_START) / dayMs);
  rows.push({
    scheduled_at: dateAtSlotES(adhocDate, 16, 0).toISOString(), // 16:00 ES
    brand: "darkroom",
    slot: "adhoc",
    format: "carousel",
    caption: null,
    hashtags: null,
    image_urls: null,
    video_url: null,
    status: "draft",
    attempts: 0,
    source: "calendar-skeleton-v2-adhoc",
    notes: "slot=adhoc role='tendencia hot reactiva · llenar día de'",
    pilar: 1,
    phase,
    concept_id_planned: null,
    day_of_week: dow,
    day_offset: offset,
    content_type: "tendencia_hot",
  });
}

console.log(`📅 Generadas ${rows.length} filas para periodo 2026-05-07 → 2026-05-31`);

// Estadísticas pre-insert
const byFormat = rows.reduce((acc, r) => ((acc[r.format] = (acc[r.format] || 0) + 1), acc), {});
const byPhase = rows.reduce((acc, r) => ((acc[r.phase] = (acc[r.phase] || 0) + 1), acc), {});
const byPilar = rows.reduce((acc, r) => ((acc[`pilar_${r.pilar || "null"}`] = (acc[`pilar_${r.pilar || "null"}`] || 0) + 1), acc), {});
const reels = rows.filter((r) => r.format === "reel");

const byContentType = rows.reduce((acc, r) => ((acc[r.content_type || "null"] = (acc[r.content_type || "null"] || 0) + 1), acc), {});

console.log("\n📊 Distribución:");
console.log("  por format:", byFormat);
console.log("  por phase: ", byPhase);
console.log("  por pilar: ", byPilar);
console.log("  por content_type:");
for (const [k, v] of Object.entries(byContentType).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(25)} ${v}`);
}
console.log(`  reels DARK_FRAMES: ${reels.length}`);
const dowLabels = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
for (const r of reels) {
  const dow = r.day_of_week;
  const label = dow === 4 ? "JUE-HERO" : dowLabels[dow];
  console.log(`    ${r.scheduled_at.slice(0, 10)} (${label}) · ${r.concept_id_planned}`);
}

if (DRY) {
  console.log("\n⚠️  --dry-run · NO se insertan filas");
  process.exit(0);
}

// Insert real
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

if (PURGE) {
  console.log("\n🗑️  --purge-existing-drafts · borrando drafts previos del calendar-skeleton…");
  const { error: pErr } = await supabase
    .from("content_queue")
    .delete()
    .eq("status", "draft")
    .like("source", "calendar-skeleton%");
  if (pErr) {
    console.error(`ERROR purge: ${pErr.message}`);
    process.exit(1);
  }
  console.log("  ✓ purge OK");
}

console.log(`\n↑ insertando ${rows.length} filas en content_queue…`);

// Batch insert (Supabase tiene límite ~1000 por insert, dividimos en chunks de 100)
const CHUNK_SIZE = 100;
let inserted = 0;
for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
  const chunk = rows.slice(i, i + CHUNK_SIZE);
  const { error } = await supabase.from("content_queue").insert(chunk);
  if (error) {
    console.error(`\nERROR insert chunk ${i}-${i + chunk.length}: ${error.message}`);
    console.error("  primera fila chunk:", JSON.stringify(chunk[0], null, 2).slice(0, 500));
    process.exit(1);
  }
  inserted += chunk.length;
  process.stdout.write(`  ${inserted}/${rows.length}\r`);
}

console.log(`\n\n✅ Calendario operacional skeleton creado · ${inserted} filas insertadas`);
console.log(`   Status: draft (el cron /api/agents/render-and-enqueue las llenará cuando toque)`);
console.log(`   Periodo: 2026-05-07 → 2026-05-31 · 24 días · 3 fases lanzamiento`);
console.log(`\n   Siguiente paso:`);
console.log(`     node tools/dark-frames/emit-tokens-batch.mjs   # pre-emite los 10 cost-guard tokens DARK_FRAMES`);

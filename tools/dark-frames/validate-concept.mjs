#!/usr/bin/env node
/**
 * validate-concept.mjs · Capa 1 del quality gate Dark Room
 *
 * Lee un concept JSON, lo valida contra DARK-ROOM-TEMPLATE.json schema (ajv),
 * y aplica validaciones extra que JSON Schema no puede expresar:
 *  - start_frame_path / end_frame_path / consistency_sheet existen físicamente en disco
 *  - 2-act: shots[0].end_frame === shots[1].start_frame (chain · mismo PNG path)
 *  - 3-act: cada transition.from.end_frame === to.start_frame
 *  - Si tier=CINEMATIC con video premium → approval.pablo_double_yes === true
 *  - estimated_cost_usd <= 5 default (override con --allow-high-cost)
 *  - research array tiene 5 items con types diversos (no 5 del mismo type)
 *
 * Uso:
 *   node tools/dark-frames/validate-concept.mjs <path-al-concept.json> [--allow-high-cost]
 *
 * Exit codes:
 *   0 — concept válido · listo para Phase 3 (substitution) o Phase 4 (video premium)
 *   1 — schema fail · JSON no cumple DARK-ROOM-TEMPLATE.json
 *   2 — semantic fail · validaciones extra fallan (paths, chains, approval mismatch)
 *
 * Este script es PRE-STEP OBLIGATORIO de:
 *   - tools/dark-frames/render-and-enqueue-local.mjs
 *   - cualquier llamada hf generate con concept JSON
 *
 * Doc completo: strategy/darkroom/studio-config/DARK-ROOM-PLAYBOOK.md §5
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCHEMA_PATH = path.join(
  REPO_ROOT,
  "strategy",
  "darkroom",
  "studio-config",
  "DARK-ROOM-TEMPLATE.json"
);

const PREMIUM_VIDEO_MODELS = ["seedance_2_0", "veo_3_1", "veo_3", "kling_3_0", "kling_2_5", "cinematic_studio_video_v2", "cinematic_studio_3_0"];

function exitWith(code, msg) {
  console.error(msg);
  process.exit(code);
}

function loadJson(p) {
  if (!fs.existsSync(p)) exitWith(1, `❌ File not found: ${p}`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    exitWith(1, `❌ Invalid JSON in ${p}: ${err.message}`);
  }
}

function resolveRepoPath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  return path.join(REPO_ROOT, p);
}

function validateSchema(concept, schema) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(concept);
  if (!ok) {
    const errors = validate.errors
      .map((e) => `  · ${e.instancePath || "(root)"} ${e.message} (${JSON.stringify(e.params)})`)
      .join("\n");
    exitWith(1, `❌ SCHEMA FAIL · concept no cumple DARK-ROOM-TEMPLATE.json:\n${errors}`);
  }
}

function validatePathsExist(concept) {
  const failures = [];

  if (concept.character_anchor?.consistency_sheet) {
    const p = resolveRepoPath(concept.character_anchor.consistency_sheet);
    if (!fs.existsSync(p)) {
      failures.push(`character_anchor.consistency_sheet not found: ${concept.character_anchor.consistency_sheet}`);
    }
  }

  if (concept.outro?.asset) {
    const p = resolveRepoPath(concept.outro.asset);
    if (!fs.existsSync(p)) {
      failures.push(`outro.asset not found: ${concept.outro.asset}`);
    }
  }

  // Frames per shot — paths can be relative to repo root or to concept file
  const shots = concept.sequence?.shots || [];
  for (const shot of shots) {
    const startKey = "image_anchor_start_winner_recommended";
    const endKey = "image_anchor_end_winner_recommended";
    if (shot[startKey]) {
      const p = resolveRepoPath(shot[startKey]);
      if (!fs.existsSync(p)) {
        failures.push(`shot ${shot.shot_id} start frame not found: ${shot[startKey]}`);
      }
    }
    if (shot[endKey]) {
      const p = resolveRepoPath(shot[endKey]);
      if (!fs.existsSync(p)) {
        failures.push(`shot ${shot.shot_id} end frame not found: ${shot[endKey]}`);
      }
    }
  }

  // Carrusel slides
  const slides = concept.slides || [];
  for (const slide of slides) {
    if (slide.image_path) {
      const p = resolveRepoPath(slide.image_path);
      if (!fs.existsSync(p)) {
        failures.push(`slide ${slide.slide_id} image not found: ${slide.image_path}`);
      }
    }
  }

  return failures;
}

function validateChainContinuity(concept) {
  const failures = [];
  const shots = concept.sequence?.shots || [];
  const transitions = concept.sequence?.transitions || [];

  // 2-act: shots[0].end === shots[1].start (mismo PNG)
  if (concept.format === "2-act") {
    if (shots.length !== 2) {
      failures.push(`2-act format requires exactly 2 shots, got ${shots.length}`);
      return failures;
    }
    const endA = shots[0].image_anchor_end_winner_recommended;
    const startB = shots[1].image_anchor_start_winner_recommended;
    if (!endA || !startB) {
      failures.push(`2-act requires image_anchor_end on shot 0 AND image_anchor_start on shot 1`);
    } else if (endA !== startB) {
      failures.push(
        `2-act CHAIN BROKEN · shots[0].end_frame ('${endA}') must equal shots[1].start_frame ('${startB}'). Same PNG path mandatory · this is the core of last_frame_chain.`
      );
    }
  }

  // 3-act: validate cada transition.ending == next opening
  if (concept.format === "3-act") {
    for (const t of transitions) {
      const fromShot = shots.find((s) => s.shot_id === t.from_shot);
      const toShot = shots.find((s) => s.shot_id === t.to_shot);
      if (!fromShot || !toShot) {
        failures.push(`Transition references missing shot: from=${t.from_shot} to=${t.to_shot}`);
        continue;
      }
      if (t.type === "match_action" || t.type === "last_frame_chain") {
        const endFrom = fromShot.image_anchor_end_winner_recommended;
        const startTo = toShot.image_anchor_start_winner_recommended;
        if (endFrom && startTo && endFrom !== startTo) {
          failures.push(
            `3-act transition ${t.from_shot}→${t.to_shot} type='${t.type}' requires same PNG: end_frame ('${endFrom}') !== start_frame ('${startTo}')`
          );
        }
      }
    }
  }

  return failures;
}

function validateApprovalGate(concept) {
  const failures = [];
  const tier = concept.tier;
  const usesPremium =
    concept.tier_video?.toLowerCase?.().match(new RegExp(PREMIUM_VIDEO_MODELS.join("|"))) ||
    JSON.stringify(concept.sequence || {})
      .toLowerCase()
      .match(new RegExp(PREMIUM_VIDEO_MODELS.join("|")));

  if ((tier === "CINEMATIC" || tier === "HYBRID") && usesPremium) {
    if (concept.approval?.pablo_double_yes !== true) {
      failures.push(
        `tier=${tier} uses premium video model (${PREMIUM_VIDEO_MODELS.find((m) => JSON.stringify(concept).toLowerCase().includes(m.toLowerCase())) || "Seedance/Veo/Kling/Cinematic"}) but approval.pablo_double_yes !== true. Doble SÍ Pablo obligatorio (regla feedback_doble_aprobacion_videos.md).`
      );
    }
    if (!concept.approval?.cost_guard_token && !process.argv.includes("--skip-cost-guard")) {
      failures.push(
        `tier=${tier} uses premium video but approval.cost_guard_token missing. Generate with emit-cost-guard.mjs.`
      );
    }
  }

  return failures;
}

function validateCostCap(concept, allowHighCost) {
  const failures = [];
  const cost = concept.estimated_cost_usd;
  if (typeof cost === "number" && cost > 5 && !allowHighCost) {
    failures.push(
      `estimated_cost_usd=$${cost} exceeds default cap $5. Use --allow-high-cost to override (re-confirm Pablo before).`
    );
  }
  return failures;
}

function validateResearchDiversity(concept) {
  const failures = [];
  const research = concept.research || [];
  if (research.length < 5) {
    failures.push(`research array has ${research.length} items, minimum 5 required (R-research-first).`);
    return failures;
  }
  const types = new Set(research.map((r) => r.type));
  if (types.size < 3) {
    failures.push(
      `research has ${research.length} items but only ${types.size} distinct types (${Array.from(types).join(",")}). Need diversity: lente + lut + ritmo + audio + estructura típicamente.`
    );
  }
  return failures;
}

function validateFormatDuration(concept) {
  const failures = [];
  const { format, duration_target_s: dur } = concept;
  const tolerances = {
    "1-act": [7, 9],
    "2-act": [12, 16],
    "3-act": [18, 32],
    story: [4.5, 5.5],
  };
  const range = tolerances[format];
  if (range && (dur < range[0] || dur > range[1])) {
    failures.push(`format=${format} requires duration_target_s in [${range[0]}, ${range[1]}], got ${dur}`);
  }
  return failures;
}

function main() {
  const args = process.argv.slice(2);
  const allowHighCost = args.includes("--allow-high-cost");
  const conceptPath = args.find((a) => !a.startsWith("--"));

  if (!conceptPath) {
    exitWith(1, `Usage: node tools/dark-frames/validate-concept.mjs <concept.json> [--allow-high-cost]`);
  }

  const concept = loadJson(conceptPath);
  const schema = loadJson(SCHEMA_PATH);

  // Capa 1 · Schema (ajv)
  validateSchema(concept, schema);

  // Capa 2 · Semantic validations
  const semanticFailures = [
    ...validatePathsExist(concept),
    ...validateChainContinuity(concept),
    ...validateApprovalGate(concept),
    ...validateCostCap(concept, allowHighCost),
    ...validateResearchDiversity(concept),
    ...validateFormatDuration(concept),
  ];

  if (semanticFailures.length > 0) {
    const block = semanticFailures.map((f) => `  · ${f}`).join("\n");
    exitWith(2, `❌ SEMANTIC FAIL · concept ${concept.concept_id} (format=${concept.format}, tier=${concept.tier}):\n${block}`);
  }

  console.log(`✅ ${concept.concept_id} · format=${concept.format} · tier=${concept.tier} · duration=${concept.duration_target_s}s · cost=$${concept.estimated_cost_usd ?? "n/a"} · validated`);
  process.exit(0);
}

main();

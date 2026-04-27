#!/usr/bin/env node
/**
 * Genera la foto de Lucía vía Atlas Cloud y la guarda en
 * web/public/asistente/lucia.png. Usa cascada de modelos (más caros primero).
 *
 * Patrón: api/v1/model/generateImage es async → polling.
 * Reutiliza el shape descubierto en carruseles-darkroom/generate-backgrounds-atlas.mjs.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const env = readFileSync(".env.local", "utf8");
for (const l of env.split("\n")) {
  const t = l.trim();
  if (!t || t.startsWith("#")) continue;
  const [k, ...r] = t.split("=");
  if (!process.env[k]) process.env[k] = r.join("=").replace(/^"|"$/g, "");
}

const KEY = process.env.ATLAS_API_KEY;
if (!KEY) {
  console.error("Falta ATLAS_API_KEY en .env.local");
  process.exit(1);
}

const BASE = "https://api.atlascloud.ai/api/v1";
const HEADERS = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const PROMPT = `A photorealistic editorial portrait of a Spanish woman in her mid-30s. Warm friendly closed-mouth smile, direct eye contact with camera, medium-length brown wavy hair styled naturally, mediterranean skin with subtle natural pores and texture, minimal makeup, soft side window light. She wears a plain cream-colored knit sweater (#F4EFE3 paper). Background: smooth muted terracotta wall (#B54E30 desaturated 50%), shallow depth of field bokeh. Square 1:1 framing, mid-chest up, face centered. Style: natural editorial photography, 35mm portrait lens, slightly warm color grade. Critical: skin natural with no plastic look, both eye pupils symmetric and natural, both ears visible and identical, no floating earrings, hands out of frame. Looks like a competent friend, not a stock model. NOT illustration, NOT 3D, NOT anime.`;

const MODELS = [
  "google/imagen4-ultra",
  "openai/gpt-image-2-developer/text-to-image",
  "bytedance/seedream-v5.0-lite",
  "black-forest-labs/flux-dev",
  "black-forest-labs/flux-schnell",
];

async function createPrediction(model) {
  const candidateBodies = [
    { model, prompt: PROMPT, aspect_ratio: "1:1", width: 1024, height: 1024 },
    { model, input: { prompt: PROMPT, aspect_ratio: "1:1", width: 1024, height: 1024 } },
    { model, prompt: PROMPT, size: "1024x1024" },
    { model, prompt: PROMPT },
  ];
  let lastErr;
  for (const body of candidateBodies) {
    const res = await fetch(`${BASE}/model/generateImage`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) return j;
    lastErr = `[${res.status}] ${(j?.msg || j?.error || JSON.stringify(j)).slice(0, 200)}`;
    if (res.status === 401 || res.status === 403) throw new Error(lastErr);
  }
  throw new Error(`No body shape worked: ${lastErr}`);
}

function extractPredId(task) {
  return (
    task?.prediction_id ||
    task?.id ||
    task?.data?.prediction_id ||
    task?.data?.id ||
    task?.task_id ||
    task?.data?.task_id
  );
}

async function poll(predId, hintedUrl) {
  // Atlas devuelve `data.urls.get` con el endpoint de polling exacto.
  // Si lo tenemos, lo usamos; si no, caemos al patrón conocido /model/prediction/{id}.
  const url = hintedUrl || `${BASE}/model/prediction/${predId}`;
  for (let i = 0; i < 90; i++) {
    const r = await fetch(url, { headers: HEADERS });
    const j = await r.json().catch(() => ({}));
    const status = (j?.status || j?.data?.status || "").toLowerCase();
    if (["completed", "succeeded", "success"].includes(status)) return j;
    if (["failed", "error", "canceled"].includes(status)) {
      throw new Error("prediction failed: " + JSON.stringify(j).slice(0, 200));
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("polling timeout");
}

function extractUrl(r) {
  const candidates = [
    r?.data?.outputs?.[0],
    r?.outputs?.[0],
    r?.data?.output,
    r?.output,
    r?.image_url,
    r?.data?.image_url,
    r?.urls?.[0],
    r?.data?.urls?.[0],
    r?.images?.[0],
    r?.data?.images?.[0],
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 8) return c;
  }
  return null;
}

const OUT = path.resolve("public/asistente/lucia.png");

(async () => {
  for (const model of MODELS) {
    try {
      console.log(`[lucia] trying ${model}…`);
      const task = await createPrediction(model);
      const predId = extractPredId(task);
      if (!predId) {
        console.log(`  no predId in response, skipping. raw:`, JSON.stringify(task).slice(0, 150));
        continue;
      }
      const hintedUrl = task?.data?.urls?.get || task?.urls?.get;
      console.log(`  predId=${predId}, polling ${hintedUrl?.slice(0, 80) || "(default)"}…`);
      const result = await poll(predId, hintedUrl);
      const url = extractUrl(result);
      if (!url) {
        console.log(`  no image url, skipping. raw:`, JSON.stringify(result).slice(0, 150));
        continue;
      }
      console.log(`  got image: ${url.slice(0, 80)}…`);
      let buf;
      if (url.startsWith("data:")) {
        buf = Buffer.from(url.split(",")[1], "base64");
      } else {
        const r = await fetch(url);
        buf = Buffer.from(await r.arrayBuffer());
      }
      writeFileSync(OUT, buf);
      console.log(`\n[lucia] OK saved ${buf.length} bytes -> ${OUT}`);
      process.exit(0);
    } catch (e) {
      console.log(`  fail: ${e.message}`);
    }
  }
  console.error("[lucia] all models failed");
  process.exit(2);
})();

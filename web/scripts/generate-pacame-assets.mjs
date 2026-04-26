#!/usr/bin/env node
/**
 * PACAME Atlas Cloud — batch image generation CLI
 *
 * Reads web/scripts/asset-manifest.json and calls Atlas Cloud GPT Image 2 for each entry,
 * with concurrency=2, exponential backoff per asset, and slug-level retry support.
 *
 * Usage:
 *   node web/scripts/generate-pacame-assets.mjs                       # generate all (skips existing)
 *   node web/scripts/generate-pacame-assets.mjs --only=hero-poster    # one slug
 *   node web/scripts/generate-pacame-assets.mjs --only=agents/nova,agents/atlas
 *   node web/scripts/generate-pacame-assets.mjs --category=service-icon
 *   node web/scripts/generate-pacame-assets.mjs --retry                # regenerate even if exists
 *   node web/scripts/generate-pacame-assets.mjs --dry-run              # print what would be generated
 *
 * Env: ATLAS_API_KEY (required) — read from web/.env.local
 */

import fs from "node:fs/promises";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
// Assets always go INSIDE web/ so Next can serve them from /generated/<slug>.png
const ASSET_BASE = WEB_ROOT;

// Load env from web/.env.local manually (avoid pulling Next runtime)
function loadEnv() {
  const envPath = path.join(WEB_ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.warn(`[env] no web/.env.local at ${envPath}`);
    return;
  }
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    let v = rawVal.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = v;
  }
}
loadEnv();

const ATLAS_API_KEY = process.env.ATLAS_API_KEY?.trim();
if (!ATLAS_API_KEY) {
  console.error("✖ ATLAS_API_KEY missing in web/.env.local");
  process.exit(1);
}

// CLI arg parsing
const args = process.argv.slice(2);
const flags = {
  only: null,
  category: null,
  retry: args.includes("--retry"),
  dryRun: args.includes("--dry-run"),
  concurrency: 2,
};
for (const a of args) {
  if (a.startsWith("--only=")) flags.only = a.slice(7).split(",").map((s) => s.trim());
  if (a.startsWith("--category=")) flags.category = a.slice(11);
  if (a.startsWith("--concurrency=")) flags.concurrency = parseInt(a.slice(14), 10) || 2;
}

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1";

const COST_TABLE = {
  "openai/gpt-image-2-developer/text-to-image": 0.032,
  "google/imagen4-ultra": 0.06,
  "bytedance/seedream-v5.0-lite": 0.032,
  "black-forest-labs/flux-dev": 0.012,
  "black-forest-labs/flux-schnell": 0.003,
};

const FALLBACK_CHAIN = [
  "openai/gpt-image-2-developer/text-to-image",
  "google/imagen4-ultra",
  "bytedance/seedream-v5.0-lite",
  "black-forest-labs/flux-dev",
  "black-forest-labs/flux-schnell",
];

function extractImageUrl(payload) {
  if (!payload) return null;
  if (Array.isArray(payload.outputs) && payload.outputs.length) {
    const v = payload.outputs[0];
    return typeof v === "string" ? v : v?.url || null;
  }
  if (Array.isArray(payload.output) && payload.output.length) {
    const v = payload.output[0];
    return typeof v === "string" ? v : v?.url || null;
  }
  if (typeof payload.output === "string") return payload.output;
  if (Array.isArray(payload.urls) && payload.urls.length) return payload.urls[0];
  if (typeof payload.image_url === "string") return payload.image_url;
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createPrediction(model, prompt, ratio) {
  const res = await fetch(`${ATLAS_BASE}/model/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ATLAS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: ratio,
      quality: "high",
      n: 1,
      output_format: "png",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "<no-body>");
    throw new Error(`createPrediction ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const id = json?.data?.id || json?.id || json?.prediction_id;
  if (!id) throw new Error(`no prediction id`);
  return id;
}

async function pollPrediction(id, maxMs = 120_000) {
  const start = Date.now();
  const delays = [1000, 2000, 4000, 8000];
  let attempt = 0;
  while (Date.now() - start < maxMs) {
    const res = await fetch(`${ATLAS_BASE}/model/prediction/${id}`, {
      headers: { Authorization: `Bearer ${ATLAS_API_KEY}` },
    });
    if (res.ok) {
      const json = await res.json();
      const data = json?.data || json;
      const status = String(data?.status || "").toLowerCase();
      if (status === "completed" || status === "succeeded") {
        const url = extractImageUrl(data);
        if (!url) {
          throw new Error(`completed but no output URL. Keys: ${Object.keys(data || {}).join(",")}`);
        }
        return url;
      }
      if (status === "failed" || status === "canceled" || status === "error") {
        const errMsg = data?.error || "unknown";
        throw new Error(`prediction ${status}: ${JSON.stringify(errMsg).slice(0, 200)}`);
      }
    }
    await sleep(delays[Math.min(attempt, delays.length - 1)]);
    attempt += 1;
  }
  throw new Error(`poll timeout after ${maxMs}ms`);
}

async function downloadAndSave(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
  return buf.length;
}

async function generateOne(asset, manifest) {
  const fullPrompt = `${manifest.stylePreamble}\n\n${asset.prompt}\n\nNegative: ${manifest.negativePrompt}`;
  const ratio = asset.ratio || "1024x1536";
  const destDir = path.join(ASSET_BASE, asset.destDir || "public/generated");
  const destPath = path.join(destDir, `${asset.slug}.png`);
  const requestedModel = asset.model;

  if (existsSync(destPath) && !flags.retry) {
    return { slug: asset.slug, status: "skipped", path: destPath };
  }
  if (flags.dryRun) {
    return { slug: asset.slug, status: "dry-run", ratio, model: requestedModel || FALLBACK_CHAIN[0] };
  }

  const chain = requestedModel
    ? [requestedModel, ...FALLBACK_CHAIN.filter((m) => m !== requestedModel)]
    : FALLBACK_CHAIN;

  const start = Date.now();
  let lastErr = null;

  for (const model of chain) {
    try {
      const id = await createPrediction(model, fullPrompt, ratio);
      const url = await pollPrediction(id);
      const bytes = await downloadAndSave(url, destPath);
      return {
        slug: asset.slug,
        status: "ok",
        path: destPath,
        bytes,
        model,
        costUSD: COST_TABLE[model],
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      lastErr = err;
      console.warn(`  ⚠ ${asset.slug} on ${model.split("/")[1]}: ${err.message.slice(0, 100)}`);
    }
  }

  return { slug: asset.slug, status: "fail", error: lastErr?.message || "all models failed" };
}

async function pool(items, fn, concurrency) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      const r = await fn(item);
      results[idx] = r;
      const totalDone = results.filter(Boolean).length;
      const status = r.status === "ok" ? "✓" : r.status === "skipped" ? "⊙" : r.status === "dry-run" ? "·" : "✖";
      console.log(`  ${status} [${totalDone}/${items.length}] ${r.slug} ${r.status === "ok" ? `(${r.model?.split("/")[1] || "?"} · ${(r.bytes / 1024).toFixed(0)}KB · ${r.latencyMs}ms)` : r.error || ""}`);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const manifestPath = path.join(__dirname, "asset-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  let assets = manifest.assets;
  if (flags.only) {
    const allow = new Set(flags.only);
    assets = assets.filter((a) => allow.has(a.slug));
  }
  if (flags.category) {
    assets = assets.filter((a) => a.category === flags.category);
  }

  if (!assets.length) {
    console.error("✖ no assets match the given filters");
    process.exit(1);
  }

  console.log(`\n▸ PACAME Atlas batch — ${assets.length} assets, concurrency=${flags.concurrency}${flags.dryRun ? " (DRY RUN)" : ""}${flags.retry ? " (RETRY: regenerate existing)" : ""}\n`);

  const start = Date.now();
  const results = await pool(assets, (a) => generateOne(a, manifest), flags.concurrency);

  const ok = results.filter((r) => r.status === "ok");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "fail");
  const totalCost = ok.reduce((s, r) => s + (r.costUSD || 0), 0);
  const totalBytes = ok.reduce((s, r) => s + (r.bytes || 0), 0);

  console.log(`\n▸ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`  ✓ ok      : ${ok.length}`);
  console.log(`  ⊙ skipped : ${skipped.length}`);
  console.log(`  ✖ failed  : ${failed.length}`);
  console.log(`  $ cost    : $${totalCost.toFixed(3)}`);
  console.log(`  ⌬ size    : ${(totalBytes / 1024 / 1024).toFixed(2)}MB`);

  if (failed.length) {
    console.log(`\n  Failures:`);
    for (const f of failed) console.log(`    ✖ ${f.slug} → ${f.error?.slice(0, 200)}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("✖ batch failed:", err);
  process.exit(1);
});

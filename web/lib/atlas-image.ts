/**
 * PACAME Atlas Cloud — GPT Image 2 wrapper
 *
 * Wraps Atlas Cloud (https://api.atlascloud.ai) for image generation.
 * Default model: openai/gpt-image-2-developer/text-to-image ($0.032/img @ 1024x1536).
 * Cascade fallback: gpt-image-2-developer → imagen-4-ultra → seedream-v5 → flux-dev.
 *
 * Async API: POST predicts, polls until completed, downloads buffer, saves to disk.
 *
 * Required env: ATLAS_API_KEY
 *
 * Usage:
 *   const result = await generateAtlasImage("Editorial poster ...", {
 *     ratio: "1024x1536",
 *     slug: "hero-poster",
 *     save: true,
 *   });
 *   // → { url, path, costUSD, model, latencyMs }
 */

import fs from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1";
const ATLAS_API_KEY = process.env.ATLAS_API_KEY?.trim();

export type AtlasModel =
  | "openai/gpt-image-2-developer/text-to-image"
  | "google/imagen4-ultra"
  | "bytedance/seedream-v5.0-lite"
  | "black-forest-labs/flux-dev"
  | "black-forest-labs/flux-schnell";

export type AtlasRatio =
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "1080x1350"
  | "1080x1920"
  | "1920x1080";

export interface GenerateAtlasImageOpts {
  ratio?: AtlasRatio;
  model?: AtlasModel;
  slug?: string;
  save?: boolean;
  saveDir?: string;
  quality?: "standard" | "high";
  outputFormat?: "png" | "webp" | "jpeg";
  maxPollMs?: number;
  signal?: AbortSignal;
}

export interface GenerateAtlasImageResult {
  url: string;
  path?: string;
  bytes?: number;
  costUSD: number;
  model: AtlasModel;
  latencyMs: number;
  predictionId: string;
}

const COST_TABLE: Record<AtlasModel, number> = {
  "openai/gpt-image-2-developer/text-to-image": 0.032,
  "google/imagen4-ultra": 0.06,
  "bytedance/seedream-v5.0-lite": 0.032,
  "black-forest-labs/flux-dev": 0.012,
  "black-forest-labs/flux-schnell": 0.003,
};

const FALLBACK_CHAIN: AtlasModel[] = [
  "openai/gpt-image-2-developer/text-to-image",
  "google/imagen4-ultra",
  "bytedance/seedream-v5.0-lite",
  "black-forest-labs/flux-dev",
  "black-forest-labs/flux-schnell",
];

function extractImageUrl(payload: any): string | null {
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

const DEFAULT_SAVE_DIR = path.join(process.cwd(), "public", "generated");

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

async function createPrediction(
  model: AtlasModel,
  prompt: string,
  ratio: AtlasRatio,
  quality: "standard" | "high",
  outputFormat: "png" | "webp" | "jpeg",
): Promise<{ predictionId: string }> {
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
      quality,
      n: 1,
      output_format: outputFormat,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "<no-body>");
    throw new Error(`Atlas createPrediction ${res.status}: ${body.slice(0, 400)}`);
  }

  const json = await res.json();
  const predictionId = json?.data?.id || json?.id || json?.prediction_id;
  if (!predictionId) {
    throw new Error(`Atlas createPrediction: missing prediction id in response`);
  }

  return { predictionId };
}

async function pollPrediction(
  predictionId: string,
  maxPollMs: number,
  signal?: AbortSignal,
): Promise<{ outputUrl: string }> {
  const start = Date.now();
  const delays = [1000, 2000, 4000, 8000];
  let attempt = 0;

  while (Date.now() - start < maxPollMs) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const res = await fetch(`${ATLAS_BASE}/model/prediction/${predictionId}`, {
      headers: { Authorization: `Bearer ${ATLAS_API_KEY}` },
    });

    if (res.ok) {
      const json = await res.json();
      const data = json?.data || json;
      const status = String(data?.status || "").toLowerCase();

      if (status === "completed" || status === "succeeded") {
        const url = extractImageUrl(data);
        if (!url) {
          throw new Error(`Atlas poll completed but no output URL. Keys: ${Object.keys(data || {}).join(",")}`);
        }
        return { outputUrl: url };
      }

      if (status === "failed" || status === "canceled" || status === "error") {
        const errMsg = data?.error || "unknown";
        throw new Error(`Atlas prediction ${status}: ${JSON.stringify(errMsg).slice(0, 200)}`);
      }
    }

    const delay = delays[Math.min(attempt, delays.length - 1)];
    await sleep(delay, signal);
    attempt += 1;
  }

  throw new Error(`Atlas poll timeout after ${maxPollMs}ms (predictionId=${predictionId})`);
}

async function downloadBuffer(url: string, signal?: AbortSignal): Promise<Buffer> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url.slice(0, 100)}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function saveToDisk(
  buffer: Buffer,
  slug: string,
  saveDir: string,
  ext: string,
): Promise<string> {
  await fs.mkdir(saveDir, { recursive: true });
  const filename = slug.endsWith(`.${ext}`) ? slug : `${slug}.${ext}`;
  const fullPath = path.join(saveDir, filename);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return fullPath;
}

/**
 * Generate an image with GPT Image 2 (Atlas Cloud), with cascade fallback to Imagen 4 Ultra,
 * Seedream v5, Flux Dev and Flux Schnell if the primary model fails.
 *
 * Throws if ATLAS_API_KEY is missing or all models fail.
 */
export async function generateAtlasImage(
  prompt: string,
  opts: GenerateAtlasImageOpts = {},
): Promise<GenerateAtlasImageResult> {
  if (!ATLAS_API_KEY) {
    throw new Error("ATLAS_API_KEY missing in env. Add it to web/.env.local");
  }
  if (!prompt || prompt.trim().length < 10) {
    throw new Error("Atlas prompt too short (min 10 chars)");
  }

  const ratio = opts.ratio || "1024x1536";
  const quality = opts.quality || "high";
  const outputFormat = opts.outputFormat || "png";
  const maxPollMs = opts.maxPollMs || 120_000;
  const slug = opts.slug || `gen-${Date.now()}`;
  const saveDir = opts.saveDir || DEFAULT_SAVE_DIR;
  const requestedModel = opts.model;

  const chain = requestedModel
    ? [requestedModel, ...FALLBACK_CHAIN.filter((m) => m !== requestedModel)]
    : FALLBACK_CHAIN;

  const start = Date.now();
  let lastErr: unknown = null;

  for (const model of chain) {
    try {
      const { predictionId } = await createPrediction(
        model,
        prompt,
        ratio,
        quality,
        outputFormat,
      );
      const { outputUrl } = await pollPrediction(predictionId, maxPollMs, opts.signal);

      let savedPath: string | undefined;
      let bytes: number | undefined;
      if (opts.save !== false) {
        const buf = await downloadBuffer(outputUrl, opts.signal);
        bytes = buf.length;
        savedPath = await saveToDisk(buf, slug, saveDir, outputFormat);
      }

      return {
        url: outputUrl,
        path: savedPath,
        bytes,
        costUSD: COST_TABLE[model],
        model,
        latencyMs: Date.now() - start,
        predictionId,
      };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[atlas-image] ${model} failed: ${msg.slice(0, 150)}`);
    }
  }

  throw new Error(
    `Atlas all models failed. Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}

export { COST_TABLE as ATLAS_COST_TABLE, FALLBACK_CHAIN as ATLAS_FALLBACK_CHAIN };

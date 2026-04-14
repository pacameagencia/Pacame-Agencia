/**
 * Freepik API Suite — Full integration
 *
 * Capabilities:
 * - AI Image Generation (Mystic, Flux 2 Pro)
 * - Image Upscaling (Magnific, 2x-16x)
 * - Background Removal
 * - Image-to-Video (Kling 2.6 Pro)
 * - Stock Search & Download
 * - Style Transfer, Relighting, Expansion
 *
 * Auth: x-freepik-api-key header
 * Base: https://api.freepik.com/v1
 * All AI tasks are async — POST returns task_id, poll GET for results.
 */

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY?.trim();
const BASE = "https://api.freepik.com/v1";

// ─── Types ───────────────────────────────────────────────────────

export interface FreepikTask {
  task_id: string;
  status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  generated?: string[];
}

interface FreepikResponse {
  data: FreepikTask;
}

// ─── Core helpers ────────────────────────────────────────────────

function headers(contentType = "application/json"): Record<string, string> {
  if (!FREEPIK_API_KEY) throw new Error("FREEPIK_API_KEY not configured");
  return { "x-freepik-api-key": FREEPIK_API_KEY, "Content-Type": contentType };
}

async function postAI(path: string, body: Record<string, unknown>): Promise<FreepikTask> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Freepik ${path} failed (${res.status}): ${JSON.stringify(err)}`);
  }
  const json: FreepikResponse = await res.json();
  return json.data;
}

async function getTask(path: string): Promise<FreepikTask> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Freepik GET ${path} failed (${res.status}): ${JSON.stringify(err)}`);
  }
  const json: FreepikResponse = await res.json();
  return json.data;
}

/**
 * Poll a task until COMPLETED or FAILED (max ~2 min).
 */
export async function waitForTask(
  pollPath: string,
  maxAttempts = 24,
  intervalMs = 5000
): Promise<FreepikTask> {
  for (let i = 0; i < maxAttempts; i++) {
    const task = await getTask(pollPath);
    if (task.status === "COMPLETED" || task.status === "FAILED") return task;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Freepik task timed out");
}

// ─── 1. AI Image Generation ─────────────────────────────────────

export type MysticModel = "realism" | "fluid" | "zen" | "flexible" | "super_real" | "editorial_portraits";
export type AspectRatio = "square_1_1" | "widescreen_16_9" | "social_story_9_16" | "classic_4_3" | "classic_3_4" | "cinematic_21_9";

export interface GenerateImageOptions {
  model?: MysticModel;
  resolution?: "1k" | "2k" | "4k";
  aspect_ratio?: AspectRatio;
  style_reference?: string; // base64
  structure_reference?: string; // base64
  structure_strength?: number; // 0-100
  adherence?: number; // 0-100
  hdr?: number; // 0-100
  creative_detailing?: number; // 0-100
  fixed_generation?: boolean;
}

/**
 * Generate image with Mystic (Freepik's flagship model).
 * Best for: realistic photos, portraits, creative art.
 */
export async function generateMystic(prompt: string, options: GenerateImageOptions = {}): Promise<FreepikTask> {
  return postAI("/ai/mystic", { prompt, ...options });
}

/**
 * Generate image with Flux 2 Pro.
 * Best for: precise prompt following, text rendering in images.
 */
export async function generateFlux2Pro(
  prompt: string,
  options: { width?: number; height?: number; seed?: number; prompt_upsampling?: boolean; input_image?: string } = {}
): Promise<FreepikTask> {
  return postAI("/ai/text-to-image/flux-2-pro", { prompt, ...options });
}

/** Check generation task status */
export async function getGenerationTask(taskId: string): Promise<FreepikTask> {
  return getTask(`/ai/mystic/${taskId}`);
}

/**
 * Generate and wait for result. Returns image URLs.
 */
export async function generateImageAndWait(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<string[]> {
  const task = await generateMystic(prompt, options);
  const result = await waitForTask(`/ai/mystic/${task.task_id}`);
  if (result.status === "FAILED") throw new Error("Image generation failed");
  return result.generated || [];
}

// ─── 2. Image Upscaling (Magnific) ──────────────────────────────

export type UpscaleFactor = "2x" | "4x" | "8x" | "16x";
export type UpscaleStyle = "standard" | "soft_portraits" | "hard_portraits" | "art_n_illustration" | "videogame_assets" | "nature_n_landscapes" | "films_n_photography" | "3d_renders" | "science_fiction_n_horror";

export interface UpscaleOptions {
  scale_factor?: UpscaleFactor;
  optimized_for?: UpscaleStyle;
  prompt?: string;
  creativity?: number; // -10 to 10
  hdr?: number; // -10 to 10
  resemblance?: number; // -10 to 10
  engine?: "automatic" | "magnific_illusio" | "magnific_sharpy" | "magnific_sparkle";
}

/**
 * Upscale image up to 16x with Magnific AI.
 * @param imageBase64 Base64 encoded image
 */
export async function upscaleImage(imageBase64: string, options: UpscaleOptions = {}): Promise<FreepikTask> {
  return postAI("/ai/image-upscaler", { image: imageBase64, ...options });
}

export async function upscaleAndWait(imageBase64: string, options: UpscaleOptions = {}): Promise<string[]> {
  const task = await upscaleImage(imageBase64, options);
  const result = await waitForTask(`/ai/image-upscaler/${task.task_id}`, 30, 5000);
  if (result.status === "FAILED") throw new Error("Upscale failed");
  return result.generated || [];
}

// ─── 3. Background Removal ──────────────────────────────────────

export interface RemoveBgResult {
  original: string;
  preview: string;
  high_resolution: string;
  url: string;
}

/**
 * Remove background from image. Returns URLs (valid 5 min).
 */
export async function removeBackground(imageUrl: string): Promise<RemoveBgResult> {
  if (!FREEPIK_API_KEY) throw new Error("FREEPIK_API_KEY not configured");

  const res = await fetch(`${BASE}/ai/beta/remove-background`, {
    method: "POST",
    headers: { "x-freepik-api-key": FREEPIK_API_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: imageUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Remove bg failed (${res.status}): ${JSON.stringify(err)}`);
  }

  return res.json();
}

// ─── 4. Image-to-Video (Kling 2.6 Pro) ──────────────────────────

export interface VideoOptions {
  prompt?: string;
  negative_prompt?: string;
  duration?: "5" | "10";
  aspect_ratio?: "widescreen_16_9" | "social_story_9_16" | "square_1_1";
  cfg_scale?: number; // 0-1
  generate_audio?: boolean;
}

/**
 * Generate video from image with Kling 2.6 Pro.
 */
export async function imageToVideo(imageBase64OrUrl: string, options: VideoOptions = {}): Promise<FreepikTask> {
  return postAI("/ai/image-to-video/kling-v2-6-pro", {
    image: imageBase64OrUrl,
    duration: options.duration || "5",
    ...options,
  });
}

/**
 * Generate video from text prompt.
 */
export async function textToVideo(prompt: string, options: VideoOptions = {}): Promise<FreepikTask> {
  return postAI("/ai/image-to-video/kling-v2-6-pro", {
    prompt,
    duration: options.duration || "5",
    ...options,
  });
}

export async function getVideoTask(taskId: string): Promise<FreepikTask> {
  return getTask(`/ai/image-to-video/kling-v2-6-pro/${taskId}`);
}

// ─── 5. Style Transfer ──────────────────────────────────────────

/**
 * Apply artistic style to an image.
 */
export async function styleTransfer(imageBase64: string, styleImageBase64: string): Promise<FreepikTask> {
  return postAI("/ai/image-style-transfer", { image: imageBase64, style_image: styleImageBase64 });
}

// ─── 6. Image Relighting ────────────────────────────────────────

/**
 * Change lighting of an image using a text prompt.
 */
export async function relightImage(imageBase64: string, prompt: string): Promise<FreepikTask> {
  return postAI("/ai/image-relight", { image: imageBase64, prompt });
}

// ─── 7. Image Expansion (Outpainting) ───────────────────────────

/**
 * Expand image borders with AI-generated content.
 */
export async function expandImage(
  imageBase64: string,
  expand: { left?: number; right?: number; top?: number; bottom?: number },
  prompt?: string
): Promise<FreepikTask> {
  return postAI("/ai/image-expand/flux-pro", { image: imageBase64, ...expand, prompt });
}

// ─── 8. Image-to-Prompt ─────────────────────────────────────────

/**
 * Reverse-engineer a prompt from an image.
 */
export async function imageToPrompt(imageBase64OrUrl: string): Promise<FreepikTask> {
  return postAI("/ai/image-to-prompt", { image: imageBase64OrUrl });
}

// ─── 9. Stock Search & Download ─────────────────────────────────

export interface StockSearchOptions {
  page?: number;
  per_page?: number;
  order_by?: "latest" | "popular" | "downloads" | "trending";
  content_type?: "photo" | "vector" | "illustration" | "psd" | "mockup";
  orientation?: "horizontal" | "vertical" | "square";
  license?: "free" | "premium";
}

export interface StockResource {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  license: string;
  content_type: string;
  downloads: number;
}

export interface StockSearchResult {
  data: StockResource[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

/**
 * Search Freepik stock library.
 */
export async function searchStock(query: string, options: StockSearchOptions = {}): Promise<StockSearchResult> {
  const params = new URLSearchParams({ query });
  if (options.page) params.set("page", String(options.page));
  if (options.per_page) params.set("per_page", String(options.per_page));
  if (options.order_by) params.set("order_by", options.order_by);
  if (options.content_type) params.set("filters[content_type]", options.content_type);
  if (options.orientation) params.set("filters[orientation]", options.orientation);
  if (options.license) params.set("filters[license]", options.license);

  const res = await fetch(`${BASE}/resources?${params}`, { headers: headers() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Stock search failed (${res.status}): ${JSON.stringify(err)}`);
  }
  return res.json();
}

/**
 * Download a stock resource.
 */
export async function downloadStock(resourceId: string): Promise<string> {
  const res = await fetch(`${BASE}/resources/${resourceId}/download`, { headers: headers() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Download failed (${res.status}): ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data?.data?.url || data?.data?.download_url;
}

// ─── 10. AI Icon Generation ─────────────────────────────────────

/**
 * Generate icons from text prompt.
 */
export async function generateIcon(
  prompt: string,
  style: "solid" | "outline" | "color" | "flat" | "sticker" = "flat"
): Promise<FreepikTask> {
  return postAI("/ai/text-to-icon", { prompt, style });
}

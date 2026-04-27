/**
 * Image generation for social media content
 *
 * Priority: Atlas Cloud GPT Image 2 (highest quality, fastest) →
 *           Freepik Mystic →
 *           DALL-E 3 →
 *           Pollinations (free fallback).
 *
 * Atlas was added in Sprint 22 (PACAME website redesign) — it's ~$0.032/img,
 * faster polling than Freepik, and supports cascade fallback to Imagen 4 / Seedream / Flux internally.
 */

import { generateMystic, waitForTask } from "@/lib/freepik";
import { generateAtlasImage, type AtlasRatio } from "@/lib/atlas-image";
import { getLogger } from "@/lib/observability/logger";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY?.trim();
const ATLAS_API_KEY = process.env.ATLAS_API_KEY?.trim();

const PLATFORM_ATLAS_RATIO: Record<string, AtlasRatio> = {
  instagram: "1024x1024",
  facebook: "1536x1024",
  linkedin: "1536x1024",
  twitter: "1536x1024",
  stories: "1080x1920",
  reels: "1080x1920",
};

type AspectRatio = "square_1_1" | "widescreen_16_9" | "social_story_9_16" | "classic_4_3";

const PLATFORM_RATIOS: Record<string, AspectRatio> = {
  instagram: "square_1_1",
  facebook: "widescreen_16_9",
  linkedin: "widescreen_16_9",
  twitter: "widescreen_16_9",
  stories: "social_story_9_16",
  reels: "social_story_9_16",
};

const PLATFORM_SIZES: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  facebook: { width: 1200, height: 630 },
  linkedin: { width: 1200, height: 627 },
  twitter: { width: 1200, height: 675 },
};

/**
 * Generate an image with the best available provider.
 * Freepik Mystic → DALL-E 3 → Pollinations
 */
export async function generateImage(prompt: string, platform = "instagram"): Promise<string | null> {
  const enhancedPrompt = `Professional social media visual for ${platform}, modern clean design, high quality photography style: ${prompt}. No text overlay, no watermarks.`;

  // 1. Try Atlas Cloud GPT Image 2 (highest quality, fastest)
  if (ATLAS_API_KEY) {
    try {
      const ratio = PLATFORM_ATLAS_RATIO[platform] || "1024x1024";
      const result = await generateAtlasImage(enhancedPrompt, {
        ratio,
        save: false,
      });
      if (result?.url) return result.url;
    } catch (err) {
      getLogger().error({ err }, "[ImageGen] Atlas GPT Image 2 failed, trying Freepik");
    }
  }

  // 2. Try Freepik Mystic (best quality)
  if (FREEPIK_API_KEY) {
    try {
      const ratio = PLATFORM_RATIOS[platform] || "square_1_1";
      const task = await generateMystic(enhancedPrompt, {
        model: "realism",
        resolution: "2k",
        aspect_ratio: ratio,
      });
      const result = await waitForTask(`/ai/mystic/${task.task_id}`, 24, 5000);
      if (result.status === "COMPLETED" && result.generated?.length) {
        return result.generated[0];
      }
    } catch (err) {
      getLogger().error({ err }, "[ImageGen] Freepik Mystic failed, trying DALL-E");
    }
  }

  // 3. Try DALL-E 3
  if (OPENAI_API_KEY) {
    try {
      const size = platform === "instagram" ? "1024x1024" : "1792x1024";
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "dall-e-3", prompt: enhancedPrompt, n: 1, size, quality: "standard" }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.data?.[0]?.url;
        if (url) return url;
      }
    } catch (err) {
      getLogger().error({ err }, "[ImageGen] DALL-E failed, trying Pollinations");
    }
  }

  // 4. Pollinations (free, no key needed)
  const dim = PLATFORM_SIZES[platform] || PLATFORM_SIZES.instagram;
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dim.width}&height=${dim.height}&nologo=true`;
  try {
    const res = await fetch(pollinationsUrl, { method: "HEAD", signal: AbortSignal.timeout(30000) });
    if (res.ok) return pollinationsUrl;
  } catch { /* all providers failed */ }

  return null;
}

/**
 * Generate image optimized for content cards.
 * Used by the content API when generating calendar posts.
 */
export async function generateContentImage(imagePrompt: string, platform: string): Promise<string | null> {
  if (!imagePrompt || imagePrompt.length < 5) return null;
  return generateImage(imagePrompt, platform);
}

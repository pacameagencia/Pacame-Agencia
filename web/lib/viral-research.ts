/**
 * pacame-viral-visuals — Research de trends IG vía Apify
 *
 * Scrape top posts de hashtags con apify/instagram-hashtag-scraper,
 * guarda en viral_references y devuelve los ids para analizar.
 */

import { createServerSupabase } from "./supabase/server";

const APIFY_TOKEN = process.env.APIFY_API_KEY?.trim();
const APIFY_BASE = "https://api.apify.com/v2";
const HASHTAG_ACTOR = "apify~instagram-hashtag-scraper";

export interface ApifyPost {
  url?: string;
  shortCode?: string;
  type?: string; // "Image" | "Video" | "Sidecar"
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  displayUrl?: string;
  videoUrl?: string;
  ownerUsername?: string;
  ownerFullName?: string;
  timestamp?: string;
  hashtags?: string[];
  alt?: string;
}

export interface ScrapeResult {
  niche: string;
  hashtags: string[];
  captured: number;
  inserted: number;
  reference_ids: string[];
}

function mapPostType(t?: string, v?: string): "post" | "reel" | "carousel" | "story" {
  if (v) return "reel";
  if (t === "Sidecar") return "carousel";
  return "post";
}

/**
 * Scrape posts virales de uno o varios hashtags y los guarda en Supabase.
 * Solo mete los que superan 1.5x likes promedio del dataset (outliers).
 */
export async function scrapeHashtags(params: {
  niche: string;
  hashtags: string[];
  resultsPerHashtag?: number;
}): Promise<ScrapeResult> {
  if (!APIFY_TOKEN) throw new Error("APIFY_API_KEY not configured");
  const { niche, hashtags, resultsPerHashtag = 30 } = params;

  const res = await fetch(
    `${APIFY_BASE}/acts/${HASHTAG_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hashtags,
        resultsLimit: resultsPerHashtag,
        resultsType: "posts",
      }),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Apify scrape failed (${res.status}): ${txt.slice(0, 200)}`);
  }

  const posts: ApifyPost[] = await res.json();
  if (!Array.isArray(posts) || posts.length === 0) {
    return { niche, hashtags, captured: 0, inserted: 0, reference_ids: [] };
  }

  const likes = posts.map((p) => p.likesCount || 0).filter((n) => n > 0);
  const avgLikes = likes.length ? likes.reduce((a, b) => a + b, 0) / likes.length : 0;
  const threshold = avgLikes * 1.5;
  const outliers = posts.filter((p) => (p.likesCount || 0) >= threshold);

  const supabase = createServerSupabase();
  const rows = outliers.map((p) => ({
    platform: "instagram" as const,
    niche,
    hashtag: p.hashtags?.[0] || hashtags[0],
    post_url: p.url || `https://instagram.com/p/${p.shortCode}`,
    post_type: mapPostType(p.type, p.videoUrl),
    caption: p.caption?.slice(0, 2000) || null,
    likes: p.likesCount || 0,
    comments: p.commentsCount || 0,
    views: p.videoViewCount ?? null,
    image_url: p.displayUrl || null,
    video_url: p.videoUrl || null,
    owner_username: p.ownerUsername || null,
    posted_at: p.timestamp || null,
    raw: p as unknown as Record<string, unknown>,
  }));

  if (rows.length === 0) {
    return { niche, hashtags, captured: posts.length, inserted: 0, reference_ids: [] };
  }

  const { data, error } = await supabase
    .from("viral_references")
    .upsert(rows, { onConflict: "post_url", ignoreDuplicates: false })
    .select("id");

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);

  return {
    niche,
    hashtags,
    captured: posts.length,
    inserted: data?.length || 0,
    reference_ids: (data || []).map((r) => r.id as string),
  };
}

/**
 * Hashtags default por nicho ES. Pablo puede sobreescribir desde el cliente.
 */
export const DEFAULT_HASHTAGS_ES: Record<string, string[]> = {
  "marketing-digital": ["marketingdigital", "branding", "emprendedores", "pymes", "agenciadigital"],
  "moda": ["ootd", "streetstyle", "moda", "outfit", "tendencias"],
  "food": ["foodporn", "recetasfaciles", "foodphotography", "gastronomiaespañola"],
  "fitness": ["fitness", "rutinadeentrenamiento", "transformacion", "crossfit"],
  "tech": ["productivity", "saas", "tech", "indiehackers", "startup"],
  "inmobiliaria": ["inmobiliaria", "pisosenventa", "alquilar", "realestate"],
  "belleza": ["belleza", "makeup", "skincare", "maquillaje", "tendenciasbelleza"],
  "viajes": ["viajes", "viajar", "travel", "turismo", "destinos"],
};

export function resolveHashtags(niche: string, custom?: string[]): string[] {
  if (custom && custom.length) return custom;
  return DEFAULT_HASHTAGS_ES[niche] || [niche.replace(/\s+/g, "")];
}

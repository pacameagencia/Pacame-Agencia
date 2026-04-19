/**
 * Apify Google Maps client — usado por outreach engine.
 * Sync call: arranca + espera + devuelve resultados.
 */

import { getLogger } from "@/lib/observability/logger";

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_ACTOR = "nwua9Gu5YrADL7ZDj"; // Google Maps Scraper

export interface ScrapedBusiness {
  name: string;
  title?: string;
  website?: string;
  url?: string;
  phone?: string;
  address?: string;
  city?: string;
  location?: { lat?: number; lng?: number };
  placeId?: string;
  googlePlaceId?: string;
  rating?: number;
  totalScore?: number;
  reviewCount?: number;
  reviewsCount?: number;
  categoryName?: string;
  neighborhood?: string;
}

/**
 * Scrapes Google Maps via Apify actor. Returns up to `maxResults` businesses.
 * Synchronous: waits up to 3 minutes for the run to complete.
 */
export async function scrapeGoogleMaps(
  searchQuery: string,
  location: string,
  maxResults = 10
): Promise<ScrapedBusiness[]> {
  const log = getLogger();
  if (!APIFY_API_KEY) {
    log.warn({}, "APIFY_API_KEY missing — outreach scrape skipped");
    return [];
  }

  try {
    log.info({ searchQuery, location, maxResults }, "apify scrape start");

    // 1) Launch run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=180`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [searchQuery],
          locationQuery: location,
          maxCrawledPlacesPerSearch: maxResults,
          language: "es",
          includeWebResults: false,
        }),
      }
    );

    if (!startRes.ok) {
      const text = await startRes.text();
      log.error({ status: startRes.status, text: text.slice(0, 200) }, "apify run-sync failed");
      return [];
    }

    const items = (await startRes.json()) as ScrapedBusiness[];
    log.info({ count: Array.isArray(items) ? items.length : 0 }, "apify scrape complete");
    return Array.isArray(items) ? items : [];
  } catch (err) {
    log.error({ err }, "apify scrape exception");
    return [];
  }
}

export function normalizeBusinessRecord(raw: ScrapedBusiness): {
  business_name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  google_place_id: string | null;
  rating: number | null;
  review_count: number | null;
} {
  return {
    business_name: raw.name || raw.title || "Unnamed",
    website: raw.website || raw.url || null,
    phone: raw.phone || null,
    address: raw.address || null,
    city: raw.city || raw.neighborhood || null,
    google_place_id: raw.placeId || raw.googlePlaceId || null,
    rating: raw.rating ?? raw.totalScore ?? null,
    review_count: raw.reviewCount ?? raw.reviewsCount ?? null,
  };
}

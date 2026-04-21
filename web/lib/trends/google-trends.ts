/**
 * Google Trends España — via Apify (actor público).
 *
 * Degradación graceful: si APIFY_API_KEY no está o el actor falla, devuelve [].
 * El scanner combina esto con otras fuentes, no depende solo de esta.
 */

const APIFY_TOKEN = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || '';

export interface GoogleTrend {
  keyword: string;
  trafficLabel?: string;  // ej "10K+", "50K+" (daily searches estimation)
  traffic?: number;        // numérico derivado del label
  category?: string;
  relatedQueries?: string[];
  pageUrl?: string;        // link a Google Trends
  source: 'apify-google-trends' | 'unavailable';
}

// Parsea strings tipo "50K+", "100K+" a número aproximado
function parseTrafficLabel(label: string | undefined): number {
  if (!label) return 0;
  const m = label.match(/(\d+[.,]?\d*)\s*([KkMm])?/);
  if (!m) return 0;
  const base = parseFloat(m[1].replace(',', '.'));
  const unit = m[2]?.toLowerCase();
  if (unit === 'k') return Math.round(base * 1000);
  if (unit === 'm') return Math.round(base * 1_000_000);
  return Math.round(base);
}

const ACTOR_IDS = [
  'emastra~google-trends-scraper',       // más estable
  'tri_angle~google-trends',              // fallback
  'apify~google-trends-scraper',          // fallback 2
];

/**
 * Lanza actor Apify y espera resultado síncronamente (runSync).
 * Timeout: 90s (Apify puede ser lento).
 */
export async function fetchGoogleTrendsES(options: {
  timeframe?: 'now 1-d' | 'now 7-d' | 'today 1-m';
  limit?: number;
} = {}): Promise<GoogleTrend[]> {
  if (!APIFY_TOKEN) {
    console.warn('[google-trends] APIFY_API_KEY no configurado, skip');
    return [];
  }

  const input = {
    geo: 'ES',
    timeRange: options.timeframe ?? 'now 7-d',
    maxItems: options.limit ?? 25,
    language: 'es',
  };

  for (const actorId of ACTOR_IDS) {
    try {
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=90`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const r = await fetch(runUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!r.ok) {
        console.warn(`[google-trends] actor ${actorId} HTTP ${r.status}`);
        continue;
      }

      const items = await r.json() as any[];
      if (!Array.isArray(items) || items.length === 0) continue;

      return items.slice(0, options.limit ?? 25).map(it => ({
        keyword: String(it.title || it.query || it.keyword || it.term || '').trim(),
        trafficLabel: it.traffic || it.trafficLabel || it.formattedTraffic,
        traffic: parseTrafficLabel(it.traffic || it.trafficLabel || it.formattedTraffic),
        category: it.category || it.topCategory,
        relatedQueries: it.relatedQueries || it.related_queries || [],
        pageUrl: it.pageUrl || it.url,
        source: 'apify-google-trends',
      })).filter(t => t.keyword.length > 0);
    } catch (err) {
      console.warn(`[google-trends] actor ${actorId} error:`, (err as Error).message);
      continue;
    }
  }

  return [];
}

/**
 * Google Autocomplete público (endpoint suggestqueries.google.com).
 * Gratis, sin auth, ilimitado razonablemente.
 *
 * Lo usamos para:
 * 1. Validar que una keyword TIENE demanda real (Google la autocompleta)
 * 2. Descubrir long-tail keywords asociadas (mejor SEO targeting)
 * 3. Estimar volumen relativo (si Google da 10 sugerencias es keyword popular)
 */

export interface AutocompleteResult {
  query: string;
  suggestions: string[];
  count: number;
  hasDemand: boolean; // true si Google autosugiere (= gente busca)
  source: string;    // URL real consultada
}

const ENDPOINT = 'https://suggestqueries.google.com/complete/search';

export async function googleAutocomplete(
  query: string,
  opts: { hl?: string; gl?: string; timeoutMs?: number } = {}
): Promise<AutocompleteResult> {
  const hl = opts.hl ?? 'es';
  const gl = opts.gl ?? 'es';
  const timeoutMs = opts.timeoutMs ?? 5000;
  const url = `${ENDPOINT}?client=firefox&q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) return { query, suggestions: [], count: 0, hasDemand: false, source: url };
    const json = await r.json() as [string, string[]];
    const suggestions = Array.isArray(json?.[1]) ? json[1] : [];
    return {
      query,
      suggestions,
      count: suggestions.length,
      hasDemand: suggestions.length >= 3, // umbral: al menos 3 sugerencias = hay demanda
      source: url,
    };
  } catch {
    clearTimeout(timeout);
    return { query, suggestions: [], count: 0, hasDemand: false, source: url };
  }
}

/**
 * Autocomplete múltiple en paralelo.
 */
export async function googleAutocompleteBatch(queries: string[]): Promise<AutocompleteResult[]> {
  const results = await Promise.allSettled(queries.map(q => googleAutocomplete(q)));
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { query: queries[i], suggestions: [], count: 0, hasDemand: false, source: '' }
  );
}

/**
 * Heurística de volumen de búsqueda mensual basada en:
 * - Cantidad de autocompletes
 * - Longitud de queries (long-tail generalmente menos volumen)
 * - Modificadores populares ("como", "mejor", "precio", "gratis")
 *
 * Es una APROXIMACIÓN CONSERVADORA, no un dato real. Se marca como `estimated`.
 * Para volumen real → SerpApi/DataForSEO (requieren key).
 */
export function estimateMonthlyVolumeFromAutocomplete(r: AutocompleteResult): number {
  if (!r.hasDemand) return 0;

  // Base según número de sugerencias
  const base = {
    '3': 500,
    '4': 1500,
    '5': 3000,
    '6': 6000,
    '7': 10000,
    '8': 18000,
    '9': 30000,
    '10': 50000,
  } as Record<string, number>;
  const countKey = Math.min(10, Math.max(3, r.count)).toString();
  let estimate = base[countKey] ?? 500;

  // Modificadores comerciales que indican intent de compra (más volumen)
  const commercialModifiers = ['como', 'mejor', 'precio', 'barato', 'gratis', 'online', 'opiniones', 'comprar'];
  const hasCommercial = r.suggestions.some(s =>
    commercialModifiers.some(m => s.toLowerCase().includes(m))
  );
  if (hasCommercial) estimate = Math.floor(estimate * 1.4);

  // Queries muy cortas = volumen alto (head terms)
  if (r.query.split(' ').length <= 2) estimate = Math.floor(estimate * 1.3);

  return estimate;
}

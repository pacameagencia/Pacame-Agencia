/**
 * firecrawl-brand.ts — Extrae brand identity de una URL cliente vía Firecrawl REST.
 *
 * Producto: Cliente Factory FASE H. Toma una URL → devuelve `BrandBrief` con
 * colores, fonts, logo, copy samples, sector_guess. Cero auth extra (FIRECRAWL_API_KEY
 * ya en .env). Cacheable en `client_intake_cache` (TTL 24h por defecto).
 *
 * Estrategia:
 *   1. Firecrawl /v1/scrape con formats=["markdown","html"] (NO screenshot por defecto
 *      para ahorrar coste; activable con extras.includeScreenshot=true).
 *   2. Extraemos colores del CSS embebido en <style> + atributos style inline.
 *   3. Extraemos fonts de font-family declarations.
 *   4. Extraemos logo: img dentro de <header> con alt~=logo, o el primer img del top.
 *   5. Heurística sector por keywords en markdown.
 *   6. Copy samples: H1/H2 del markdown + párrafos relevantes + CTAs (a/button con verbos).
 *   7. Confidence = score combinado (logo + colors + sector_match).
 *
 * Sin LLM por defecto. Si confidence < 0.6 y caller pasa `extras.refineWithLlm=true`,
 * pasamos por llmChat tier=standard para refinar sector_guess y copy_samples.
 */

import { llmChat } from "@/lib/llm";

export type SectorGuess = "hosteleria" | "retail" | "servicios" | "salud" | "educacion" | "otros";

export interface BrandBrief {
  schema_version: 1;
  url: string;
  url_normalized: string;
  business_name: string;
  sector_guess: SectorGuess;
  primary_color: string | null;   // #hex
  accent_color: string | null;
  fonts: string[];
  logo_url: string | null;
  copy_samples: { headlines: string[]; body: string[]; ctas: string[] };
  contact: { phone?: string; email?: string; address?: string };
  confidence: number;  // 0-1
  fetched_at: string;
}

export interface ExtractOptions {
  includeScreenshot?: boolean;
  refineWithLlm?: boolean;
  timeoutMs?: number;
}

const FIRECRAWL_API = "https://api.firecrawl.dev/v1/scrape";

/** Normaliza URL: lowercase host, sin trailing slash, sin querystring. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
    u.hash = "";
    u.search = "";
    let pathname = u.pathname.replace(/\/$/, "");
    return `${u.protocol}//${u.hostname.toLowerCase()}${pathname}`;
  } catch {
    return url;
  }
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

async function firecrawlScrape(url: string, opts: ExtractOptions): Promise<FirecrawlScrapeResponse> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY no seteada en .env");

  const formats = ["markdown", "html"];
  if (opts.includeScreenshot) formats.push("screenshot@fullPage");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 45000);
  try {
    const r = await fetch(FIRECRAWL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        url,
        formats,
        onlyMainContent: false,  // NO recortar — necesitamos head/styles
        waitFor: 1500,
        timeout: 30000,
      }),
      signal: ac.signal,
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`firecrawl ${r.status}: ${text.slice(0, 300)}`);
    }
    return (await r.json()) as FirecrawlScrapeResponse;
  } finally {
    clearTimeout(timer);
  }
}

// ───────── Extractors ─────────

const HEX_COLOR_RE = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
const RGB_COLOR_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
const FONT_FAMILY_RE = /font-family\s*:\s*([^;}"]+)/gi;
const LOGO_IMG_RE = /<img[^>]*\b(?:alt|src|class|id)=["'][^"']*\blogo[^"']*["'][^>]*>/gi;
const HEADER_IMG_RE = /<header\b[^>]*>([\s\S]*?)<\/header>/i;
const FIRST_IMG_RE = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("");
}

function extractColors(html: string): { primary: string | null; accent: string | null } {
  const colorCounts = new Map<string, number>();

  let m: RegExpExecArray | null;
  while ((m = HEX_COLOR_RE.exec(html))) {
    let hex = m[1].toLowerCase();
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const norm = `#${hex}`;
    if (norm === "#000000" || norm === "#ffffff") continue;  // skip neutros, no son brand
    colorCounts.set(norm, (colorCounts.get(norm) ?? 0) + 1);
  }
  while ((m = RGB_COLOR_RE.exec(html))) {
    const hex = rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
    if (hex === "#000000" || hex === "#ffffff") continue;
    colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
  }

  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    primary: sorted[0]?.[0] ?? null,
    accent: sorted[1]?.[0] ?? null,
  };
}

function extractFonts(html: string): string[] {
  const fonts = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = FONT_FAMILY_RE.exec(html))) {
    const families = m[1].split(",").map((f) => f.trim().replace(/^['"]|['"]$/g, ""));
    for (const f of families) {
      if (!f) continue;
      const lc = f.toLowerCase();
      if (lc === "inherit" || lc === "system-ui" || lc === "ui-sans-serif" || lc === "sans-serif" || lc === "serif" || lc === "monospace") continue;
      fonts.add(f);
    }
  }
  return [...fonts].slice(0, 10);
}

function extractLogo(html: string, baseUrl: string): string | null {
  // 1) <img> con alt/class/id que contiene "logo"
  const logoMatch = html.match(LOGO_IMG_RE);
  if (logoMatch) {
    const srcMatch = logoMatch[0].match(/\bsrc=["']([^"']+)["']/i);
    if (srcMatch) return absolutizeUrl(srcMatch[1], baseUrl);
  }
  // 2) Primer <img> dentro de <header>
  const headerMatch = html.match(HEADER_IMG_RE);
  if (headerMatch) {
    const firstImg = headerMatch[1].match(FIRST_IMG_RE);
    if (firstImg) return absolutizeUrl(firstImg[1], baseUrl);
  }
  return null;
}

function absolutizeUrl(src: string, base: string): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
    return src.startsWith("//") ? `https:${src}` : src;
  }
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

const SECTOR_KEYWORDS: Record<SectorGuess, RegExp> = {
  hosteleria: /\b(reserva|reservar|carta|men[uú]|menú|cocina|chef|restaurante|bar|caf[eé]|cafeter[íi]a|terraza|degustaci[oó]n|sala|comensales)\b/i,
  retail: /\b(comprar|carrito|env[íi]o|tienda|cesta|cat[áa]logo|stock|talla|color|art[íi]culo|producto|outlet|rebajas)\b/i,
  servicios: /\b(consultor[íi]a|servicios|asesor[íi]a|gestor[íi]a|despacho|abogad|contabilidad|fiscal|seo|marketing|agencia|reservar cita)\b/i,
  salud: /\b(cl[íi]nica|consulta|m[eé]dico|odontolog|fisioterap|psicolog|paciente|tratamiento|hist[óo]rico m[eé]dico|seguro m[eé]dico)\b/i,
  educacion: /\b(curso|m[áa]ster|matr[íi]cula|alumno|profesor|escuela|colegio|instituto|universidad|academia|formaci[oó]n|programa formativo)\b/i,
  otros: /^$/,
};

function guessSector(text: string): { sector: SectorGuess; matchScore: number } {
  let best: SectorGuess = "otros";
  let bestScore = 0;
  for (const [key, re] of Object.entries(SECTOR_KEYWORDS) as [SectorGuess, RegExp][]) {
    if (key === "otros") continue;
    const matches = text.match(new RegExp(re.source, "gi"));
    const count = matches?.length ?? 0;
    if (count > bestScore) {
      bestScore = count;
      best = key;
    }
  }
  // Score normalizado 0-1 (10+ matches = 1.0)
  return { sector: best, matchScore: Math.min(1, bestScore / 10) };
}

function extractCopySamples(markdown: string, html: string): BrandBrief["copy_samples"] {
  const headlines: string[] = [];
  const body: string[] = [];
  const ctas: string[] = [];

  // Headlines: H1/H2 del markdown
  const hMatches = markdown.matchAll(/^#{1,2}\s+(.+)$/gm);
  for (const m of hMatches) {
    const text = m[1].trim().replace(/[*_`]/g, "");
    if (text.length > 3 && text.length < 120 && !headlines.includes(text)) headlines.push(text);
    if (headlines.length >= 6) break;
  }

  // Body: párrafos > 80 chars del markdown
  const paragraphs = markdown.split(/\n\n+/).map((p) => p.trim()).filter((p) => p && !p.startsWith("#") && !p.startsWith("|") && !p.startsWith("```"));
  for (const p of paragraphs) {
    const clean = p.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`>]/g, "").trim();
    if (clean.length > 80 && clean.length < 400 && !body.includes(clean)) body.push(clean);
    if (body.length >= 4) break;
  }

  // CTAs: <a> y <button> con verbos comunes en español
  const ctaRe = /<(?:a|button)[^>]*>([^<]{2,40})<\/(?:a|button)>/gi;
  const ctaVerbs = /^(reserv|llam|pid|encarg|comprar|contacta|escribe|env[íi]a|cons[uú]lta|descubr|ver |solicit|registr|empez|prob|descarga|abrir|comenz|inscrib)/i;
  let m: RegExpExecArray | null;
  while ((m = ctaRe.exec(html))) {
    const txt = m[1].trim();
    if (ctaVerbs.test(txt) && !ctas.includes(txt)) ctas.push(txt);
    if (ctas.length >= 6) break;
  }

  return { headlines, body, ctas };
}

const PHONE_RE = /(?:\+?34[\s-]?)?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{3}/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function extractContact(text: string): BrandBrief["contact"] {
  const phone = text.match(PHONE_RE)?.[0]?.replace(/[\s-]/g, "");
  const email = text.match(EMAIL_RE)?.[0];
  return {
    phone: phone || undefined,
    email: email || undefined,
  };
}

// ───────── Pipeline principal ─────────

export async function extractBrand(url: string, opts: ExtractOptions = {}): Promise<BrandBrief> {
  const url_normalized = normalizeUrl(url);
  const fetched_at = new Date().toISOString();

  const scraped = await firecrawlScrape(url_normalized, opts);
  if (!scraped.success || !scraped.data) {
    throw new Error(`firecrawl no devolvió data: ${scraped.error ?? "unknown"}`);
  }

  const html = scraped.data.html ?? scraped.data.rawHtml ?? "";
  const markdown = scraped.data.markdown ?? "";
  const meta = scraped.data.metadata ?? {};

  const business_name =
    meta.ogTitle?.split(/[|·-]/)[0].trim() ||
    meta.title?.split(/[|·-]/)[0].trim() ||
    new URL(url_normalized).hostname.replace(/^www\./, "");

  const colors = extractColors(html);
  const fonts = extractFonts(html);
  const logo_url = extractLogo(html, url_normalized) || meta.ogImage || null;
  const sectorGuessRaw = guessSector(markdown + " " + (meta.description ?? ""));
  const copy_samples = extractCopySamples(markdown, html);
  const contact = extractContact(markdown + " " + html);

  // Confidence: combinación de señales
  let confidence = 0;
  if (colors.primary) confidence += 0.2;
  if (colors.accent) confidence += 0.1;
  if (fonts.length > 0) confidence += 0.15;
  if (logo_url) confidence += 0.2;
  if (copy_samples.headlines.length >= 1) confidence += 0.15;
  if (copy_samples.ctas.length >= 1) confidence += 0.1;
  confidence += sectorGuessRaw.matchScore * 0.1;
  confidence = Math.min(1, confidence);

  let sector_guess = sectorGuessRaw.sector;

  // Refinement opcional con LLM si confidence baja
  if (opts.refineWithLlm && confidence < 0.6 && markdown.length > 100) {
    try {
      const r = await llmChat(
        [
          { role: "system", content: "Eres un clasificador de sectores de negocio. Responde solo con uno de: hosteleria, retail, servicios, salud, educacion, otros. Sin explicación." },
          { role: "user", content: `URL: ${url_normalized}\n\nContenido (truncado):\n${markdown.slice(0, 2000)}\n\nSector:` },
        ],
        { tier: "standard", maxTokens: 20, temperature: 0, agentId: "sage", source: "factoria-firecrawl-brand" }
      );
      const guess = r.content.trim().toLowerCase().replace(/[^a-z]/g, "") as SectorGuess;
      if (["hosteleria", "retail", "servicios", "salud", "educacion", "otros"].includes(guess)) {
        sector_guess = guess;
        confidence = Math.min(1, confidence + 0.15);
      }
    } catch {
      // si falla LLM, mantenemos heurística
    }
  }

  return {
    schema_version: 1,
    url,
    url_normalized,
    business_name,
    sector_guess,
    primary_color: colors.primary,
    accent_color: colors.accent,
    fonts,
    logo_url,
    copy_samples,
    contact,
    confidence: Math.round(confidence * 100) / 100,
    fetched_at,
  };
}

import { NextRequest, NextResponse } from "next/server";

interface SiteAnalysis {
  url: string;
  title: string | null;
  meta_description: string | null;
  h1_count: number;
  has_cta: boolean;
  has_og_image: boolean;
  has_favicon: boolean;
  has_ssl: boolean;
  word_count: number;
  links_count: number;
  images_count: number;
  images_with_alt: number;
  response_time_ms: number;
  score: number;
  issues: string[];
}

function normalizeUrl(input: string): string | null {
  let url = input.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    return null;
  }
}

function extract(pattern: RegExp, html: string): string | null {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

async function analyzeSite(url: string): Promise<SiteAnalysis> {
  const t0 = Date.now();
  let html = "";
  let status = 0;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PacameBot/1.0; +https://pacameagencia.com)",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    status = res.status;
    html = await res.text();
  } catch (e) {
    // Return a stub analysis with error in issues
    return {
      url,
      title: null,
      meta_description: null,
      h1_count: 0,
      has_cta: false,
      has_og_image: false,
      has_favicon: false,
      has_ssl: url.startsWith("https://"),
      word_count: 0,
      links_count: 0,
      images_count: 0,
      images_with_alt: 0,
      response_time_ms: Date.now() - t0,
      score: 0,
      issues: [`No pudimos cargar la web: ${e instanceof Error ? e.message : "unknown"}`],
    };
  }

  const responseMs = Date.now() - t0;

  const title = extract(/<title[^>]*>([^<]+)<\/title>/i, html);
  const metaDesc = extract(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    html
  );
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const linksCount = (html.match(/<a\b[^>]*href=/gi) || []).length;
  const imagesAll = html.match(/<img\b[^>]*>/gi) || [];
  const imagesCount = imagesAll.length;
  const imagesWithAlt = imagesAll.filter((img) =>
    /\balt=["'][^"']+["']/i.test(img)
  ).length;
  const wordCount = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2).length;
  const hasCta =
    /<(button|a)\b[^>]*>[^<]*(comprar|reservar|contact|book|start|sign\s?up|comenzar|solicitar|pedir|descargar)/i.test(
      html
    );
  const hasOgImage = /<meta[^>]+property=["']og:image["']/i.test(html);
  const hasFavicon =
    /<link[^>]+rel=["'](shortcut icon|icon)["']/i.test(html);
  const hasSsl = url.startsWith("https://");

  // Score 0-100 based on weighted factors
  const issues: string[] = [];
  let score = 0;
  if (status === 200) score += 10;
  else issues.push(`HTTP ${status} (se esperaba 200)`);

  if (title && title.length >= 20 && title.length <= 65) score += 10;
  else issues.push(title ? `Titulo ${title.length} chars (ideal 20-65)` : "Sin titulo");

  if (metaDesc && metaDesc.length >= 120 && metaDesc.length <= 160) score += 10;
  else issues.push(metaDesc ? `Meta desc ${metaDesc.length} chars (ideal 120-160)` : "Sin meta description");

  if (h1Count === 1) score += 10;
  else issues.push(h1Count === 0 ? "Sin H1" : `${h1Count} H1s (ideal 1)`);

  if (wordCount >= 300) score += 10;
  else issues.push(`Solo ${wordCount} palabras visibles (ideal 300+)`);

  if (imagesCount > 0 && imagesWithAlt / imagesCount >= 0.8) score += 10;
  else if (imagesCount > 0) issues.push(`${imagesWithAlt}/${imagesCount} imagenes tienen alt`);

  if (hasCta) score += 10;
  else issues.push("Sin CTAs detectados en HTML");

  if (hasOgImage) score += 5;
  else issues.push("Sin OG image (compartir en redes queda feo)");

  if (hasFavicon) score += 5;
  else issues.push("Sin favicon");

  if (hasSsl) score += 10;
  else issues.push("Sin HTTPS (critico)");

  if (responseMs < 1500) score += 10;
  else if (responseMs < 3000) score += 5;
  else issues.push(`Response time ${responseMs}ms (ideal <1500ms)`);

  return {
    url,
    title,
    meta_description: metaDesc,
    h1_count: h1Count,
    has_cta: hasCta,
    has_og_image: hasOgImage,
    has_favicon: hasFavicon,
    has_ssl: hasSsl,
    word_count: wordCount,
    links_count: linksCount,
    images_count: imagesCount,
    images_with_alt: imagesWithAlt,
    response_time_ms: responseMs,
    score: Math.min(100, score),
    issues,
  };
}

export async function POST(req: NextRequest) {
  let body: { you?: string; competitor?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const youUrl = normalizeUrl(body.you || "");
  const compUrl = normalizeUrl(body.competitor || "");
  if (!youUrl || !compUrl) {
    return NextResponse.json({ error: "URLs invalidas" }, { status: 400 });
  }

  try {
    const [you, competitor] = await Promise.all([
      analyzeSite(youUrl),
      analyzeSite(compUrl),
    ]);

    const winner: "you" | "competitor" | "tie" =
      Math.abs(you.score - competitor.score) < 5
        ? "tie"
        : you.score > competitor.score
        ? "you"
        : "competitor";

    return NextResponse.json({ you, competitor, winner });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

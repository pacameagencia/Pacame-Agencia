/**
 * POST /api/factoria/intake — FASE H Cliente Factory front-door.
 *
 * Cliente pega URL → Firecrawl scrapea → BrandBrief con colores, fonts, logo,
 * copy, sector_guess. Cacheado 24h en `client_intake_cache`.
 *
 * Body:
 *   { url: string, force_refresh?: boolean, refine_with_llm?: boolean }
 *
 * Response 200:
 *   { brief_id: uuid, brief: BrandBrief, cached: boolean, ttl_remaining_hours: number }
 *
 * GET /api/factoria/intake — lista los últimos 50 intakes (auth interno).
 */

import { NextRequest, NextResponse } from "next/server";
import { extractBrand, normalizeUrl } from "@/lib/factoria/firecrawl-brand";
import { cacheGet, cacheSet, cacheList } from "@/lib/factoria/intake-cache";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

interface IntakeBody {
  url?: string;
  force_refresh?: boolean;
  refine_with_llm?: boolean;
  include_screenshot?: boolean;
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: IntakeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl || !isHttpUrl(rawUrl)) {
    return NextResponse.json({ error: "url requerida (http/https válido)" }, { status: 400 });
  }

  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const url_normalized = normalizeUrl(url);

  // 1. Cache check
  if (!body.force_refresh) {
    const cached = await cacheGet(url_normalized);
    if (cached.hit && !cached.expired && cached.brief && cached.row) {
      const ttl_remaining_hours =
        (new Date(cached.row.expires_at).getTime() - Date.now()) / 3600 / 1000;
      return NextResponse.json({
        ok: true,
        brief_id: cached.row.id,
        brief: cached.brief,
        cached: true,
        ttl_remaining_hours: Math.max(0, Math.round(ttl_remaining_hours * 10) / 10),
      });
    }
  }

  // 2. Scrape fresh
  let brief;
  try {
    brief = await extractBrand(url, {
      refineWithLlm: body.refine_with_llm === true,
      includeScreenshot: body.include_screenshot === true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }

  // 3. Persist
  let brief_id: string;
  try {
    brief_id = await cacheSet(url, brief);
  } catch (err) {
    // Si la tabla no existe (migración pendiente) devolvemos brief sin cachear.
    return NextResponse.json({
      ok: true,
      brief_id: null,
      brief,
      cached: false,
      ttl_remaining_hours: 24,
      cache_error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    ok: true,
    brief_id,
    brief,
    cached: false,
    ttl_remaining_hours: 24,
  });
}

export async function GET(request: NextRequest) {
  // Listado solo accesible vía auth interno (panel admin).
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const rows = await cacheList(50);
  return NextResponse.json({
    ok: true,
    count: rows.length,
    intakes: rows.map((r) => ({
      id: r.id,
      url: r.url_original,
      url_normalized: r.url_normalized,
      sector_guess: r.sector_guess,
      confidence: r.confidence,
      fetched_at: r.fetched_at,
      expires_at: r.expires_at,
      business_name: r.brief_json?.business_name,
    })),
  });
}

/**
 * intake-cache.ts — Cache Supabase para BrandBrief de la factoría.
 *
 * Tabla: client_intake_cache (creada en infra/migrations/028_factoria_intake_cache.sql).
 * TTL default 24h. Llaves por url_normalized (sin querystring/hash).
 *
 * Uso (server-side only, requiere SUPABASE_SERVICE_ROLE_KEY):
 *   import { cacheGet, cacheSet, cacheGetById } from "@/lib/factoria/intake-cache";
 *
 *   const cached = await cacheGet(url);
 *   if (cached && !cached.expired) return cached.brief;
 *   const brief = await extractBrand(url);
 *   const id = await cacheSet(url, brief);
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeUrl, type BrandBrief } from "./firecrawl-brand";

export interface CacheRow {
  id: string;
  url_normalized: string;
  url_original: string;
  brief_json: BrandBrief;
  fetched_at: string;
  expires_at: string;
  confidence: number | null;
  sector_guess: string | null;
}

export interface CacheGetResult {
  hit: boolean;
  expired: boolean;
  row: CacheRow | null;
  brief: BrandBrief | null;
}

const DEFAULT_TTL_HOURS = 24;

/**
 * Busca por URL normalizada. Devuelve hit + expired (si fue encontrado pero caducó).
 * Si row.expired es true, el caller decide si reusar (stale-while-revalidate) o regenerar.
 */
export async function cacheGet(url: string): Promise<CacheGetResult> {
  const supabase = createServerSupabase();
  const url_normalized = normalizeUrl(url);
  const { data, error } = await supabase
    .from("client_intake_cache")
    .select("*")
    .eq("url_normalized", url_normalized)
    .maybeSingle();

  if (error || !data) return { hit: false, expired: false, row: null, brief: null };
  const expired = new Date(data.expires_at).getTime() < Date.now();
  return {
    hit: true,
    expired,
    row: data as CacheRow,
    brief: data.brief_json as BrandBrief,
  };
}

/**
 * Persiste un BrandBrief con TTL. Usa upsert por url_normalized — si ya existía,
 * sobreescribe (refresh).
 *
 * @returns id de la fila persistida
 */
export async function cacheSet(url: string, brief: BrandBrief, ttlHours: number = DEFAULT_TTL_HOURS): Promise<string> {
  const supabase = createServerSupabase();
  const url_normalized = normalizeUrl(url);
  const expires_at = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("client_intake_cache")
    .upsert(
      {
        url_normalized,
        url_original: url,
        brief_json: brief,
        fetched_at: brief.fetched_at,
        expires_at,
        confidence: brief.confidence,
        sector_guess: brief.sector_guess,
      },
      { onConflict: "url_normalized" }
    )
    .select("id")
    .single();

  if (error || !data) throw new Error(`cacheSet failed: ${error?.message ?? "unknown"}`);
  return data.id;
}

export async function cacheGetById(id: string): Promise<CacheRow | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("client_intake_cache")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as CacheRow;
}

export async function cacheList(limit = 50): Promise<CacheRow[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("client_intake_cache")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as CacheRow[];
}

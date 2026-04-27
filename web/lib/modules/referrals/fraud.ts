import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralConfig } from "./config";

export type FraudCheck =
  | { ok: true }
  | { ok: false; reason: "rate_limited" | "ip_capped" };

/**
 * Detecta User-Agents que claramente son bots/curl/scraping.
 * NO bloquea browsers raros — solo headers manifiestamente no-humanos.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;          // sin UA: bloquear
  const ua = userAgent.toLowerCase();
  if (ua.length < 10) return true;       // demasiado corto para ser navegador real
  // Lista de signatures comunes de bots/scrapers
  const blockedPatterns = [
    "curl/", "wget/", "python-requests", "python-urllib", "go-http-client",
    "node-fetch", "axios/", "okhttp/", "java/", "ruby", "php-curl",
    "headless", "phantomjs", "puppeteer", "playwright",
    "scraper", "spider", "crawler", "bot/", "bot ",
  ];
  for (const sig of blockedPatterns) {
    if (ua.includes(sig)) return true;
  }
  return false;
}

export function fingerprint(ip: string | null, userAgent: string | null, acceptLang: string | null): string {
  return crypto
    .createHash("sha256")
    .update(`${ip || ""}|${userAgent || ""}|${acceptLang || ""}`)
    .digest("hex");
}

export function extractIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  const real = req.headers.get("x-real-ip");
  return real || null;
}

export async function checkVisitFraud(
  supabase: SupabaseClient,
  config: ReferralConfig,
  ip: string | null,
): Promise<FraudCheck> {
  if (!ip) return { ok: true };
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("aff_visits")
    .select("id", { head: true, count: "exact" })
    .eq("tenant_id", config.tenantId)
    .eq("ip", ip)
    .gte("created_at", since);
  if (error) return { ok: true };
  if ((count ?? 0) >= config.visitRateLimitPerHour) return { ok: false, reason: "rate_limited" };
  return { ok: true };
}

/**
 * Returns true if the same IP has produced more than `ipConversionCap24h`
 * distinct conversions in the last 24h — caller should mark the affiliate as suspicious.
 */
export async function ipConversionCapExceeded(
  supabase: SupabaseClient,
  config: ReferralConfig,
  ip: string | null,
): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("aff_visits")
    .select("affiliate_id, aff_referrals!inner(status)")
    .eq("tenant_id", config.tenantId)
    .eq("ip", ip)
    .eq("aff_referrals.status", "converted")
    .gte("created_at", since);
  if (error || !data) return false;
  const distinctAffiliates = new Set(data.map((row: { affiliate_id: string }) => row.affiliate_id));
  return distinctAffiliates.size > config.ipConversionCap24h;
}

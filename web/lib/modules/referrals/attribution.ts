import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralConfig } from "./config";
import type { RefCookieValue } from "./cookie";
import { extractIp, fingerprint, checkVisitFraud } from "./fraud";

export type AttributionResult =
  | { ok: true; cookie: RefCookieValue; visitId: string }
  | { ok: false; reason: "unknown_code" | "self_referral" | "rate_limited" | "first_click_locked" };

export type AffiliateRow = {
  id: string;
  user_id: string | null;
  status: "active" | "suspicious" | "disabled";
};

export async function resolveAttribution(params: {
  supabase: SupabaseClient;
  config: ReferralConfig;
  refCode: string;
  request: Request;
  existingCookie: RefCookieValue | null;
  authenticatedUserId: string | null;
  landedPath?: string;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
  httpReferer?: string | null;
}): Promise<AttributionResult> {
  const { supabase, config, refCode, request, existingCookie, authenticatedUserId, utm, httpReferer } = params;

  const { data: affiliate, error } = await supabase
    .from("aff_affiliates")
    .select("id, user_id, status")
    .eq("tenant_id", config.tenantId)
    .eq("referral_code", refCode)
    .single<AffiliateRow>();

  if (error || !affiliate) return { ok: false, reason: "unknown_code" };
  if (affiliate.status !== "active") return { ok: false, reason: "unknown_code" };

  if (authenticatedUserId && authenticatedUserId === affiliate.user_id) {
    return { ok: false, reason: "self_referral" };
  }

  if (
    config.attribution === "first_click" &&
    existingCookie &&
    existingCookie.a !== affiliate.id
  ) {
    return { ok: false, reason: "first_click_locked" };
  }

  const ip = extractIp(request);
  const fraud = await checkVisitFraud(supabase, config, ip);
  if (!fraud.ok) return { ok: false, reason: "rate_limited" };

  const visitorUuid = existingCookie?.v && existingCookie.a === affiliate.id
    ? existingCookie.v
    : crypto.randomUUID();

  const userAgent = request.headers.get("user-agent");
  const acceptLang = request.headers.get("accept-language");

  const { data: visit, error: insertError } = await supabase
    .from("aff_visits")
    .insert({
      tenant_id: config.tenantId,
      affiliate_id: affiliate.id,
      visitor_uuid: visitorUuid,
      ip,
      user_agent: userAgent,
      fingerprint: fingerprint(ip, userAgent, acceptLang),
      landed_path: params.landedPath || null,
      http_referer: httpReferer || null,
      utm_source: utm?.source || null,
      utm_medium: utm?.medium || null,
      utm_campaign: utm?.campaign || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !visit) {
    return { ok: false, reason: "unknown_code" };
  }

  return {
    ok: true,
    cookie: { v: visitorUuid, c: refCode, a: affiliate.id, t: Date.now() },
    visitId: visit.id,
  };
}

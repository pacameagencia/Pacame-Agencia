/**
 * POST /api/darkroom/cookies/consent
 *
 * Logging del consentimiento de cookies para prueba RGPD (art. 7.1: el responsable
 * debe poder demostrar que el interesado consintió). Solo guarda metadatos
 * mínimos — NO PII más allá de IP hasheada y UA truncado.
 *
 * No-bloqueante: si Supabase falla, devolvemos 202 igualmente para que el banner
 * frontend cierre. La verdad operativa está en localStorage del cliente.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { createHash } from "crypto";

export const runtime = "nodejs";

interface ConsentPayload {
  analytics: boolean;
  functional: boolean;
  timestamp: string;
  version: number;
  userAgent?: string;
  referrer?: string | null;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.DARKROOM_CONSENT_HASH_SALT || "dr_consent_salt_v1";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function POST(request: NextRequest) {
  const log = getLogger();

  let payload: ConsentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Validación mínima
  if (
    typeof payload.analytics !== "boolean" ||
    typeof payload.functional !== "boolean" ||
    typeof payload.timestamp !== "string"
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const supabase = createServerSupabase();
  try {
    await supabase.from("darkroom_cookie_consents").insert({
      analytics: payload.analytics,
      functional: payload.functional,
      consent_at: payload.timestamp,
      schema_version: payload.version ?? 1,
      user_agent: payload.userAgent?.slice(0, 240) ?? null,
      referrer: payload.referrer?.slice(0, 240) ?? null,
      ip_hash: hashIp(ip),
    });
  } catch (err) {
    log.warn({ err }, "[darkroom-cookies] consent log failed");
    // 202 — no bloqueamos UX por fallo de log
    return NextResponse.json({ ok: true, logged: false }, { status: 202 });
  }

  return NextResponse.json({ ok: true, logged: true });
}

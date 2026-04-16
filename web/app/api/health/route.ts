import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/health
 *
 * Lightweight liveness + dependency check for uptime monitors (e.g. cron,
 * UptimeRobot, StatusCake). Returns 200 when the app can reach Supabase and
 * required env vars are present, 503 otherwise.
 */

interface HealthCheck {
  ok: boolean;
  latency_ms?: number;
  error?: string;
}

async function checkSupabase(): Promise<HealthCheck> {
  const t0 = Date.now();
  try {
    const supabase = createServerSupabase();
    // Cheap check — no rows needed, just confirm the connection resolves.
    const { error } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .limit(1);
    const latency_ms = Date.now() - t0;
    if (error) return { ok: false, latency_ms, error: error.message };
    return { ok: true, latency_ms };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - t0,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function checkVoiceServer(): Promise<HealthCheck> {
  const url = process.env.VOICE_SERVER_URL;
  if (!url) return { ok: true, error: "not configured" };
  const t0 = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, latency_ms: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - t0,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function GET() {
  const envPresent = {
    CLAUDE_API_KEY: !!process.env.CLAUDE_API_KEY,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    DASHBOARD_PASSWORD: !!process.env.DASHBOARD_PASSWORD,
    CRON_SECRET: !!process.env.CRON_SECRET,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
  };

  const [supabaseHealth, voiceHealth] = await Promise.all([
    checkSupabase(),
    checkVoiceServer(),
  ]);

  const ok =
    supabaseHealth.ok &&
    envPresent.SUPABASE_URL &&
    envPresent.SUPABASE_SERVICE_ROLE_KEY &&
    envPresent.DASHBOARD_PASSWORD &&
    envPresent.STRIPE_SECRET_KEY;

  return NextResponse.json(
    {
      ok,
      version: "vigorous-brown",
      timestamp: new Date().toISOString(),
      env: envPresent,
      checks: {
        supabase: supabaseHealth,
        voice_server: voiceHealth,
      },
    },
    { status: ok ? 200 : 503 }
  );
}

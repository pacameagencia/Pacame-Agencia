import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { pingUpstash } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Dependency + env check completo. Devuelve 503 si supabase/stripe caen,
 * 200 OK en caso contrario. Cache-Control no-store para uptime monitors.
 */

type CheckStatus = "ok" | "fail" | "unconfigured";

interface Check {
  status: CheckStatus;
  latency_ms?: number;
  error?: string;
}

interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string | null;
  timestamp: string;
  checks: {
    supabase: Check;
    stripe: Check;
    upstash: Check;
    resend: Check;
    voice_server: Check;
  };
  env: Record<string, boolean>;
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function checkSupabase(): Promise<Check> {
  const start = Date.now();
  try {
    const supabase = createServerSupabase();
    const { error } = await withTimeout<{ error: { message: string } | null }>(
      supabase.from("clients").select("id").limit(1) as unknown as PromiseLike<{
        error: { message: string } | null;
      }>,
      2_000
    );
    const latency = Date.now() - start;
    if (error) return { status: "fail", latency_ms: latency, error: error.message };
    if (latency > 500) return { status: "fail", latency_ms: latency, error: "slow" };
    return { status: "ok", latency_ms: latency };
  } catch (err) {
    return {
      status: "fail",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkStripe(): Promise<Check> {
  const start = Date.now();
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { status: "unconfigured" };
    }
    await withTimeout(stripe.balance.retrieve(), 3_000);
    return { status: "ok", latency_ms: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkUpstash(): Promise<Check> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { status: "unconfigured" };
  }
  const start = Date.now();
  try {
    const ok = await withTimeout(pingUpstash(), 2_000);
    if (!ok) return { status: "fail", latency_ms: Date.now() - start };
    return { status: "ok", latency_ms: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function checkResend(): Check {
  if (process.env.RESEND_API_KEY) return { status: "ok" };
  return { status: "unconfigured" };
}

async function checkVoiceServer(): Promise<Check> {
  const url = process.env.VOICE_SERVER_URL;
  if (!url) return { status: "unconfigured" };
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    return {
      status: res.ok ? "ok" : "fail",
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "fail",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  const envPresent: Record<string, boolean> = {
    CLAUDE_API_KEY: !!process.env.CLAUDE_API_KEY,
    NEBIUS_API_KEY: !!process.env.NEBIUS_API_KEY,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    DASHBOARD_PASSWORD: !!process.env.DASHBOARD_PASSWORD,
    CRON_SECRET: !!process.env.CRON_SECRET,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    LLM_STRATEGY: !!process.env.LLM_STRATEGY,
  };

  const [supabaseRes, stripeRes, upstashRes, voiceRes] = await Promise.allSettled([
    checkSupabase(),
    checkStripe(),
    checkUpstash(),
    checkVoiceServer(),
  ]);

  const checks = {
    supabase:
      supabaseRes.status === "fulfilled"
        ? supabaseRes.value
        : { status: "fail" as const, error: "check-crash" },
    stripe:
      stripeRes.status === "fulfilled"
        ? stripeRes.value
        : { status: "fail" as const, error: "check-crash" },
    upstash:
      upstashRes.status === "fulfilled"
        ? upstashRes.value
        : { status: "fail" as const, error: "check-crash" },
    resend: checkResend(),
    voice_server:
      voiceRes.status === "fulfilled"
        ? voiceRes.value
        : { status: "fail" as const, error: "check-crash" },
  };

  const criticalDown =
    checks.supabase.status === "fail" || checks.stripe.status === "fail";
  const anyDegraded =
    checks.upstash.status === "fail" ||
    checks.resend.status === "unconfigured" ||
    checks.upstash.status === "unconfigured" ||
    checks.voice_server.status === "fail";

  const status: HealthResponse["status"] = criticalDown
    ? "down"
    : anyDegraded
      ? "degraded"
      : "ok";

  const payload: HealthResponse = {
    status,
    version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || null,
    timestamp: new Date().toISOString(),
    checks,
    env: envPresent,
  };

  return NextResponse.json(payload, {
    status: criticalDown ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

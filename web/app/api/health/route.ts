import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { pingUpstash } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  };
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
    // Stripe Node SDK no permite retrieve() sin id; usamos balance como liveness check
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
  // No hacemos ping real para no gastar quota — solo comprobamos env.
  if (process.env.RESEND_API_KEY) return { status: "ok" };
  return { status: "unconfigured" };
}

export async function GET() {
  const [supabaseRes, stripeRes, upstashRes] = await Promise.allSettled([
    checkSupabase(),
    checkStripe(),
    checkUpstash(),
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
  };

  // Criticos: supabase + stripe. Si caen → 503.
  const criticalDown =
    checks.supabase.status === "fail" || checks.stripe.status === "fail";
  const anyDegraded =
    checks.upstash.status === "fail" ||
    checks.resend.status === "unconfigured" ||
    checks.upstash.status === "unconfigured";

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
  };

  return NextResponse.json(payload, {
    status: criticalDown ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

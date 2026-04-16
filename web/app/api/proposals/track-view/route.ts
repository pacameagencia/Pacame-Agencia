import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/proposals/track-view
 *
 * Public, rate-limited endpoint to mark a proposal as viewed.
 * Used by /propuesta/[id] page so we don't expose UPDATE rights
 * to the anon Supabase key on the browser.
 *
 * Only flips status "sent" -> "viewed" and stamps viewed_at. Any
 * other transition is a no-op.
 */

const bodySchema = z.object({
  id: z.string().uuid("id debe ser UUID"),
});

// In-memory rate limit — 20 views per 10 min per IP.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Only update if still in "sent" state — idempotent
  const { error } = await supabase
    .from("proposals")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("status", "sent");

  if (error) {
    console.warn("[proposals/track-view] update failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

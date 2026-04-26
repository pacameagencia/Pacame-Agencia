import { NextRequest, NextResponse } from "next/server";
import { generateAtlasImage, type AtlasModel, type AtlasRatio } from "@/lib/atlas-image";

export const runtime = "nodejs";
export const maxDuration = 300;

const ADMIN_SECRET = process.env.PACAME_ADMIN_SECRET?.trim();

// Naïve in-memory rate limit per IP (5 req/min). For prod, swap with Upstash.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ_PER_WINDOW = 5;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(ip: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= MAX_REQ_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

interface GenerateBody {
  prompt: string;
  ratio?: AtlasRatio;
  model?: AtlasModel;
  slug?: string;
  quality?: "standard" | "high";
  save?: boolean;
}

export async function POST(req: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { ok: false, error: "PACAME_ADMIN_SECRET not configured on server" },
      { status: 500 },
    );
  }

  const provided = req.headers.get("x-pacame-admin-secret");
  if (provided !== ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body?.prompt || typeof body.prompt !== "string" || body.prompt.length < 10) {
    return NextResponse.json(
      { ok: false, error: "prompt required (min 10 chars)" },
      { status: 400 },
    );
  }

  try {
    const result = await generateAtlasImage(body.prompt, {
      ratio: body.ratio,
      model: body.model,
      slug: body.slug,
      quality: body.quality,
      save: body.save !== false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/atlas/generate] error:", msg);
    return NextResponse.json({ ok: false, error: msg.slice(0, 500) }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/atlas/generate",
    method: "POST",
    auth: "header x-pacame-admin-secret",
    body: { prompt: "string", ratio: "1024x1536|...", model: "optional", slug: "optional" },
    rateLimit: `${MAX_REQ_PER_WINDOW}/min per IP`,
  });
}

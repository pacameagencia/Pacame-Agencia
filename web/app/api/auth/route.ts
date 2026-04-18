import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod/v4";
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  addLegacyToken,
  dropLegacyToken,
  hasLegacyToken,
  isDualReadEnabled,
  createSession,
  revokeSession,
  verifySession,
} from "@/lib/security/admin-sessions";
import { authLimiter, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  action: z.literal("login"),
  password: z.string().min(1, "Password requerido").max(200),
});
const verifySchema = z.object({ action: z.literal("verify") });
const logoutSchema = z.object({ action: z.literal("logout") });
const authSchema = z.discriminatedUnion("action", [
  loginSchema,
  verifySchema,
  logoutSchema,
]);

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function verifyPassword(input: string, stored: string): boolean {
  const inputHash = Buffer.from(hashPassword(input), "hex");
  const storedHash = Buffer.from(hashPassword(stored), "hex");
  return timingSafeEqual(inputHash, storedHash);
}

export async function POST(request: NextRequest) {
  // Parse body primero para decidir si aplicamos rate-limit (solo en login).
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = authSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos invalidos";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { action } = parsed.data;

  // ─── LOGIN ────────────────────────────────────────────────────
  if (action === "login") {
    // Rate limit: 5/min por IP — proteccion contra brute force.
    const ip = getClientIp(request);
    const rl = await authLimiter.limit(ip);
    if (!rl.success) {
      const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un momento.", retry_after: retrySec },
        {
          status: 429,
          headers: {
            "Retry-After": String(retrySec),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
          },
        }
      );
    }

    const { password } = parsed.data;

    if (!DASHBOARD_PASSWORD) {
      return NextResponse.json(
        { error: "DASHBOARD_PASSWORD no configurado en el servidor" },
        { status: 500 }
      );
    }

    if (!verifyPassword(password, DASHBOARD_PASSWORD)) {
      return NextResponse.json({ error: "Password incorrecto" }, { status: 401 });
    }

    const userAgent = request.headers.get("user-agent") || null;
    const created = await createSession({
      userId: "pablo",
      role: "admin",
      ip,
      userAgent,
      ttlSeconds: SESSION_TTL_SECONDS,
    });

    if (!created) {
      // DB fallo — degradamos a memoria para no bloquear a Pablo.
      const fallback = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addLegacyToken(fallback);
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE, fallback, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      });
      return NextResponse.json({ ok: true, degraded: true });
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, created.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  }

  // ─── VERIFY ────────────────────────────────────────────────────
  if (action === "verify") {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // 1. DB lookup
    const session = await verifySession(token);
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user_id: session.user_id,
        role: session.role,
      });
    }

    // 2. Dual-read: fallback a memoria para sesiones pre-deploy.
    if (isDualReadEnabled() && hasLegacyToken(token)) {
      return NextResponse.json({ authenticated: true, legacy: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // ─── LOGOUT ────────────────────────────────────────────────────
  if (action === "logout") {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;

    if (token) {
      await revokeSession(token);
      dropLegacyToken(token);
    }

    cookieStore.delete(ADMIN_COOKIE);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

// Password hash — set DASHBOARD_PASSWORD in .env.local
// Default: "pacame2026" (change this immediately in production)
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "pacame2026";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// In-memory token store (resets on deploy — acceptable for single-user dashboard)
const validTokens = new Set<string>();

export async function POST(request: NextRequest) {
  const { action, password } = await request.json();

  if (action === "login") {
    if (!password) {
      return NextResponse.json({ error: "Password requerido" }, { status: 400 });
    }

    if (password !== DASHBOARD_PASSWORD) {
      return NextResponse.json({ error: "Password incorrecto" }, { status: 401 });
    }

    const token = generateToken();
    validTokens.add(token);

    const cookieStore = await cookies();
    cookieStore.set("pacame_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    const cookieStore = await cookies();
    const token = cookieStore.get("pacame_auth")?.value;

    if (!token || !validTokens.has(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  }

  if (action === "logout") {
    const cookieStore = await cookies();
    const token = cookieStore.get("pacame_auth")?.value;

    if (token) {
      validTokens.delete(token);
    }

    cookieStore.delete("pacame_auth");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

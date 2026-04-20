import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod/v4";
import { signDashboardToken, verifyDashboardTokenNode } from "@/lib/dashboard-auth-node";

const loginSchema = z.object({
  action: z.literal("login"),
  password: z.string().min(1, "Password requerido").max(200),
});

const verifySchema = z.object({ action: z.literal("verify") });
const logoutSchema = z.object({ action: z.literal("logout") });

const authSchema = z.discriminatedUnion("action", [loginSchema, verifySchema, logoutSchema]);

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

function hashPassword(password: string): Buffer {
  return createHash("sha256").update(password).digest();
}

function passwordsMatch(input: string, stored: string): boolean {
  const a = hashPassword(input);
  const b = hashPassword(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const parsed = authSchema.safeParse(await request.json());

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos invalidos";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { action } = parsed.data;

  if (action === "login") {
    const { password } = parsed.data;

    if (!DASHBOARD_PASSWORD) {
      return NextResponse.json(
        { error: "DASHBOARD_PASSWORD no configurado en el servidor" },
        { status: 500 }
      );
    }

    if (!passwordsMatch(password, DASHBOARD_PASSWORD)) {
      return NextResponse.json({ error: "Password incorrecto" }, { status: 401 });
    }

    const token = signDashboardToken();

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

    if (!verifyDashboardTokenNode(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  }

  if (action === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete("pacame_auth");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

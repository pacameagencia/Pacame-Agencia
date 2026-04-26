/**
 * POST /api/products/auth/login
 *
 * Login para usuarios existentes de productos PACAME (Lucía, AsesorPro, PromptForge…).
 * Si el email no existe → 404 (el caller debe redirigir a signup/trial).
 * Si la password no coincide → 401.
 *
 * Body: { email, password }
 * Devuelve: { ok, user, redirect } + Set-Cookie sesión.
 *
 * NOTA: el patrón canónico para crear un user nuevo es
 * `POST /api/products/[product]/trial` que ya hace findOrCreateUser + startTrial
 * + sesión de una sola pasada. Este endpoint es solo para LOGIN de existentes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  buildSessionCookie,
  createSession,
  verifyPassword,
} from "@/lib/products/auth";

export const runtime = "nodejs";

interface LoginBody {
  email?: string;
  password?: string;
  /** Producto al que se quiere redirigir tras login. Default: pacame-gpt. */
  redirect_to?: string;
}

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !email.includes("@") || !password) {
    return NextResponse.json(
      { error: "email y password requeridos" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data: user } = await supabase
    .from("pacame_product_users")
    .select("id, email, full_name, role, password_hash")
    .eq("email", email)
    .maybeSingle();

  // Respuesta unificada para los tres "fracasos" (no existe / sin password /
  // password mal). Evita enumeración de cuentas: un atacante no puede saber
  // si un email está registrado.
  const INVALID = NextResponse.json(
    { error: "invalid_credentials" },
    { status: 401 }
  );

  if (!user || !user.password_hash) return INVALID;
  if (!verifyPassword(password, user.password_hash)) return INVALID;

  // Sesión nueva (rota token previo si lo había).
  const session = await createSession(user.id);
  const cookie = buildSessionCookie(session.token, session.expires);

  const redirect = body.redirect_to || "/pacame-gpt";
  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    redirect,
  });
  response.headers.set("Set-Cookie", cookie);
  return response;
}

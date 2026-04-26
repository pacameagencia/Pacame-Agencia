/**
 * POST /api/products/asesor-pro/accept-invite
 *
 * El cliente-final acepta el invite del asesor:
 *   1. Valida token vs asesorpro_clients.invite_token
 *   2. Crea (o reusa) pacame_product_users con role='client_of', parent_user_id=asesor
 *   3. Asocia client_user_id en asesorpro_clients + status='active' + invite_accepted_at
 *   4. Crea sesión + cookie
 *
 * Devuelve redirect a /app/asesor-pro/cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { findOrCreateUser, createSession, buildSessionCookie } from "@/lib/products/auth";
import { isValidEmail } from "@/lib/validators";
import { notifyInviteAccepted } from "@/lib/products/asesor-pro/notifications";

export const runtime = "nodejs";

interface AcceptBody {
  token: string;
  email: string;
  full_name?: string;
  password: string;
}

export async function POST(request: NextRequest) {
  let body: AcceptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { token, email, full_name, password } = body;
  if (!token || !email || !password) {
    return NextResponse.json({ error: "token, email y password requeridos" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "email_invalido" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password_corta", hint: "Mínimo 8 caracteres." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: client } = await supabase
    .from("asesorpro_clients")
    .select("id, asesor_user_id, fiscal_name, email, status, invite_accepted_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "invitación no encontrada o expirada" }, { status: 404 });
  }

  // Crear/encontrar user con role=client_of
  let user;
  try {
    const result = await findOrCreateUser({
      email,
      full_name,
      password,
      role: "client_of",
    });
    user = result.user;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // Asociar parent_user_id (asesor) si era user nuevo
  await supabase
    .from("pacame_product_users")
    .update({ parent_user_id: client.asesor_user_id })
    .eq("id", user.id)
    .is("parent_user_id", null);

  // Asociar client_user_id en el row del cliente + activar
  await supabase
    .from("asesorpro_clients")
    .update({
      client_user_id: user.id,
      status: "active",
      invite_accepted_at: new Date().toISOString(),
      invite_token: null, // single-use
    })
    .eq("id", client.id);

  // Telegram al asesor
  notifyInviteAccepted({
    asesor_user_id: client.asesor_user_id,
    client_name: client.fiscal_name,
  }).catch(() => {});

  // Alerta in-app
  await supabase.from("asesorpro_alerts").insert({
    asesor_user_id: client.asesor_user_id,
    asesor_client_id: client.id,
    type: "invite_accepted",
    severity: "info",
    title: `${client.fiscal_name} ha aceptado la invitación`,
    message: "Ya puede facturar y subir gastos desde su panel.",
    action_url: `/app/asesor-pro/clientes/${client.id}`,
  });

  // Crear sesión
  const session = await createSession(user.id);
  const cookie = buildSessionCookie(session.token, session.expires);

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, full_name: user.full_name },
    asesor_client_id: client.id,
    asesor_user_id: client.asesor_user_id,
    redirect: "/app/asesor-pro/cliente",
  });
  response.headers.set("Set-Cookie", cookie);
  return response;
}

export async function GET(request: NextRequest) {
  // Endpoint helper: dado un token, devuelve datos básicos del cliente
  // (fiscal_name, email pre-rellenado si lo había). Útil para la página
  // `/p/asesor-pro/aceptar?token=X` que muestra info antes del form.
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: client } = await supabase
    .from("asesorpro_clients")
    .select("fiscal_name, email, nif, asesor_user_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  // Mostrar nombre del asesor (sin email para privacidad)
  const { data: asesor } = await supabase
    .from("pacame_product_users")
    .select("full_name")
    .eq("id", client.asesor_user_id)
    .single();

  return NextResponse.json({
    valid: true,
    client: {
      fiscal_name: client.fiscal_name,
      nif: client.nif,
      email: client.email,
    },
    asesor_name: asesor?.full_name ?? "Tu asesor",
  });
}

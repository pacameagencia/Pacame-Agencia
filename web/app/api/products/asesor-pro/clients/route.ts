/**
 * GET  /api/products/asesor-pro/clients              listar clientes del asesor
 * POST /api/products/asesor-pro/clients              crear cliente nuevo
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { listAsesorClients } from "@/lib/products/asesor-pro/queries";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const clients = await listAsesorClients(user.id);
  return NextResponse.json({ clients });
}

interface CreateClientBody {
  fiscal_name: string;
  nif: string;
  trade_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  iva_regime?: string;
  invoice_prefix?: string;
  send_invite?: boolean;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: CreateClientBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.fiscal_name || !body.nif) {
    return NextResponse.json({ error: "fiscal_name y nif requeridos" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const inviteToken = body.send_invite && body.email
    ? crypto.randomBytes(24).toString("base64url")
    : null;

  const { data, error } = await supabase
    .from("asesorpro_clients")
    .insert({
      asesor_user_id: user.id,
      fiscal_name: body.fiscal_name.trim(),
      nif: body.nif.trim().toUpperCase(),
      trade_name: body.trade_name ?? null,
      email: body.email?.trim().toLowerCase() ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      postal_code: body.postal_code ?? null,
      city: body.city ?? null,
      iva_regime: body.iva_regime ?? "general",
      invoice_prefix: body.invoice_prefix ?? "",
      status: inviteToken ? "invited" : "active",
      invite_token: inviteToken,
      invite_sent_at: inviteToken ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: enviar email real con Resend si inviteToken
  // por ahora devolvemos el link para que el asesor lo copie manualmente
  const inviteUrl = inviteToken
    ? `${request.nextUrl.origin}/p/asesor-pro/aceptar?token=${inviteToken}`
    : null;

  return NextResponse.json({ client: data, invite_url: inviteUrl });
}

/**
 * GET  /api/products/asesor-pro/messages?asesor_client_id=X    listar thread
 * POST /api/products/asesor-pro/messages                        enviar mensaje
 *
 * Multi-tenant: el GET valida que el user sea el asesor dueño O el
 * cliente-final asociado. El POST hace la misma validación + insert.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function canAccessThread(
  userId: string,
  userRole: string,
  asesorClientId: string
): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_clients")
    .select("asesor_user_id, client_user_id")
    .eq("id", asesorClientId)
    .single();
  if (!data) return false;
  if (userRole === "owner" || userRole === "admin") return data.asesor_user_id === userId;
  if (userRole === "client_of") return data.client_user_id === userId;
  return false;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const asesorClientId = request.nextUrl.searchParams.get("asesor_client_id");
  if (!asesorClientId) return NextResponse.json({ error: "asesor_client_id required" }, { status: 400 });

  if (!(await canAccessThread(user.id, user.role, asesorClientId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_messages")
    .select("id, sender_user_id, body, attachments, read_at, created_at")
    .eq("asesor_client_id", asesorClientId)
    .order("created_at", { ascending: true })
    .limit(500);

  // Marcar como leídos los del otro lado
  await supabase
    .from("asesorpro_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("asesor_client_id", asesorClientId)
    .neq("sender_user_id", user.id)
    .is("read_at", null);

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { asesor_client_id: string; body: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.asesor_client_id || !body.body?.trim()) {
    return NextResponse.json({ error: "asesor_client_id y body requeridos" }, { status: 400 });
  }
  if (body.body.length > 4000) {
    return NextResponse.json({ error: "mensaje máx 4000 chars" }, { status: 400 });
  }

  if (!(await canAccessThread(user.id, user.role, body.asesor_client_id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("asesorpro_messages")
    .insert({
      asesor_client_id: body.asesor_client_id,
      sender_user_id: user.id,
      body: body.body.trim(),
    })
    .select("id, sender_user_id, body, attachments, read_at, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Crear alerta para el OTRO lado del chat (asesor recibe si cliente envió, o viceversa)
  const { data: clientRow } = await supabase
    .from("asesorpro_clients")
    .select("asesor_user_id, client_user_id, fiscal_name")
    .eq("id", body.asesor_client_id)
    .single();

  if (clientRow) {
    const targetUserId = user.role === "client_of" ? clientRow.asesor_user_id : clientRow.client_user_id;
    if (targetUserId) {
      // Si quien recibe es el ASESOR, va a asesorpro_alerts (mostrado en su panel)
      if (user.role === "client_of") {
        await supabase.from("asesorpro_alerts").insert({
          asesor_user_id: clientRow.asesor_user_id,
          asesor_client_id: body.asesor_client_id,
          type: "chat_message",
          severity: "info",
          title: `Mensaje de ${clientRow.fiscal_name}`,
          message: body.body.slice(0, 120),
          action_url: `/app/asesor-pro/clientes/${body.asesor_client_id}`,
        });
      }
    }
  }

  return NextResponse.json({ message: data });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

async function getAuthClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .single();
  return data;
}

/**
 * GET: List messages for the authenticated client (paginated, newest last)
 */
export async function GET(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const { data: messages, error, count } = await supabase
    .from("client_messages")
    .select("id, sender, message, read, created_at", { count: "exact" })
    .eq("client_id", client.id)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Error al cargar mensajes" }, { status: 500 });
  }

  return NextResponse.json({
    messages: messages ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

/**
 * POST: Send a message from the client
 * Body: { action: "send", message: string }
 */
export async function POST(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  try {
    const body = (await request.json()) as { action?: string; message?: string };

    if (body.action !== "send") {
      return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
    }

    const messageText = body.message?.trim();
    if (!messageText || messageText.length === 0) {
      return NextResponse.json({ error: "El mensaje no puede estar vacio" }, { status: 400 });
    }

    if (messageText.length > 2000) {
      return NextResponse.json({ error: "El mensaje es demasiado largo (max 2000 caracteres)" }, { status: 400 });
    }

    const { data: newMessage, error: insertError } = await supabase
      .from("client_messages")
      .insert({
        client_id: client.id,
        sender: "client",
        message: messageText,
        read: true, // Client's own messages are "read"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert message error:", insertError);
      return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
    }

    return NextResponse.json({ message: newMessage });
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * PATCH: Mark all messages as read for the client
 * Body: { action: "mark_read" }
 */
export async function PATCH(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  try {
    const body = (await request.json()) as { action?: string };

    if (body.action !== "mark_read") {
      return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("client_messages")
      .update({ read: true })
      .eq("client_id", client.id)
      .eq("read", false)
      .neq("sender", "client");

    if (updateError) {
      console.error("Mark read error:", updateError);
      return NextResponse.json({ error: "Error al marcar como leidos" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mark read error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

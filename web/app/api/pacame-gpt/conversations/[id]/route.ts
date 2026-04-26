/**
 * /api/pacame-gpt/conversations/[id]
 *
 * GET    → devuelve la conversación + sus mensajes en orden cronológico.
 * DELETE → borra (cascade borra mensajes).
 * PATCH  → renombra { title } o archiva { archived: true }.
 *
 * Cada operación verifica que el user actual es dueño de la conversación.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProductUser } from "@/lib/products/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownConversation(userId: string, convId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("pacame_gpt_conversations")
    .select("user_id")
    .eq("id", convId)
    .maybeSingle();
  return !!data && data.user_id === userId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownConversation(user.id, id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = createServerSupabase();
  const [{ data: conv }, { data: msgs }] = await Promise.all([
    supabase
      .from("pacame_gpt_conversations")
      .select("id, title, created_at, updated_at, archived")
      .eq("id", id)
      .single(),
    supabase
      .from("pacame_gpt_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    conversation: conv,
    messages: msgs || [],
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownConversation(user.id, id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.from("pacame_gpt_conversations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownConversation(user.id, id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    archived?: boolean;
  };
  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.slice(0, 120);
  if (typeof body.archived === "boolean") update.archived = body.archived;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pacame_gpt_conversations")
    .update(update)
    .eq("id", id)
    .select("id, title, archived")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });
  return NextResponse.json({ ok: true, conversation: data });
}

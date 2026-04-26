/**
 * /api/pacame-gpt/conversations
 *
 * GET  → lista conversaciones del user actual (ordenadas por updated_at desc).
 * POST → crea conversación nueva con título derivado del primer mensaje.
 *
 * Para operaciones por id (GET con mensajes, DELETE), ver
 * /api/pacame-gpt/conversations/[id]/route.ts
 *
 * Auth: cookie pacame_product_session (lib/products/auth.ts).
 * Sin auth → 401 (el front cae automáticamente a localStorage).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProductUser } from "@/lib/products/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pacame_gpt_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, conversations: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { title?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const title = (body.title || "Conversación nueva").slice(0, 120).trim();

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pacame_gpt_conversations")
    .insert({ user_id: user.id, title })
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, conversation: data });
}

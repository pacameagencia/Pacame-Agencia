/**
 * POST /api/pacame-gpt/share
 *
 * Crea (o devuelve si ya existe) un token público para una conversación.
 * Body: { conversationId }
 * Devuelve: { token, url, view_count }
 *
 * El token es 12 chars base32 (suficientemente único para 2B URLs sin colisión
 * práctica, corto para WhatsApp). Idempotente: 1 conv → 1 token estable.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProductUser } from "@/lib/products/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://pacameagencia.com";

export async function POST(req: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.conversationId) {
    return NextResponse.json({ error: "conversationId requerido" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Verificar que la conv pertenece al user.
  const { data: conv } = await supabase
    .from("pacame_gpt_conversations")
    .select("id, title, user_id")
    .eq("id", body.conversationId)
    .maybeSingle();
  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: "conversation_not_found" }, { status: 404 });
  }

  // ¿Ya hay token? Devuélvelo (idempotente).
  const { data: existing } = await supabase
    .from("pacame_gpt_shared_conversations")
    .select("token, view_count")
    .eq("conversation_id", conv.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: true,
      token: existing.token,
      url: `${BASE_URL}/lucia/c/${existing.token}`,
      view_count: existing.view_count,
      reused: true,
    });
  }

  // Token nuevo: 12 chars base32 (sin caracteres confundibles).
  const token = makeToken(12);
  const { error } = await supabase.from("pacame_gpt_shared_conversations").insert({
    token,
    user_id: user.id,
    conversation_id: conv.id,
    title: conv.title,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    token,
    url: `${BASE_URL}/lucia/c/${token}`,
    view_count: 0,
    reused: false,
  });
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0, 1, I, O
function makeToken(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

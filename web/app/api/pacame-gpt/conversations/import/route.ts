/**
 * POST /api/pacame-gpt/conversations/import
 *
 * Migra las conversaciones que un user tenía como anónimo (localStorage) a
 * Supabase tras hacer login. Se llama una vez tras signup/login fresco.
 *
 * Body:
 *   {
 *     conversations: [
 *       { title, messages: [ { role, content, ts? } ] }
 *     ]
 *   }
 *
 * Política:
 *   - Máximo 50 conversaciones por petición.
 *   - Máximo 100 mensajes por conversación.
 *   - Cada mensaje truncado a 4000 chars.
 *   - Idempotencia ligera: si ya existe una conv del user con title idéntico
 *     creada en los últimos 5 min, se ignora (anti-doble-click).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProductUser } from "@/lib/products/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ImportConv {
  title?: string;
  messages?: { role?: string; content?: string; ts?: number }[];
}

export async function POST(req: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { conversations?: ImportConv[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const incoming = (body.conversations || []).slice(0, 50);
  if (incoming.length === 0) {
    return NextResponse.json({ ok: true, imported: 0 });
  }

  const supabase = createServerSupabase();
  const recentCutoff = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: recentConvs } = await supabase
    .from("pacame_gpt_conversations")
    .select("title")
    .eq("user_id", user.id)
    .gt("created_at", recentCutoff);
  const recentTitles = new Set((recentConvs || []).map((c: any) => c.title));

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of incoming) {
    const title = (c.title || "Conversación importada").toString().slice(0, 120);
    if (recentTitles.has(title)) {
      skipped++;
      continue;
    }
    const messages = (c.messages || []).slice(0, 100).filter(
      (m): m is { role: string; content: string; ts?: number } =>
        !!m && (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" && m.content.length > 0
    );
    if (messages.length === 0) continue;

    try {
      const { data: conv, error } = await supabase
        .from("pacame_gpt_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error || !conv) {
        errors++;
        continue;
      }
      const rows = messages.map((m) => ({
        conversation_id: conv.id,
        role: m.role,
        content: m.content.slice(0, 4000),
        // Si el cliente nos pasó ts, lo respetamos para mantener orden cronológico.
        created_at: m.ts ? new Date(m.ts).toISOString() : new Date().toISOString(),
      }));
      const { error: errMsgs } = await supabase
        .from("pacame_gpt_messages")
        .insert(rows);
      if (errMsgs) {
        errors++;
        continue;
      }
      imported++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ ok: true, imported, skipped, errors });
}

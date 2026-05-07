// API: vista global de un thread por topic_slug.
// Usado por skill /topic-review y futuro dashboard /threads.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 });

  const supabase = createServerSupabase();

  const threadRes = await supabase
    .from("conversation_threads")
    .select("*")
    .eq("topic_slug", slug)
    .maybeSingle();

  if (!threadRes.data) {
    return NextResponse.json({ error: "thread no encontrado", slug }, { status: 404 });
  }

  const sessionsRes = await supabase
    .from("conversation_sessions")
    .select(
      "id, session_id, summary, decisions, blockers, next_steps, participants, turns_count, processed_at, started_at, ended_at, metadata"
    )
    .eq("thread_id", threadRes.data.id)
    .order("processed_at", { ascending: true });

  return NextResponse.json({
    thread: threadRes.data,
    sessions: sessionsRes.data ?? [],
    sessions_count: sessionsRes.data?.length ?? 0,
  });
}

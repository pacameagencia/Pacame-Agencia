import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { notifyPablo } from "@/lib/resend";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/nps/[token]
 * Valida token, devuelve estado (si ya respondio o no).
 *
 * POST /api/public/nps/[token]
 * Guarda respuesta { score: 0-10, feedback?: string }.
 * Idempotente — si ya hay score, devuelve 409.
 * Trigger DB auto-categoriza promoter/passive/detractor.
 * Si detractor -> notifica a Pablo inmediatamente.
 */

const submitSchema = z.object({
  score: z.number().int().min(0).max(10),
  feedback: z.string().max(2000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || !/^nps_[a-f0-9]{24}$/.test(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("nps_surveys")
    .select("id, score, category, submitted_at, client_id")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    getLogger().error({ err: error, token }, "[nps] lookup fallo");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    already_responded: !!data.submitted_at,
    score: data.score ?? null,
    category: data.category ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || !/^nps_[a-f0-9]{24}$/.test(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { score, feedback } = parsed.data;
  const supabase = createServerSupabase();

  // Lookup first — necesitamos saber si ya respondio (idempotencia) + datos cliente
  const { data: existing, error: selErr } = await supabase
    .from("nps_surveys")
    .select("id, score, submitted_at, client_id, clients:client_id(name, email)")
    .eq("token", token)
    .maybeSingle();

  if (selErr || !existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (existing.score !== null && existing.score !== undefined) {
    return NextResponse.json(
      { error: "already_responded", score: existing.score },
      { status: 409 }
    );
  }

  // Update — trigger DB setea category automaticamente
  const { data: updated, error: upErr } = await supabase
    .from("nps_surveys")
    .update({
      score,
      feedback: feedback || null,
      submitted_at: new Date().toISOString(),
    })
    .eq("token", token)
    .select("id, score, category")
    .maybeSingle();

  if (upErr || !updated) {
    getLogger().error({ err: upErr, token }, "[nps] update fallo");
    return NextResponse.json({ error: upErr?.message || "update_fail" }, { status: 500 });
  }

  // Si detractor, alerta a Pablo inmediatamente
  if (updated.category === "detractor") {
    const clientInfo = (existing as unknown as {
      clients?: { name?: string; email?: string } | null;
    }).clients;
    const clientLabel = clientInfo
      ? `${clientInfo.name || clientInfo.email || existing.client_id}`
      : String(existing.client_id);
    try {
      await notifyPablo(
        `ALERTA NPS detractor — ${clientLabel}`,
        `<p>Cliente: <strong>${clientLabel}</strong></p>
         <p>Score: <strong>${score}/10</strong> (detractor)</p>
         <p>Feedback:</p>
         <blockquote style="border-left:3px solid #ef4444;padding:8px 16px;margin:8px 0;background:#1a1a1a">${
           (feedback || "(sin comentario)").replace(/</g, "&lt;")
         }</blockquote>
         <p>→ Llama o escribe en las proximas 24h para intentar recuperar. La tasa de churn de detractor sin contacto es 60%+.</p>`
      );
    } catch (err) {
      getLogger().warn({ err }, "[nps] notify detractor fallo");
    }
  }

  return NextResponse.json({
    ok: true,
    score: updated.score,
    category: updated.category,
  });
}

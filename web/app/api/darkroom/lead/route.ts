/**
 * POST /api/darkroom/lead — Captura email del lead magnet "Stack del Creator 2026".
 *
 * Body:
 *   {
 *     email: string,
 *     source_utm?: string,    // ig_bio | story_swipe | reel_dia_3 | reddit_emprender | etc
 *     affiliate_code?: string, // si llegó vía cookie ?ref=
 *     firstname?: string
 *   }
 *
 * Response 200: { ok: true, lead_id, status: "captured" | "already_exists" }
 *
 * Notas:
 *   - Idempotente: si el email ya existe, devuelve `already_exists` sin re-disparar emails.
 *   - El cron diario `darkroom-leads-cadence` (a crear) lee status='captured' + step y
 *     manda email_0/2/4/7/14 vía Resend.
 *   - NO requiere auth: endpoint público.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { renderEmail0 } from "@/lib/darkroom/email-templates";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 15;

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

interface LeadInput {
  email?: string;
  source_utm?: string;
  affiliate_code?: string;
  firstname?: string;
}

export async function POST(request: NextRequest) {
  let body: LeadInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  // Reading affiliate_code from body OR from cookie set by /api/affiliates/track
  const cookieRef = request.cookies.get("dr_ref")?.value;
  const affiliate_code = body.affiliate_code ?? cookieRef ?? null;

  const supabase = createServerSupabase();

  // Idempotency
  const { data: existing } = await supabase
    .from("darkroom_leads")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      lead_id: (existing as { id: string }).id,
      status: "already_exists",
      lead_status: (existing as { status: string }).status,
    });
  }

  const meta: Record<string, unknown> = {};
  if (body.firstname) meta.firstname = body.firstname.slice(0, 80);

  const { data: created, error } = await supabase
    .from("darkroom_leads")
    .insert({
      email,
      source_utm: body.source_utm?.slice(0, 80) ?? null,
      affiliate_code: affiliate_code,
      status: "captured",
      current_email_step: 0,
      meta,
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: `lead insert failed: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const leadId = (created as { id: string }).id;

  // Enviar email_0 inmediato (welcome + Notion + PDF). Si falla, no rollback:
  // el lead queda capturado y el cron podrá reintentar.
  const log = getLogger();
  try {
    const rendered = renderEmail0({
      firstname: body.firstname ?? null,
      source_utm: body.source_utm ?? null,
    });
    const messageId = await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: "support@darkroomcreative.cloud",
      tags: [
        { name: "type", value: "darkroom_lead_magnet" },
        { name: "step", value: "email_0" },
      ],
    });
    if (messageId) {
      await supabase
        .from("darkroom_leads")
        .update({
          current_email_step: 1,
          last_email_sent_at: new Date().toISOString(),
        })
        .eq("id", leadId);
    } else {
      log.warn({ leadId, email }, "[darkroom-lead] email_0 send returned null");
    }
  } catch (emailErr) {
    log.error({ leadId, email, err: emailErr }, "[darkroom-lead] email_0 exception");
  }

  return NextResponse.json({
    ok: true,
    lead_id: leadId,
    status: "captured",
  });
}

/** Health check */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "darkroom-lead", method: "POST" });
}

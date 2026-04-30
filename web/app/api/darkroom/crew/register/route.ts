/**
 * POST /api/darkroom/crew/register
 *
 * Onboarding self-service de afiliados Dark Room Crew.
 *
 * Body:
 *   {
 *     name: string,
 *     email: string,
 *     phone?: string,
 *     payout_method: 'paypal' | 'sepa' | 'manual',
 *     payout_email?: string,    // requerido si method=paypal
 *     sepa_iban?: string,       // requerido si method=sepa
 *     source_utm?: string
 *   }
 *
 * Response 200: { ok, code, dashboard_url, status: 'created' | 'already_exists' }
 *
 * Idempotente: si email ya existe, devuelve code existente con status='already_exists'
 * (no re-envía welcome email · no permite re-registrar con datos distintos).
 *
 * NO requiere auth. Endpoint público.
 *
 * Spec: strategy/darkroom/programa-afiliados.md v2.0
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { generateUniqueCode } from "@/lib/darkroom/code-generator";
import {
  renderWelcomeCrew,
  buildCrewDashboardUrl,
} from "@/lib/darkroom/email-templates";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 15;

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/i;

interface RegisterInput {
  name?: string;
  email?: string;
  phone?: string;
  payout_method?: string;
  payout_email?: string;
  sepa_iban?: string;
  source_utm?: string;
}

export async function POST(request: NextRequest) {
  let body: RegisterInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const payoutMethod = (body.payout_method ?? "").trim().toLowerCase();

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "name 2-80 chars required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (!["paypal", "sepa", "manual"].includes(payoutMethod)) {
    return NextResponse.json({ error: "payout_method must be paypal|sepa|manual" }, { status: 400 });
  }

  const payoutEmail = body.payout_email?.trim().toLowerCase() ?? null;
  const sepaIban = body.sepa_iban?.replace(/\s+/g, "").toUpperCase() ?? null;

  if (payoutMethod === "paypal" && (!payoutEmail || !EMAIL_RE.test(payoutEmail))) {
    return NextResponse.json({ error: "payout_email required for paypal" }, { status: 400 });
  }
  if (payoutMethod === "sepa" && (!sepaIban || !IBAN_RE.test(sepaIban))) {
    return NextResponse.json({ error: "valid sepa_iban required for sepa" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const log = getLogger();

  // Idempotency: si email ya registrado, devolver code existente.
  const { data: existing } = await supabase
    .from("darkroom_affiliates")
    .select("code, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const code = (existing as { code: string }).code;
    return NextResponse.json({
      ok: true,
      code,
      dashboard_url: buildCrewDashboardUrl(code),
      status: "already_exists",
    });
  }

  // Generate unique code (kebab(name) + 4 hex)
  let code: string;
  try {
    code = await generateUniqueCode(name, supabase);
  } catch (err) {
    log.error({ err, name }, "[crew-register] code generation failed");
    return NextResponse.json({ error: "code generation failed" }, { status: 500 });
  }

  const insertPayload = {
    code,
    name,
    email,
    phone: body.phone?.slice(0, 40) ?? null,
    payout_method: payoutMethod,
    payout_email: payoutEmail,
    sepa_iban: sepaIban,
    status: "pending_verification",
    tier_current: "init",
    refs_active_count: 0,
    source_utm: body.source_utm?.slice(0, 80) ?? null,
  };

  const { data: created, error } = await supabase
    .from("darkroom_affiliates")
    .insert(insertPayload)
    .select("code")
    .single();

  if (error || !created) {
    // Race: si UNIQUE(email) chocó entre el SELECT y el INSERT, recuperar code
    if (error?.code === "23505") {
      const { data: race } = await supabase
        .from("darkroom_affiliates")
        .select("code")
        .eq("email", email)
        .maybeSingle();
      if (race) {
        const raceCode = (race as { code: string }).code;
        return NextResponse.json({
          ok: true,
          code: raceCode,
          dashboard_url: buildCrewDashboardUrl(raceCode),
          status: "already_exists",
        });
      }
    }
    log.error({ err: error?.message, email }, "[crew-register] insert failed");
    return NextResponse.json(
      { error: `register failed: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const finalCode = (created as { code: string }).code;
  const dashboardUrl = buildCrewDashboardUrl(finalCode);

  // Send welcome email · si falla, lead capturado igualmente (no rollback)
  try {
    const rendered = renderWelcomeCrew({
      name,
      code: finalCode,
      dashboardUrl,
    });
    await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: "support@darkroomcreative.cloud",
      tags: [
        { name: "type", value: "darkroom_crew" },
        { name: "step", value: "welcome" },
      ],
    });
  } catch (emailErr) {
    log.error({ email, err: emailErr }, "[crew-register] welcome email exception");
  }

  return NextResponse.json({
    ok: true,
    code: finalCode,
    dashboard_url: dashboardUrl,
    status: "created",
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "darkroom-crew-register", method: "POST" });
}

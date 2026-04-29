/**
 * GET /api/darkroom/leads-cadence
 *
 * Cron diario que avanza la cadencia de 5 emails del lead magnet
 * "Stack del Creator 2026". Disparado por master-cron a las 09:00 UTC
 * (11:00 ES) — los emails llegan en horario humano hispano.
 *
 * Lógica:
 *   - Lee `darkroom_leads` con `status='captured'` y `current_email_step IN (1,2,3,4)`.
 *     (step=0 ya se envía inmediato desde POST /api/darkroom/lead, así que aquí
 *     solo procesamos los siguientes en la cadencia.)
 *   - Para cada lead, calcula días transcurridos desde captured_at.
 *   - Si toca el siguiente email (offset según STEP_DAYS_OFFSET), envía y avanza.
 *   - Cuando step=4 (email_14) se envía y se avanza a step=5 → cadencia completada.
 *   - Idempotente: si last_email_sent_at >= límite del paso, no re-envía.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` (verifyInternalAuth).
 *
 * Query params:
 *   - dry-run=true · simula sin enviar emails ni hacer UPDATE
 *   - max=N · cap de leads procesados en una run (default 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import {
  renderEmailForStep,
  STEP_DAYS_OFFSET,
  LeadEmailStep,
} from "@/lib/darkroom/email-templates";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

interface LeadRow {
  id: string;
  email: string;
  source_utm: string | null;
  current_email_step: number;
  captured_at: string;
  last_email_sent_at: string | null;
  status: string;
  meta: { firstname?: string } | null;
}

const STEP_LABELS: Record<LeadEmailStep, string> = {
  0: "email_0",
  1: "email_2",
  2: "email_4",
  3: "email_7",
  4: "email_14",
};

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry-run") === "true";
  const maxRows = Math.min(500, parseInt(url.searchParams.get("max") ?? "200", 10));

  const log = getLogger();
  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // Solo leads en mid-cadence: step 1..4 con status captured. Step 0 lo manda
  // /api/darkroom/lead inmediatamente; step >=5 ya completó cadencia.
  const { data: leads, error } = await supabase
    .from("darkroom_leads")
    .select("id, email, source_utm, current_email_step, captured_at, last_email_sent_at, status, meta")
    .eq("status", "captured")
    .gte("current_email_step", 1)
    .lte("current_email_step", 4)
    .order("captured_at", { ascending: true })
    .limit(maxRows);

  if (error) {
    log.error({ err: error.message }, "[darkroom-cadence] query failed");
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (leads ?? []) as LeadRow[];
  const now = new Date();

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const detail: Array<{ id: string; email: string; action: string; reason?: string }> = [];

  for (const lead of rows) {
    const step = lead.current_email_step as LeadEmailStep;
    const daysSinceCaptured =
      (now.getTime() - new Date(lead.captured_at).getTime()) / (1000 * 60 * 60 * 24);
    const requiredOffset = STEP_DAYS_OFFSET[step];

    // Si aún no toca el siguiente email, skip silencioso.
    if (daysSinceCaptured < requiredOffset) {
      skipped++;
      detail.push({
        id: lead.id,
        email: lead.email,
        action: "skip",
        reason: `step=${step} requiere ${requiredOffset}d, hay ${daysSinceCaptured.toFixed(1)}d`,
      });
      continue;
    }

    // Si ya se envió este step (last_email_sent_at >= captured + offset),
    // probablemente la cadencia se atrasó · evitar doble envío.
    const minSentAt = new Date(lead.captured_at);
    minSentAt.setUTCHours(minSentAt.getUTCHours() + requiredOffset * 24);
    if (
      lead.last_email_sent_at &&
      new Date(lead.last_email_sent_at).getTime() >= minSentAt.getTime()
    ) {
      skipped++;
      detail.push({
        id: lead.id,
        email: lead.email,
        action: "skip",
        reason: `last_email_sent_at >= ${STEP_LABELS[step]} threshold`,
      });
      continue;
    }

    if (dryRun) {
      sent++;
      detail.push({
        id: lead.id,
        email: lead.email,
        action: `dry-run: would send ${STEP_LABELS[step]}`,
      });
      continue;
    }

    // Real send
    try {
      const rendered = renderEmailForStep(step, {
        firstname: lead.meta?.firstname ?? null,
        source_utm: lead.source_utm,
      });
      const messageId = await sendEmail({
        to: lead.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: "support@darkroomcreative.cloud",
        tags: [
          { name: "type", value: "darkroom_lead_magnet" },
          { name: "step", value: STEP_LABELS[step] },
        ],
      });

      if (!messageId) {
        errors++;
        detail.push({ id: lead.id, email: lead.email, action: "error", reason: "sendEmail returned null" });
        continue;
      }

      const nextStep = step + 1;
      await supabase
        .from("darkroom_leads")
        .update({
          current_email_step: nextStep,
          last_email_sent_at: now.toISOString(),
        })
        .eq("id", lead.id);

      sent++;
      detail.push({
        id: lead.id,
        email: lead.email,
        action: `sent ${STEP_LABELS[step]} → step=${nextStep}`,
      });
    } catch (e) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      log.error({ leadId: lead.id, err: msg }, "[darkroom-cadence] send failed");
      detail.push({ id: lead.id, email: lead.email, action: "error", reason: msg.slice(0, 200) });
    }
  }

  const ms = Date.now() - startedAt;
  log.info(
    { rows: rows.length, sent, skipped, errors, ms, dryRun },
    "[darkroom-cadence] done"
  );

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    processed: rows.length,
    sent,
    skipped,
    errors,
    duration_ms: ms,
    detail,
  });
}

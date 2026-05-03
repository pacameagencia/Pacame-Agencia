/**
 * GET /api/darkroom/crew/payout-batch
 *
 * Cron mensual día 5 a las 09:00 UTC (11:00 ES).
 * Para cada afiliado con pending_balance_cents >= 5000:
 *   1. Crear/actualizar row darkroom_payouts del período (current month)
 *      con status='pending'.
 *   2. Notificar al humano con resumen de payouts pendientes.
 *   3. Notificar al afiliado (`payout_ready` template) si su payout está listo
 *      para cobro manual (PayPal/SEPA).
 *
 * El humano paga manual mes 1. Marca cada payout como 'paid' via
 * /api/darkroom/crew/admin/mark-paid (auth verifyInternalAuth).
 *
 * Auth: verifyInternalAuth (Bearer CRON_SECRET).
 *
 * Query: ?dry-run=true · ?period=YYYY-MM (default actual)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, notifyPablo } from "@/lib/resend";
import {
  MIN_PAYOUT_CENTS,
} from "@/lib/darkroom/crew-tiers";
import {
  renderPayoutReady,
  buildCrewDashboardUrl,
} from "@/lib/darkroom/email-templates";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AffRow {
  code: string;
  name: string;
  email: string;
  payout_method: string;
  payout_email: string | null;
  pending_balance_cents: number;
}

function currentPeriodUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry-run") === "true";
  const period = (url.searchParams.get("period") ?? currentPeriodUtc()).trim();

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return NextResponse.json({ error: "period must be YYYY-MM" }, { status: 400 });
  }

  const log = getLogger();
  const supabase = createServerSupabase();
  const now = new Date().toISOString();

  const { data: affs, error } = await supabase
    .from("darkroom_affiliates")
    .select("code, name, email, payout_method, payout_email, pending_balance_cents")
    .eq("status", "active")
    .gte("pending_balance_cents", MIN_PAYOUT_CENTS);

  if (error) {
    log.error({ err: error.message }, "[crew-payout] query failed");
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (affs ?? []) as AffRow[];
  const detail: Array<{ code: string; amount_eur: number; method: string; action: string }> = [];

  let queued = 0;
  let totalCents = 0;
  const pabloLines: string[] = [];

  for (const aff of rows) {
    if (dryRun) {
      queued++;
      totalCents += aff.pending_balance_cents;
      detail.push({
        code: aff.code,
        amount_eur: aff.pending_balance_cents / 100,
        method: aff.payout_method,
        action: "dry-run: would queue payout",
      });
      continue;
    }

    // UPSERT payout · si ya existe del recurring-monthly, actualizamos total_cents
    // al pending_balance final (incluye one-times acumulados durante el mes)
    const { error: upErr } = await supabase
      .from("darkroom_payouts")
      .upsert(
        {
          affiliate_code: aff.code,
          period,
          total_cents: aff.pending_balance_cents,
          status: "pending",
          notes: `auto-queued day 5 · method=${aff.payout_method}`,
        },
        { onConflict: "affiliate_code,period" }
      );

    if (upErr) {
      detail.push({
        code: aff.code,
        amount_eur: aff.pending_balance_cents / 100,
        method: aff.payout_method,
        action: `error: ${upErr.message.slice(0, 100)}`,
      });
      continue;
    }

    queued++;
    totalCents += aff.pending_balance_cents;
    pabloLines.push(
      `· <strong>${aff.code}</strong> (${aff.name}) — ${(aff.pending_balance_cents / 100).toFixed(2)}€ vía ${aff.payout_method} → ${aff.payout_email ?? aff.email}`
    );

    // Email al afiliado (best-effort)
    try {
      const rendered = renderPayoutReady({
        name: aff.name,
        period,
        amountEur: aff.pending_balance_cents / 100,
        payoutMethod: aff.payout_method,
        dashboardUrl: buildCrewDashboardUrl(aff.code),
      });
      await sendEmail({
        to: aff.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: "support@darkroomcreative.cloud",
        tags: [
          { name: "type", value: "darkroom_crew" },
          { name: "step", value: "payout_ready" },
        ],
      });
    } catch (emailErr) {
      log.error({ code: aff.code, err: emailErr }, "[crew-payout] notify affiliate failed");
    }

    detail.push({
      code: aff.code,
      amount_eur: aff.pending_balance_cents / 100,
      method: aff.payout_method,
      action: "queued",
    });
  }

  // Resumen al humano (1 email con todos los payouts del día)
  if (!dryRun && queued > 0) {
    try {
      await notifyPablo(
        `Dark Room Crew · ${queued} payouts pendientes · ${(totalCents / 100).toFixed(2)}€`,
        `<p>Día 5 · payouts Dark Room Crew listos para pago manual.</p>
         <ul>${pabloLines.join("")}</ul>
         <p>Total: <strong>${(totalCents / 100).toFixed(2)}€</strong></p>
         <p>Tras pagar: <code>POST /api/darkroom/crew/admin/mark-paid</code> con
         {payout_id, paid_method, paid_reference}.</p>`
      );
    } catch (e) {
      log.error({ err: e }, "[crew-payout] notifyPablo failed");
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    period,
    queued,
    total_cents: totalCents,
    total_eur: totalCents / 100,
    detail,
  });
}

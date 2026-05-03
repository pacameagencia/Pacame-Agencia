/**
 * POST /api/darkroom/crew/admin/mark-paid
 *
 * Endpoint admin que el humano invoca tras pagar manualmente un payout
 * (PayPal/SEPA/transferencia).
 *
 * Body:
 *   {
 *     payout_id: uuid,
 *     paid_method: 'paypal' | 'sepa' | 'manual' | 'wise' | string,
 *     paid_reference: string  // tx ID, IBAN ref, etc
 *   }
 *
 * Marca payout `paid`, descuenta `pending_balance_cents` del afiliado,
 * suma a `total_one_time_paid_cents` o `total_recurring_paid_cents` según
 * composición del payout.
 *
 * Auth: verifyInternalAuth (Bearer CRON_SECRET o token interno).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 15;

interface MarkPaidInput {
  payout_id?: string;
  paid_method?: string;
  paid_reference?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  let body: MarkPaidInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const payoutId = (body.payout_id ?? "").trim();
  const paidMethod = (body.paid_method ?? "").trim();
  const paidReference = (body.paid_reference ?? "").trim();

  if (!UUID_RE.test(payoutId)) {
    return NextResponse.json({ error: "valid payout_id (uuid) required" }, { status: 400 });
  }
  if (!paidMethod) {
    return NextResponse.json({ error: "paid_method required" }, { status: 400 });
  }
  if (!paidReference) {
    return NextResponse.json({ error: "paid_reference required" }, { status: 400 });
  }

  const log = getLogger();
  const supabase = createServerSupabase();
  const now = new Date().toISOString();

  const { data: payoutRaw } = await supabase
    .from("darkroom_payouts")
    .select("id, affiliate_code, period, one_time_cents, recurring_cents, total_cents, status")
    .eq("id", payoutId)
    .maybeSingle();

  if (!payoutRaw) {
    return NextResponse.json({ error: "payout not found" }, { status: 404 });
  }
  const payout = payoutRaw as {
    id: string;
    affiliate_code: string;
    period: string;
    one_time_cents: number;
    recurring_cents: number;
    total_cents: number;
    status: string;
  };

  if (payout.status === "paid") {
    return NextResponse.json({
      ok: true,
      already_paid: true,
      payout_id: payout.id,
    });
  }

  // Marcar payout paid
  const { error: upErr } = await supabase
    .from("darkroom_payouts")
    .update({
      status: "paid",
      paid_at: now,
      paid_method: paidMethod,
      paid_reference: paidReference,
    })
    .eq("id", payout.id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // Descontar pending_balance · sumar a totales lifetime
  const { data: affRaw } = await supabase
    .from("darkroom_affiliates")
    .select("pending_balance_cents, total_one_time_paid_cents, total_recurring_paid_cents")
    .eq("code", payout.affiliate_code)
    .maybeSingle();

  if (affRaw) {
    const aff = affRaw as {
      pending_balance_cents: number;
      total_one_time_paid_cents: number;
      total_recurring_paid_cents: number;
    };

    // total_cents puede ser != one_time + recurring si hubo clawback parcial
    // entre recurring-monthly y mark-paid · usamos total_cents como fuente.
    const totalPaid = payout.total_cents;
    // Heurística: si recurring_cents > 0 lo atribuimos a recurring; si one_time>0
    // lo atribuimos a one_time. Si los dos son 0 pero total_cents > 0 (caso payout
    // ad-hoc), va todo a recurring por defecto.
    let oneTimeAdd = payout.one_time_cents;
    let recurringAdd = payout.recurring_cents;
    if (oneTimeAdd === 0 && recurringAdd === 0 && totalPaid > 0) {
      recurringAdd = totalPaid;
    }

    await supabase
      .from("darkroom_affiliates")
      .update({
        pending_balance_cents: aff.pending_balance_cents - totalPaid,
        total_one_time_paid_cents: aff.total_one_time_paid_cents + oneTimeAdd,
        total_recurring_paid_cents: aff.total_recurring_paid_cents + recurringAdd,
        updated_at: now,
      })
      .eq("code", payout.affiliate_code);
  }

  log.info(
    {
      payoutId: payout.id,
      code: payout.affiliate_code,
      period: payout.period,
      totalCents: payout.total_cents,
      paidMethod,
    },
    "[crew-mark-paid] payout marked paid"
  );

  return NextResponse.json({
    ok: true,
    payout_id: payout.id,
    affiliate_code: payout.affiliate_code,
    period: payout.period,
    total_eur: payout.total_cents / 100,
    paid_method: paidMethod,
  });
}

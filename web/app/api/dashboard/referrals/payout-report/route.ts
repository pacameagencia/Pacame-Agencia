import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";
import {
  aggregatePayouts,
  monthRange,
  MIN_PAYOUT_CENTS,
  type ReferralLike,
} from "@/lib/referrals/payout-aggregator";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/referrals/payout-report?month=2026-04
 *
 * Agrega las comisiones pendientes por referrer del mes pedido. Devuelve:
 *   [{ referrer_client_id, name, email, total_commission_cents, count, referrals: [...] }]
 *
 * Pablo lo usa cada mes para saber cuanto transferir a cada cliente.
 * Minimo 2000 cents (20€). Los que queden por debajo carryover al mes siguiente.
 *
 * POST /api/dashboard/referrals/payout-report
 * Body: { month: "2026-04", referrer_client_id: "uuid", payment_ref: "txfr-abc" }
 * Marca esas referrals status=paid + paid_at=now().
 * Registra audit_log.
 */

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const month =
    request.nextUrl.searchParams.get("month") ||
    new Date().toISOString().slice(0, 7);
  const range = monthRange(month);
  if (!range) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const log = getLogger();

  const { data: rows, error } = await supabase
    .from("referrals")
    .select(
      "id, referrer_client_id, amount_cents, commission_cents, referred_email, created_at, referral_code, order_id"
    )
    .eq("status", "pending")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("referrer_client_id");

  if (error) {
    log.error({ err: error }, "[payout-report] query fallo");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich con cliente
  const ids = Array.from(new Set((rows || []).map((r) => r.referrer_client_id)));
  const { data: clientsRaw } = ids.length
    ? await supabase.from("clients").select("id, name, email").in("id", ids)
    : { data: [] as Array<{ id: string; name: string | null; email: string | null }> };

  const payouts = aggregatePayouts<ReferralLike>(
    (rows || []) as ReferralLike[],
    (clientsRaw || []).map((c) => ({
      id: c.id as string,
      name: c.name as string | null,
      email: c.email as string | null,
    }))
  );

  const grand_total_commission_cents = payouts
    .filter((p) => p.eligible)
    .reduce((s, p) => s + p.total_commission_cents, 0);

  return NextResponse.json({
    ok: true,
    month,
    min_payout_cents: MIN_PAYOUT_CENTS,
    grand_total_commission_cents,
    eligible_count: payouts.filter((p) => p.eligible).length,
    total_count: payouts.length,
    payouts,
  });
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: {
    month?: string;
    referrer_client_id?: string;
    payment_ref?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { month, referrer_client_id, payment_ref } = body;
  if (!month || !referrer_client_id) {
    return NextResponse.json(
      { error: "validation", detail: "month + referrer_client_id required" },
      { status: 400 }
    );
  }
  const range = monthRange(month);
  if (!range) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const log = getLogger();

  // Lookup pending referrals de ese referrer en ese mes
  const { data: pending, error: selErr } = await supabase
    .from("referrals")
    .select("id, commission_cents, amount_cents")
    .eq("referrer_client_id", referrer_client_id)
    .eq("status", "pending")
    .gte("created_at", range.from)
    .lt("created_at", range.to);

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }
  if (!pending || pending.length === 0) {
    return NextResponse.json({ error: "no_pending" }, { status: 404 });
  }

  const total = pending.reduce((s, r) => s + (r.commission_cents || 0), 0);
  if (total < MIN_PAYOUT_CENTS) {
    return NextResponse.json(
      {
        error: "below_min",
        total_commission_cents: total,
        min: MIN_PAYOUT_CENTS,
      },
      { status: 422 }
    );
  }

  const ids = pending.map((r) => r.id);
  const { error: upErr, data: updated } = await supabase
    .from("referrals")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .in("id", ids)
    .select("id");

  if (upErr) {
    log.error({ err: upErr, referrer_client_id }, "[payout-report] update fallo");
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await auditLog({
    request,
    actor: { type: "admin" },
    action: "referral.payout",
    resource: { type: "client", id: referrer_client_id },
    metadata: {
      month,
      referral_ids: ids,
      total_commission_cents: total,
      payment_ref: payment_ref || null,
    },
  });

  return NextResponse.json({
    ok: true,
    marked_paid: updated?.length ?? ids.length,
    total_commission_cents: total,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * 1-CLICK PAYOUT vía Stripe Connect Express (estilo Hostinger).
 *
 *   POST /api/referrals/admin/payout
 *   Body: { affiliate_id, commission_ids?: string[] }
 *
 * - Si commission_ids: solo paga esas (deben ser approved del afiliado).
 * - Si no: paga TODAS las commissions approved del afiliado.
 *
 * Lanza 1 transfer Stripe → al IBAN del afiliado vía su Connected Account.
 * Marca commissions como paid con stripe_transfer_id.
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: { affiliate_id?: string; commission_ids?: string[] };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.affiliate_id) {
    return NextResponse.json({ error: "affiliate_id_required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  // 1. Cargar afiliado y verificar Stripe Connect activo
  const { data: aff } = await supabase
    .from("aff_affiliates")
    .select("id, email, full_name, stripe_connect_account_id, stripe_payouts_enabled, status")
    .eq("tenant_id", config.tenantId)
    .eq("id", body.affiliate_id)
    .maybeSingle<{
      id: string; email: string; full_name: string | null;
      stripe_connect_account_id: string | null;
      stripe_payouts_enabled: boolean;
      status: string;
    }>();

  if (!aff) return NextResponse.json({ error: "affiliate_not_found" }, { status: 404 });
  if (aff.status === "disabled") {
    return NextResponse.json({ error: "affiliate_disabled" }, { status: 400 });
  }
  if (!aff.stripe_connect_account_id || !aff.stripe_payouts_enabled) {
    return NextResponse.json(
      { error: "stripe_connect_not_ready", detail: "El afiliado todavía no ha completado su onboarding de Stripe Connect." },
      { status: 400 },
    );
  }

  // 2. Cargar commissions a pagar
  let q = supabase
    .from("aff_commissions")
    .select("id, amount_cents, currency, source_event")
    .eq("tenant_id", config.tenantId)
    .eq("affiliate_id", aff.id)
    .eq("status", "approved");
  if (body.commission_ids?.length) q = q.in("id", body.commission_ids);

  const { data: commissions, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!commissions || commissions.length === 0) {
    return NextResponse.json({ error: "nothing_to_pay" }, { status: 400 });
  }

  // 3. Sumar importes (asumiendo todos en EUR — log warning si no)
  const currency = (commissions[0].currency || "eur").toLowerCase();
  if (commissions.some((c) => (c.currency || "eur").toLowerCase() !== currency)) {
    return NextResponse.json({ error: "mixed_currencies" }, { status: 400 });
  }
  const totalCents = commissions.reduce((s, c) => s + c.amount_cents, 0);

  if (totalCents < 100) {
    return NextResponse.json({ error: "minimum_payout_1eur" }, { status: 400 });
  }

  // 4. Transfer Stripe (1-click)
  let transferId: string;
  try {
    const transfer = await stripe.transfers.create({
      amount: totalCents,
      currency,
      destination: aff.stripe_connect_account_id,
      transfer_group: `aff_payout_${aff.id}_${Date.now()}`,
      description: `PACAME afiliados — payout de ${commissions.length} comisión(es)`,
      metadata: {
        affiliate_id: aff.id,
        affiliate_email: aff.email,
        commission_count: String(commissions.length),
      },
    });
    transferId = transfer.id;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "stripe_transfer_failed";
    // Registrar el fallo en cada commission para auditoría
    await supabase
      .from("aff_commissions")
      .update({ stripe_transfer_failed_reason: reason })
      .in("id", commissions.map((c) => c.id));
    return NextResponse.json({ error: reason }, { status: 500 });
  }

  // 5. Marcar commissions como paid
  const paidAt = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("aff_commissions")
    .update({
      status: "paid",
      paid_at: paidAt,
      stripe_transfer_id: transferId,
      stripe_transfer_failed_reason: null,
    })
    .in("id", commissions.map((c) => c.id));
  if (updErr) {
    return NextResponse.json(
      { error: "transfer_ok_but_db_update_failed", transfer_id: transferId, detail: updErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    transfer_id: transferId,
    paid_count: commissions.length,
    total_cents: totalCents,
    currency,
    affiliate: { id: aff.id, email: aff.email, full_name: aff.full_name },
  });
}

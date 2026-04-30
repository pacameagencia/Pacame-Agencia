/**
 * GET /api/darkroom/crew/promote-pending
 *
 * Cron daily 09:10 UTC. Promueve referrals pending_30d → active si:
 *   1. started_at <= now - 30 días
 *   2. Stripe subscription sigue activa (no churned/refunded)
 *
 * Al promover:
 *   - Snapshot one_time_amount_cents = tier vigente del afiliado.
 *   - Suma al pending_balance_cents del afiliado.
 *   - Incrementa refs_active_count (recalculado desde COUNT real para evitar races).
 *   - Recompute tier · si cambia, escribe last_tier_change_at + envía email tier_up.
 *
 * Auth: verifyInternalAuth (Bearer CRON_SECRET).
 *
 * Query: ?dry-run=true  → simula sin escribir
 *        ?max=N         → cap rows procesados (default 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/resend";
import {
  computeTier,
  TIERS,
  type TierKey,
  PENDING_30D_DAYS,
} from "@/lib/darkroom/crew-tiers";
import {
  renderTierUp,
  buildCrewDashboardUrl,
} from "@/lib/darkroom/email-templates";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 120;

interface PendingRef {
  id: string;
  affiliate_code: string;
  stripe_subscription_id: string | null;
  started_at: string;
}

interface AffSnapshot {
  code: string;
  name: string;
  email: string;
  tier_current: TierKey;
  refs_active_count: number;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry-run") === "true";
  const maxRows = Math.min(500, parseInt(url.searchParams.get("max") ?? "200", 10));

  const log = getLogger();
  const supabase = createServerSupabase();
  const now = new Date();
  const cutoffIso = new Date(now.getTime() - PENDING_30D_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: pending, error } = await supabase
    .from("darkroom_referrals")
    .select("id, affiliate_code, stripe_subscription_id, started_at")
    .eq("status", "pending_30d")
    .lte("started_at", cutoffIso)
    .order("started_at", { ascending: true })
    .limit(maxRows);

  if (error) {
    log.error({ err: error.message }, "[crew-promote] query failed");
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const refs = (pending ?? []) as PendingRef[];
  const detail: Array<{ id: string; code: string; action: string; reason?: string }> = [];

  let promoted = 0;
  let skipped = 0;
  let tierUps = 0;

  for (const ref of refs) {
    // Verificar Stripe sub sigue activa (best-effort · si Stripe falla, dejamos pending para retry mañana)
    if (ref.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(ref.stripe_subscription_id);
        if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
          // Sub muerta · marcar referral churned y skip promote
          if (!dryRun) {
            await supabase
              .from("darkroom_referrals")
              .update({ status: "churned", updated_at: now.toISOString() })
              .eq("id", ref.id);
          }
          skipped++;
          detail.push({ id: ref.id, code: ref.affiliate_code, action: "skip", reason: `stripe sub ${sub.status}` });
          continue;
        }
      } catch (e) {
        skipped++;
        const msg = e instanceof Error ? e.message : "stripe lookup failed";
        detail.push({ id: ref.id, code: ref.affiliate_code, action: "skip", reason: msg.slice(0, 200) });
        continue;
      }
    }

    // Lookup afiliado
    const { data: affRaw } = await supabase
      .from("darkroom_affiliates")
      .select("code, name, email, tier_current, refs_active_count")
      .eq("code", ref.affiliate_code)
      .maybeSingle();

    if (!affRaw) {
      skipped++;
      detail.push({ id: ref.id, code: ref.affiliate_code, action: "skip", reason: "affiliate not found" });
      continue;
    }

    const aff = affRaw as AffSnapshot;
    const oldTier = aff.tier_current;

    if (dryRun) {
      // En dry-run no escribimos · simulamos qué tier saldría con +1 ref
      const wouldRefs = aff.refs_active_count + 1;
      const wouldTier = computeTier(wouldRefs).key;
      promoted++;
      detail.push({
        id: ref.id,
        code: ref.affiliate_code,
        action: `dry-run: promote → tier=${wouldTier} refs=${wouldRefs}`,
      });
      continue;
    }

    // Snapshot one_time_amount_cents al rate del tier vigente (antes del incremento)
    const tierVigente = computeTier(aff.refs_active_count + 1); // tier que aplicará tras promover
    // Spec: el rate one-time se snapshotea al tier que vigente en ese refrescal
    // (tier que el afiliado tendrá después de incluir ESTE ref). Es la decisión
    // simple y motivadora: cada ref se paga al rate del rango que estás en ese momento.
    const oneTimeCents = tierVigente.oneTimeCents;

    // Update referral · status=active + snapshot one_time
    const { error: updErr } = await supabase
      .from("darkroom_referrals")
      .update({
        status: "active",
        one_time_amount_cents: oneTimeCents,
        one_time_paid: true,
        one_time_paid_at: now.toISOString(),
        total_commission_cents: oneTimeCents,
        updated_at: now.toISOString(),
      })
      .eq("id", ref.id);

    if (updErr) {
      skipped++;
      detail.push({ id: ref.id, code: ref.affiliate_code, action: "error", reason: updErr.message.slice(0, 200) });
      continue;
    }

    // Recalcular refs_active_count desde COUNT real (race-safe)
    const { count: refsActiveCount } = await supabase
      .from("darkroom_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_code", ref.affiliate_code)
      .eq("status", "active");

    const refsActive = refsActiveCount ?? 0;
    const newTier = computeTier(refsActive);
    const tierChanged = newTier.key !== oldTier;

    // Update affiliate · pending_balance += oneTime, refs_active, tier, last_change si aplica
    const { data: affNowRaw } = await supabase
      .from("darkroom_affiliates")
      .select("pending_balance_cents")
      .eq("code", ref.affiliate_code)
      .maybeSingle();
    const currentPending = (affNowRaw as { pending_balance_cents: number } | null)?.pending_balance_cents ?? 0;

    await supabase
      .from("darkroom_affiliates")
      .update({
        refs_active_count: refsActive,
        tier_current: newTier.key,
        pending_balance_cents: currentPending + oneTimeCents,
        last_tier_change_at: tierChanged ? now.toISOString() : undefined,
        updated_at: now.toISOString(),
      })
      .eq("code", ref.affiliate_code);

    promoted++;
    detail.push({
      id: ref.id,
      code: ref.affiliate_code,
      action: `promoted → +${(oneTimeCents / 100).toFixed(0)}€ pending · tier=${newTier.key} refs=${refsActive}${tierChanged ? " (TIER UP)" : ""}`,
    });

    if (tierChanged) {
      tierUps++;
      try {
        const rendered = renderTierUp({
          name: aff.name,
          oldTier: oldTier,
          newTier: newTier.key,
          refsActive,
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
            { name: "step", value: "tier_up" },
          ],
        });
      } catch (emailErr) {
        log.error({ code: aff.code, err: emailErr }, "[crew-promote] tier_up email failed");
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    processed: refs.length,
    promoted,
    skipped,
    tier_ups: tierUps,
    detail,
  });
}

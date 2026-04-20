/**
 * Aggregation utilities for monthly commission payouts.
 * Pure functions — testables sin mockear Supabase.
 */

export const MIN_PAYOUT_CENTS = 2000;

export interface ReferralLike {
  id: string;
  referrer_client_id: string;
  amount_cents: number;
  commission_cents: number;
  referred_email?: string | null;
  created_at: string;
  referral_code: string;
  order_id?: string | null;
}

export interface ClientInfo {
  id: string;
  name: string | null;
  email: string | null;
}

export interface PayoutRow<R extends ReferralLike = ReferralLike> {
  referrer_client_id: string;
  name: string | null;
  email: string | null;
  total_commission_cents: number;
  total_revenue_cents: number;
  count: number;
  eligible: boolean;
  shortfall_cents: number;
  referrals: R[];
}

/**
 * Agrupa referrals por referrer, computa totals y eligibility vs MIN_PAYOUT_CENTS.
 * Ordena por comision DESC.
 */
export function aggregatePayouts<R extends ReferralLike>(
  referrals: R[],
  clients: ClientInfo[],
  minPayoutCents = MIN_PAYOUT_CENTS
): PayoutRow<R>[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const grouped = new Map<string, PayoutRow<R>>();

  for (const r of referrals) {
    const info = clientMap.get(r.referrer_client_id) || null;
    const existing = grouped.get(r.referrer_client_id);
    if (!existing) {
      grouped.set(r.referrer_client_id, {
        referrer_client_id: r.referrer_client_id,
        name: info?.name ?? null,
        email: info?.email ?? null,
        total_commission_cents: r.commission_cents,
        total_revenue_cents: r.amount_cents,
        count: 1,
        eligible: false,
        shortfall_cents: 0,
        referrals: [r],
      });
    } else {
      existing.total_commission_cents += r.commission_cents;
      existing.total_revenue_cents += r.amount_cents;
      existing.count += 1;
      existing.referrals.push(r);
    }
  }

  const rows = Array.from(grouped.values()).map((p) => ({
    ...p,
    eligible: p.total_commission_cents >= minPayoutCents,
    shortfall_cents:
      p.total_commission_cents < minPayoutCents
        ? minPayoutCents - p.total_commission_cents
        : 0,
  }));

  rows.sort((a, b) => b.total_commission_cents - a.total_commission_cents);
  return rows;
}

/**
 * Rango ISO UTC del mes "YYYY-MM".
 * Returns null si input invalido.
 */
export function monthRange(month: string): { from: string; to: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const from = new Date(Date.UTC(year, mo - 1, 1)).toISOString();
  const to = new Date(Date.UTC(mo === 12 ? year + 1 : year, mo % 12, 1)).toISOString();
  return { from, to };
}

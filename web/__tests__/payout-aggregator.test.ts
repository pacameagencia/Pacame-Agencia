import { describe, it, expect } from "vitest";
import {
  aggregatePayouts,
  monthRange,
  MIN_PAYOUT_CENTS,
  type ReferralLike,
} from "@/lib/referrals/payout-aggregator";

const ref = (overrides: Partial<ReferralLike>): ReferralLike => ({
  id: overrides.id || "r-" + Math.random().toString(36).slice(2, 8),
  referrer_client_id: overrides.referrer_client_id || "c-1",
  amount_cents: overrides.amount_cents ?? 10_000,
  commission_cents: overrides.commission_cents ?? 1_500,
  referred_email: overrides.referred_email ?? null,
  created_at: overrides.created_at ?? "2026-04-15T10:00:00.000Z",
  referral_code: overrides.referral_code ?? "PAC123",
  order_id: overrides.order_id ?? null,
});

describe("aggregatePayouts", () => {
  it("agrupa por referrer y suma commissions/revenues", () => {
    const rows = [
      ref({ id: "r1", referrer_client_id: "c-1", amount_cents: 10000, commission_cents: 1500 }),
      ref({ id: "r2", referrer_client_id: "c-1", amount_cents: 20000, commission_cents: 3000 }),
      ref({ id: "r3", referrer_client_id: "c-2", amount_cents: 5000, commission_cents: 750 }),
    ];
    const result = aggregatePayouts(rows, [
      { id: "c-1", name: "Ana", email: "ana@x.com" },
      { id: "c-2", name: "Luis", email: "luis@x.com" },
    ]);
    expect(result).toHaveLength(2);
    const c1 = result.find((r) => r.referrer_client_id === "c-1")!;
    expect(c1.count).toBe(2);
    expect(c1.total_commission_cents).toBe(4500);
    expect(c1.total_revenue_cents).toBe(30000);
    expect(c1.name).toBe("Ana");
  });

  it("marca eligible cuando commission_cents >= MIN_PAYOUT_CENTS", () => {
    const rows = [
      ref({ id: "r1", referrer_client_id: "c-1", commission_cents: MIN_PAYOUT_CENTS }),
      ref({ id: "r2", referrer_client_id: "c-2", commission_cents: MIN_PAYOUT_CENTS - 1 }),
    ];
    const result = aggregatePayouts(rows, []);
    const c1 = result.find((r) => r.referrer_client_id === "c-1")!;
    const c2 = result.find((r) => r.referrer_client_id === "c-2")!;
    expect(c1.eligible).toBe(true);
    expect(c1.shortfall_cents).toBe(0);
    expect(c2.eligible).toBe(false);
    expect(c2.shortfall_cents).toBe(1);
  });

  it("ordena por commission DESC", () => {
    const rows = [
      ref({ id: "r1", referrer_client_id: "c-small", commission_cents: 500 }),
      ref({ id: "r2", referrer_client_id: "c-big", commission_cents: 10000 }),
      ref({ id: "r3", referrer_client_id: "c-mid", commission_cents: 3000 }),
    ];
    const result = aggregatePayouts(rows, []);
    expect(result.map((r) => r.referrer_client_id)).toEqual(["c-big", "c-mid", "c-small"]);
  });

  it("null-safe cuando el cliente no esta en la lista", () => {
    const rows = [ref({ referrer_client_id: "c-unknown" })];
    const result = aggregatePayouts(rows, []);
    expect(result[0].name).toBeNull();
    expect(result[0].email).toBeNull();
  });

  it("permite override del minPayoutCents", () => {
    const rows = [ref({ commission_cents: 1000 })];
    const result = aggregatePayouts(rows, [], 500);
    expect(result[0].eligible).toBe(true);
  });
});

describe("monthRange", () => {
  it("valida formato YYYY-MM", () => {
    expect(monthRange("2026-04")).toEqual({
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-05-01T00:00:00.000Z",
    });
    expect(monthRange("2026-12")).toEqual({
      from: "2026-12-01T00:00:00.000Z",
      to: "2027-01-01T00:00:00.000Z",
    });
  });

  it("rechaza formatos invalidos", () => {
    expect(monthRange("2026-13")).toBeNull();
    expect(monthRange("26-04")).toBeNull();
    expect(monthRange("abril 2026")).toBeNull();
    expect(monthRange("")).toBeNull();
    expect(monthRange("2026-00")).toBeNull();
  });

  it("cubre transicion Dec -> Jan", () => {
    const r = monthRange("2026-12");
    expect(r).not.toBeNull();
    expect(r!.to).toBe("2027-01-01T00:00:00.000Z");
  });
});

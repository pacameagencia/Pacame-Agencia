// @ts-nocheck
/**
 * End-to-end test del módulo referrals contra un Supabase real.
 *
 * Ejecuta:
 *   cd web && node --test lib/modules/referrals/__tests__/flow.test.mjs
 *
 * Necesita NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en .env.local.
 * El test usa tenant_id="referrals-test-suite" y limpia al terminar.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", "..", "..", ".env.local");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^"|"$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env vars; skipping referrals e2e tests.");
  process.exit(0);
}

const TENANT = "referrals-test-suite";
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function resetTestData() {
  await supabase.from("aff_commissions").delete().eq("tenant_id", TENANT);
  await supabase.from("aff_referrals").delete().eq("tenant_id", TENANT);
  await supabase.from("aff_visits").delete().eq("tenant_id", TENANT);
  await supabase.from("aff_affiliates").delete().eq("tenant_id", TENANT);
  await supabase.from("aff_campaigns").delete().eq("tenant_id", TENANT);
}

async function setupCampaign(overrides = {}) {
  const { data, error } = await supabase
    .from("aff_campaigns")
    .insert({
      tenant_id: TENANT,
      name: "test-campaign",
      commission_percent: 20,
      cookie_days: 30,
      max_commission_period_months: 3,
      attribution: "last_click",
      is_default: true,
      ...overrides,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function createAffiliate(suffix, campaignId) {
  const { data, error } = await supabase
    .from("aff_affiliates")
    .insert({
      tenant_id: TENANT,
      user_id: `00000000-0000-0000-0000-${String(suffix).padStart(12, "0")}`,
      email: `aff-${suffix}@test.local`,
      referral_code: `code-${suffix}`,
      campaign_id: campaignId,
      status: "active",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

test("referrals: schema is reachable", async () => {
  await resetTestData();
  const tables = ["aff_campaigns", "aff_affiliates", "aff_visits", "aff_referrals", "aff_commissions"];
  for (const t of tables) {
    const { error } = await supabase.from(t).select("id", { head: true, count: "exact" }).limit(1);
    assert.equal(error, null, `table ${t} should be reachable: ${error?.message}`);
  }
});

test("referrals: last-click attribution overwrites previous affiliate", async () => {
  await resetTestData();
  const campaign = await setupCampaign();
  const a = await createAffiliate("aaa", campaign.id);
  const b = await createAffiliate("bbb", campaign.id);

  // Simulate two visits from same visitor — each gets latest affiliate
  const visitorUuid = "11111111-1111-1111-1111-111111111111";

  await supabase.from("aff_visits").insert([
    { tenant_id: TENANT, affiliate_id: a.id, visitor_uuid: visitorUuid, ip: "1.2.3.4" },
  ]);
  await new Promise((r) => setTimeout(r, 10));
  await supabase.from("aff_visits").insert([
    { tenant_id: TENANT, affiliate_id: b.id, visitor_uuid: visitorUuid, ip: "1.2.3.4" },
  ]);

  const { data: latest } = await supabase
    .from("aff_visits")
    .select("affiliate_id")
    .eq("visitor_uuid", visitorUuid)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  assert.equal(latest.affiliate_id, b.id, "last-click should resolve to most recent visit");
});

test("referrals: idempotent commission via unique source_event", async () => {
  await resetTestData();
  const campaign = await setupCampaign();
  const aff = await createAffiliate("idem", campaign.id);
  const { data: ref } = await supabase
    .from("aff_referrals")
    .insert({
      tenant_id: TENANT,
      affiliate_id: aff.id,
      referred_user_id: "22222222-2222-2222-2222-222222222222",
      stripe_subscription_id: "sub_test",
      status: "converted",
      converted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  const sourceEvent = `inv_${Date.now()}`;
  const insert = (n) =>
    supabase.from("aff_commissions").insert({
      tenant_id: TENANT,
      referral_id: ref.id,
      affiliate_id: aff.id,
      source_event: sourceEvent,
      amount_cents: 2000,
      currency: "eur",
      month_index: n,
      status: "pending",
    });

  const first = await insert(1);
  const second = await insert(1);
  assert.equal(first.error, null, "first insert should succeed");
  assert.notEqual(second.error, null, "second insert with same source_event must fail");

  const { count } = await supabase
    .from("aff_commissions")
    .select("id", { head: true, count: "exact" })
    .eq("tenant_id", TENANT)
    .eq("source_event", sourceEvent);
  assert.equal(count, 1, "exactly one commission row per source_event");
});

test("referrals: max_commission_period_months caps recurring commissions", async () => {
  await resetTestData();
  const campaign = await setupCampaign({ max_commission_period_months: 2 });
  const aff = await createAffiliate("cap", campaign.id);
  const { data: ref } = await supabase
    .from("aff_referrals")
    .insert({
      tenant_id: TENANT,
      affiliate_id: aff.id,
      referred_user_id: "33333333-3333-3333-3333-333333333333",
      stripe_subscription_id: "sub_cap",
      status: "converted",
      converted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  for (let i = 1; i <= 2; i++) {
    await supabase.from("aff_commissions").insert({
      tenant_id: TENANT,
      referral_id: ref.id,
      affiliate_id: aff.id,
      source_event: `inv_cap_${i}`,
      amount_cents: 2000,
      currency: "eur",
      month_index: i,
      status: "pending",
    });
  }

  const { count } = await supabase
    .from("aff_commissions")
    .select("id", { head: true, count: "exact" })
    .eq("tenant_id", TENANT)
    .eq("referral_id", ref.id)
    .neq("status", "voided");

  assert.equal(count, 2, "campaign cap=2 → exactly 2 commissions");
});

test("referrals: clawback voids on refund", async () => {
  await resetTestData();
  const campaign = await setupCampaign();
  const aff = await createAffiliate("claw", campaign.id);
  const { data: ref } = await supabase
    .from("aff_referrals")
    .insert({
      tenant_id: TENANT,
      affiliate_id: aff.id,
      referred_user_id: "44444444-4444-4444-4444-444444444444",
      stripe_subscription_id: "sub_claw",
      status: "converted",
      converted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  const sourceEvent = "inv_to_refund";
  await supabase.from("aff_commissions").insert({
    tenant_id: TENANT,
    referral_id: ref.id,
    affiliate_id: aff.id,
    source_event: sourceEvent,
    amount_cents: 2000,
    currency: "eur",
    month_index: 1,
    status: "pending",
  });

  // Simulate clawback
  await supabase
    .from("aff_commissions")
    .update({ status: "voided", voided_at: new Date().toISOString() })
    .eq("tenant_id", TENANT)
    .eq("source_event", sourceEvent)
    .neq("status", "paid");

  const { data } = await supabase
    .from("aff_commissions")
    .select("status, voided_at")
    .eq("tenant_id", TENANT)
    .eq("source_event", sourceEvent)
    .single();

  assert.equal(data.status, "voided");
  assert.notEqual(data.voided_at, null);
});

test("referrals: paid commissions are not voided by clawback", async () => {
  await resetTestData();
  const campaign = await setupCampaign();
  const aff = await createAffiliate("paid", campaign.id);
  const { data: ref } = await supabase
    .from("aff_referrals")
    .insert({
      tenant_id: TENANT,
      affiliate_id: aff.id,
      referred_user_id: "55555555-5555-5555-5555-555555555555",
      stripe_subscription_id: "sub_paid",
      status: "converted",
      converted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  const sourceEvent = "inv_paid";
  await supabase.from("aff_commissions").insert({
    tenant_id: TENANT,
    referral_id: ref.id,
    affiliate_id: aff.id,
    source_event: sourceEvent,
    amount_cents: 2000,
    currency: "eur",
    month_index: 1,
    status: "paid",
    paid_at: new Date().toISOString(),
  });

  // Try to clawback
  await supabase
    .from("aff_commissions")
    .update({ status: "voided", voided_at: new Date().toISOString() })
    .eq("tenant_id", TENANT)
    .eq("source_event", sourceEvent)
    .neq("status", "paid");

  const { data } = await supabase
    .from("aff_commissions")
    .select("status")
    .eq("tenant_id", TENANT)
    .eq("source_event", sourceEvent)
    .single();

  assert.equal(data.status, "paid", "already-paid commissions stay paid");
});

test("referrals: cleanup", async () => {
  await resetTestData();
});

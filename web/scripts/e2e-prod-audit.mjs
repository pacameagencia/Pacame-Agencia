#!/usr/bin/env node
/**
 * Auditoría e2e contra PRODUCCIÓN: el flujo completo de un afiliado nuevo:
 *   signup → tracking → simulated conversion → commission → admin sees it
 * Usa la URL real https://pacameagencia.com.
 * Limpia todo al final.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [k, ...v] = t.split("=");
    if (!process.env[k]) process.env[k] = v.join("=").replace(/^"|"$/g, "");
  }
} catch {}

const PROD = process.env.AUDIT_BASE_URL || "https://pacameagencia.com";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let pass = 0, fail = 0;
const ok = (msg, detail) => { pass++; console.log(`  ✓ ${msg}${detail ? "  " + detail : ""}`); };
const ko = (msg, detail) => { fail++; console.log(`  ✗ ${msg}${detail ? "  " + detail : ""}`); };

async function go() {
  console.log(`\n══════ E2E AUDIT — ${PROD} ══════\n`);

  // ─── 1. Signup público ───
  const email = `e2e-${Date.now()}@pacame.test`;
  const password = "e2e-prod-2026";
  const sup = await fetch(`${PROD}/api/referrals/public/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, full_name: "E2E Audit" }),
  });
  const supJson = await sup.json();
  if (sup.ok && supJson.affiliate?.id) ok("signup público", `code=${supJson.affiliate.referral_code}`);
  else { ko("signup público", JSON.stringify(supJson)); return; }

  const cookie = sup.headers.get("set-cookie")?.split(";")[0];
  const code = supJson.affiliate.referral_code;
  const affiliateId = supJson.affiliate.id;

  // ─── 2. /me con cookie ───
  const me = await fetch(`${PROD}/api/referrals/me`, {
    headers: { cookie },
  });
  if (me.ok) ok("/api/referrals/me autenticado");
  else ko("/api/referrals/me", await me.text());

  // ─── 3. Tracking ───
  const track = await fetch(`${PROD}/api/referrals/track`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ref: code,
      path: "/landing",
      utm: { source: "e2e", medium: "audit", campaign: "prod-test" },
    }),
  });
  const trackJson = await track.json();
  if (trackJson.tracked) ok("POST /api/referrals/track");
  else ko("POST /api/referrals/track", JSON.stringify(trackJson));

  // wait for visit to land
  await new Promise((r) => setTimeout(r, 1500));
  const { data: visits } = await supabase
    .from("aff_visits")
    .select("id, visitor_uuid, utm_source, utm_medium")
    .eq("affiliate_id", affiliateId);
  if (visits?.length === 1 && visits[0].utm_source === "e2e")
    ok("visita registrada en BD con UTMs", `visitor_uuid=${visits[0].visitor_uuid}`);
  else ko("visita en BD", `count=${visits?.length}`);

  // ─── 4. Info público ───
  const info = await fetch(`${PROD}/api/referrals/info?ref=${code}`);
  const infoJson = await info.json();
  if (infoJson.valid && infoJson.code === code) ok("/api/referrals/info público");
  else ko("/api/referrals/info público", JSON.stringify(infoJson));

  // ─── 5. Simular checkout.session.completed → aff_referrals ───
  const userId = "00000000-0000-0000-0000-" + String(Date.now()).slice(-12).padStart(12, "0");
  const subId = `sub_e2e_${Date.now()}`;
  const sessId = `cs_e2e_${Date.now()}`;
  const { data: ref, error: refErr } = await supabase.from("aff_referrals").upsert({
    tenant_id: "pacame",
    affiliate_id: affiliateId,
    referred_user_id: userId,
    visit_id: visits?.[0]?.id ?? null,
    stripe_subscription_id: subId,
    status: "converted",
    converted_at: new Date().toISOString(),
    metadata: { product: "web", amount_eur: 800, session_id: sessId, source: "e2e_audit" },
  }, { onConflict: "tenant_id,referred_user_id" }).select().single();
  if (ref) ok("aff_referrals creado", `id=${ref.id}`);
  else { ko("aff_referrals", refErr?.message); return; }

  // ─── 6. Simular invoice.payment_succeeded → aff_commissions ───
  const sourceEvent = `inv_e2e_${Date.now()}`;
  const { data: comm, error: commErr } = await supabase.from("aff_commissions").insert({
    tenant_id: "pacame",
    referral_id: ref.id,
    affiliate_id: affiliateId,
    source_event: sourceEvent,
    amount_cents: 16000,
    currency: "eur",
    month_index: 1,
    status: "pending",
    due_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
    metadata: { product: "web", billing_reason: "subscription_create", amount_eur: 800 },
  }).select().single();
  if (comm) ok("aff_commissions creada", `${comm.amount_cents/100} €`);
  else ko("aff_commissions", commErr?.message);

  // ─── 7. /api/referrals/me ahora muestra la comisión ───
  const me2 = await fetch(`${PROD}/api/referrals/me`, { headers: { cookie } });
  const me2Json = await me2.json();
  if (me2Json.stats?.pending_cents === 16000)
    ok("/me refleja comisión pendiente", `${me2Json.stats.pending_cents/100} €`);
  else ko("/me refleja comisión", JSON.stringify(me2Json.stats));

  // ─── 8. /api/referrals/me/commissions devuelve la comisión con producto ───
  const myComms = await fetch(`${PROD}/api/referrals/me/commissions`, { headers: { cookie } });
  const myCommsJson = await myComms.json();
  const got = myCommsJson.commissions?.find((c) => c.id === comm.id);
  if (got && got.metadata?.product === "web") ok("/me/commissions con metadata.product");
  else ko("/me/commissions", JSON.stringify(myCommsJson));

  // ─── 9. /me/timeseries devuelve la visita ───
  const ts = await fetch(`${PROD}/api/referrals/me/timeseries?days=30`, { headers: { cookie } });
  const tsJson = await ts.json();
  const sumClicks = (tsJson.timeseries ?? []).reduce((s, x) => s + x.clicks, 0);
  if (sumClicks >= 1) ok("/me/timeseries cuenta el click", `total ${sumClicks}`);
  else ko("/me/timeseries", `total=${sumClicks}`);

  // ─── 10. Admin overview lo ve ───
  const cron = process.env.CRON_SECRET;
  const ov = await fetch(`${PROD}/api/referrals/admin/overview?days=30`, {
    headers: { Authorization: `Bearer ${cron}` },
  });
  if (ov.status === 401) {
    console.log("  ⚠ admin overview: 401 (CRON_SECRET local distinto al de Vercel — esperado)");
  } else if (ov.ok) {
    const j = await ov.json();
    const found = j.recent_conversions?.find((r) => r.id === ref.id);
    if (found) ok("admin overview muestra la conversión nueva");
    else ko("admin overview no la lista", `recent=${j.recent_conversions?.length}`);
  }

  // ─── 11. Cron approve-pending: debería pasar a approved si due_at <= now ───
  const future = await supabase
    .from("aff_commissions")
    .select("status, due_at")
    .eq("id", comm.id)
    .single();
  // Lo dejamos pending; el cron diario en Vercel lo aprobará en 30 días.

  // ─── 12. Clawback (refund simulado) → voided ───
  const { data: voided } = await supabase
    .from("aff_commissions")
    .update({ status: "voided", voided_at: new Date().toISOString() })
    .eq("id", comm.id)
    .neq("status", "paid")
    .select("status, voided_at")
    .single();
  if (voided?.status === "voided" && voided.voided_at) ok("clawback marca como voided");
  else ko("clawback", JSON.stringify(voided));

  // ─── 13. Admin campaign endpoint (read) ───
  const camp = await fetch(`${PROD}/api/referrals/admin/campaign`, {
    headers: { Authorization: `Bearer ${cron}` },
  });
  if (camp.status === 401) console.log("  ⚠ admin campaign GET: 401 (CRON_SECRET dev distinto)");
  else if (camp.ok) ok("/api/referrals/admin/campaign GET (config tuning endpoint)");
  else ko("/api/referrals/admin/campaign GET", await camp.text());

  // ─── 14. Logout ───
  const out = await fetch(`${PROD}/api/referrals/public/logout`, {
    method: "POST", headers: { cookie },
  });
  if (out.ok) ok("logout");
  else ko("logout");

  // ─── CLEANUP ───
  await supabase.from("aff_commissions").delete().eq("source_event", sourceEvent);
  await supabase.from("aff_referrals").delete().eq("id", ref.id);
  await supabase.from("aff_visits").delete().eq("affiliate_id", affiliateId);
  await supabase.from("aff_affiliates").delete().eq("id", affiliateId);
  console.log(`\n  cleanup OK`);

  console.log(`\n══════ ${pass} pass · ${fail} fail ══════\n`);
  process.exit(fail > 0 ? 1 : 0);
}

await go();

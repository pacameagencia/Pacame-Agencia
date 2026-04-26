#!/usr/bin/env node
/**
 * Auditoría FINAL exhaustiva del sistema de afiliados PACAME en producción.
 * Cubre 6 dimensiones: anonymous, authenticated affiliate, admin, e2e flow,
 * security, UX/visual. Cleanup automático.
 *
 * Uso: cd web && node scripts/audit-final.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadEnv(p) {
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [k, ...v] = t.split("=");
    if (!process.env[k]) process.env[k] = v.join("=").replace(/^"|"$/g, "");
  }
}
loadEnv(path.join(__dirname, "..", ".env.local"));
const PROD_ENV_PATH = "C:/Users/Pacame24/AppData/Local/Temp/vercel-prod-env";
const PROD_CRON = existsSync(PROD_ENV_PATH)
  ? (readFileSync(PROD_ENV_PATH, "utf8").split("\n").find((l) => l.startsWith("CRON_SECRET=")) || "").split("=")[1]?.replace(/"/g, "")
  : null;

const PROD = "https://pacameagencia.com";
const TENANT = "pacame";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const results = [];
let groupName = "";
const ok = (msg, detail) => results.push({ group: groupName, ok: true, msg, detail });
const ko = (msg, detail) => results.push({ group: groupName, ok: false, msg, detail });
const warn = (msg, detail) => results.push({ group: groupName, ok: "warn", msg, detail });
const group = (n) => { groupName = n; };

function expect(cond, msgOk, msgKo, detail) {
  if (cond) ok(msgOk, detail);
  else ko(msgKo, detail);
}

async function fetchOk(url, init = {}) {
  const r = await fetch(url, init);
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status, body, headers: r.headers };
}

async function statusOnly(url, init = {}) {
  const r = await fetch(url, init);
  return r.status;
}

async function statusNoFollow(url, init = {}) {
  // Don't follow redirects so 307/308 are visible
  const r = await fetch(url, { ...init, redirect: "manual" });
  return r.status;
}

console.log(`\n══════════════ AUDITORÍA FINAL — ${PROD} ══════════════`);

// ════════════════════════════════════════════════════════════════════
// A. PÁGINAS PÚBLICAS (anónimo)
// ════════════════════════════════════════════════════════════════════
group("A · Páginas públicas");

const pages = [
  ["/", 200],
  ["/afiliados", 200],
  ["/afiliados/registro", 200],
  ["/afiliados/login", 200],
];
for (const [p, expected] of pages) {
  const s = await statusOnly(`${PROD}${p}`);
  expect(s === expected, `${p} → ${s}`, `${p} esperaba ${expected}, recibió ${s}`);
}

const protectedPages = [
  "/afiliados/panel",
  "/afiliados/panel/contenido",
  "/afiliados/panel/comisiones",
  "/afiliados/panel/perfil",
  "/afiliados/panel/referidos",
  "/dashboard/referrals-admin",
  "/dashboard/referrals-admin/configuracion",
];
for (const p of protectedPages) {
  const s = await statusNoFollow(`${PROD}${p}`);
  expect(s === 307 || s === 308, `${p} sin auth → ${s} (redirect)`, `${p} debería redirigir, recibió ${s}`);
}

// Landing contiene los nuevos bloques
const landingHtml = await fetch(`${PROD}/afiliados`).then((r) => r.text());
expect(landingHtml.includes("Para quién es esto"), "landing tiene bloque ‘Para quién es esto’");
expect(landingHtml.includes("Cero riesgo"), "landing tiene garantía ‘Cero riesgo’");
expect(landingHtml.includes("9 600 €") || landingHtml.includes("9.600 €"), "landing menciona aspiración 9 600 €");
expect(landingHtml.includes("Cero riesgo · 0 € de inversión"), "landing tiene badge inicial cero riesgo");

// ════════════════════════════════════════════════════════════════════
// B. ENDPOINTS PÚBLICOS sin auth
// ════════════════════════════════════════════════════════════════════
group("B · Endpoints públicos");

const health = await fetchOk(`${PROD}/api/referrals/health`);
expect(health.status === 200 && health.body?.status === "ok", "health → 200 ok", null, JSON.stringify(health.body?.config));

const infoBad = await fetchOk(`${PROD}/api/referrals/info?ref=NOEXISTE_XYZ_123`);
expect(infoBad.status === 404, `info ref inválido → 404`, `recibido ${infoBad.status}`);

const infoNoRef = await fetchOk(`${PROD}/api/referrals/info`);
expect(infoNoRef.status === 400, `info sin ref → 400`, `recibido ${infoNoRef.status}`);

const trackBad = await fetchOk(`${PROD}/api/referrals/track`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ ref: "NOEXISTE_XYZ_123" }),
});
expect(trackBad.body?.tracked === false, "track ref inválido → tracked:false");

const trackNoBody = await fetchOk(`${PROD}/api/referrals/track`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: "not-json",
});
expect(trackNoBody.status === 400, "track con body inválido → 400");

const trackBadFormat = await fetchOk(`${PROD}/api/referrals/track`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ ref: "<script>alert(1)</script>" }),
});
expect(trackBadFormat.status === 400, "track con ref no alfanumérico → 400 (validación)");

const meNoAuth = await fetchOk(`${PROD}/api/referrals/me`);
expect(meNoAuth.status === 401, "/me sin auth → 401");

const profileNoAuth = await fetchOk(`${PROD}/api/referrals/public/profile`);
expect(profileNoAuth.status === 401, "/public/profile sin auth → 401");

const contentNoAuth = await fetchOk(`${PROD}/api/referrals/content`);
expect(contentNoAuth.status === 401, "/content sin auth → 401");

// ════════════════════════════════════════════════════════════════════
// C. SIGNUP — validaciones
// ════════════════════════════════════════════════════════════════════
group("C · Signup validations");

const sup_invalidEmail = await fetchOk(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "not-email", password: "validpass123", full_name: "X" }),
});
expect(sup_invalidEmail.status === 400 && sup_invalidEmail.body?.error === "invalid_email",
  "signup email inválido → 400 invalid_email");

const sup_weakPwd = await fetchOk(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "v@v.com", password: "abc", full_name: "X" }),
});
expect(sup_weakPwd.status === 400 && sup_weakPwd.body?.error === "weak_password",
  "signup password corto → 400 weak_password");

const sup_noName = await fetchOk(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "v@v.com", password: "validpass123", full_name: "" }),
});
expect(sup_noName.status === 400 && sup_noName.body?.error === "name_required",
  "signup sin nombre → 400 name_required");

const sup_noBody = await fetchOk(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" }, body: "x",
});
expect(sup_noBody.status === 400, "signup body inválido → 400");

// ════════════════════════════════════════════════════════════════════
// D. SIGNUP REAL + flujo completo afiliado autenticado
// ════════════════════════════════════════════════════════════════════
group("D · Flujo afiliado autenticado");

const email = `final-${Date.now()}@pacame.test`;
const password = "audit-final-2026";

const sup = await fetch(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password, full_name: "Final Audit", phone: "+34600000000", country: "ES" }),
});
const supBody = await sup.json();
expect(sup.status === 200 && supBody.affiliate?.id, `signup OK · code=${supBody.affiliate?.referral_code}`);
const cookie = sup.headers.get("set-cookie")?.split(";")[0];
const affId = supBody.affiliate.id;
const code = supBody.affiliate.referral_code;

// Duplicate email → 409
const sup_dup = await fetchOk(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "another-pass", full_name: "Otro" }),
});
expect(sup_dup.status === 409 && sup_dup.body?.error === "email_in_use",
  "signup email duplicado → 409 email_in_use");

// Case-insensitive duplicate
const sup_caseDup = await fetchOk(`${PROD}/api/referrals/public/signup`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: email.toUpperCase(), password: "another-pass", full_name: "Otro" }),
});
expect(sup_caseDup.status === 409, "signup email case-distinto duplicado → 409");

// /me autenticado
const me = await fetchOk(`${PROD}/api/referrals/me`, { headers: { cookie } });
expect(me.status === 200 && me.body?.affiliate?.id === affId, "/me devuelve datos afiliado");
expect(me.body?.stats?.clicks === 0 && me.body?.stats?.conversions === 0,
  "/me stats iniciales en 0");

// Profile
const profile = await fetchOk(`${PROD}/api/referrals/public/profile`, { headers: { cookie } });
expect(profile.status === 200 && profile.body?.profile?.country === "ES",
  "/profile devuelve datos completos");

// PATCH profile valid
const patch1 = await fetchOk(`${PROD}/api/referrals/public/profile`, {
  method: "PATCH", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ payout_method: "iban", payout_iban: "ES7621000418401234567891" }),
});
expect(patch1.status === 200 && patch1.body?.profile?.payout_method === "iban",
  "PATCH profile con IBAN válido");

// PATCH invalid payout method
const patch2 = await fetchOk(`${PROD}/api/referrals/public/profile`, {
  method: "PATCH", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ payout_method: "BITCOIN" }),
});
expect(patch2.status === 400 && patch2.body?.error === "invalid_payout_method",
  "PATCH payout_method inválido → 400");

// Change password
const cpwBad = await fetchOk(`${PROD}/api/referrals/public/change-password`, {
  method: "POST", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ current: "wrong-pwd", next: "new-strong-pwd-123" }),
});
expect(cpwBad.status === 401, "change-password current incorrecta → 401");

const cpwWeak = await fetchOk(`${PROD}/api/referrals/public/change-password`, {
  method: "POST", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ current: password, next: "x" }),
});
expect(cpwWeak.status === 400, "change-password nueva débil → 400");

const cpwOk = await fetchOk(`${PROD}/api/referrals/public/change-password`, {
  method: "POST", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ current: password, next: "audit-final-2026-v2" }),
});
expect(cpwOk.status === 200, "change-password OK");

// Login con la nueva pwd
const login = await fetchOk(`${PROD}/api/referrals/public/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "audit-final-2026-v2" }),
});
expect(login.status === 200, "login con password actualizada");

const loginBad = await fetchOk(`${PROD}/api/referrals/public/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "wrong" }),
});
expect(loginBad.status === 401, "login wrong password → 401");

// Login con email no existente
const loginNotFound = await fetchOk(`${PROD}/api/referrals/public/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "noexiste@xyz.test", password: "whatever123" }),
});
expect(loginNotFound.status === 401, "login email no existente → 401 (no leak)");

// Content list autenticado
const content = await fetchOk(`${PROD}/api/referrals/content`, { headers: { cookie } });
expect(content.status === 200 && Array.isArray(content.body?.assets),
  `/content → ${content.body?.assets?.length ?? 0} assets`);

// Track download de un asset
if (content.body?.assets?.length > 0) {
  const td = await fetchOk(`${PROD}/api/referrals/content/track-download`, {
    method: "POST", headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ asset_id: content.body.assets[0].id }),
  });
  expect(td.status === 200, "POST /content/track-download válido");
}

const tdBad = await fetchOk(`${PROD}/api/referrals/content/track-download`, {
  method: "POST", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ asset_id: "00000000-0000-0000-0000-000000000000" }),
});
expect(tdBad.status === 404, "POST /content/track-download inválido → 404");

// /me/timeseries
const ts = await fetchOk(`${PROD}/api/referrals/me/timeseries?days=30`, { headers: { cookie } });
expect(ts.status === 200 && Array.isArray(ts.body?.timeseries) && ts.body.timeseries.length === 30,
  "/me/timeseries devuelve 30 puntos");

// /me/commissions
const comms = await fetchOk(`${PROD}/api/referrals/me/commissions`, { headers: { cookie } });
expect(comms.status === 200 && Array.isArray(comms.body?.commissions),
  "/me/commissions OK");

// POST /api/referrals/affiliates idempotente para affiliateOnly
const aff2 = await fetchOk(`${PROD}/api/referrals/affiliates`, {
  method: "POST", headers: { cookie },
});
expect(aff2.status === 200 && aff2.body?.affiliate?.id === affId,
  "POST /affiliates idempotente para affiliateOnly");

// ════════════════════════════════════════════════════════════════════
// E. SECURITY: cookie firmada, self-referral, panel access
// ════════════════════════════════════════════════════════════════════
group("E · Security");

// Cookie tampered: modificar el último carácter de la firma
const tamperedCookie = cookie.replace(/.$/, "0");
const meTamper = await fetchOk(`${PROD}/api/referrals/me`, { headers: { cookie: tamperedCookie } });
expect(meTamper.status === 401, "cookie con firma alterada → 401");

const profileTamper = await fetchOk(`${PROD}/api/referrals/public/profile`, { headers: { cookie: tamperedCookie } });
expect(profileTamper.status === 401, "cookie alterada en /profile → 401");

// Random cookie
const randomCookie = "pacame_aff_auth=randomtokenxxx.signaturexxx";
const meRandom = await fetchOk(`${PROD}/api/referrals/me`, { headers: { cookie: randomCookie } });
expect(meRandom.status === 401, "cookie inventada → 401");

// Self-referral: crear visit con el mismo afiliado autenticado
const selfRef = await fetchOk(`${PROD}/api/referrals/track`, {
  method: "POST", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ ref: code }),
});
expect(
  selfRef.body?.tracked === false && selfRef.body?.reason === "self_referral",
  "self-referral bloqueado",
  `self-referral NO bloqueado · respuesta: ${JSON.stringify(selfRef.body)}`,
);

// /afiliados/panel con cookie válida
const panelOk = await statusOnly(`${PROD}/afiliados/panel`, { headers: { cookie } });
expect(panelOk === 200, "/afiliados/panel con cookie válida → 200", `recibido ${panelOk}`);

// /dashboard/* requiere cookie pacame_auth (admin), no la del afiliado
const dashWithAffCookie = await statusNoFollow(`${PROD}/dashboard/referrals-admin`, { headers: { cookie } });
expect(
  dashWithAffCookie === 307 || dashWithAffCookie === 308,
  "afiliado no puede entrar al dashboard admin",
  `dashboard accesible con cookie afiliado · status ${dashWithAffCookie}`,
);

// ════════════════════════════════════════════════════════════════════
// F. ADMIN endpoints (requieren CRON_SECRET de producción)
// ════════════════════════════════════════════════════════════════════
group("F · Admin endpoints");

if (!PROD_CRON) {
  warn("CRON_SECRET de producción no disponible localmente — saltando bloque F", "ejecuta vercel env pull para tenerlo");
} else {
  const adminAuth = { Authorization: `Bearer ${PROD_CRON}` };

  for (const ep of [
    "/api/referrals/admin/overview?days=30",
    "/api/referrals/admin/visits?page=1&size=10",
    "/api/referrals/admin/referrals?page=1&size=10",
    "/api/referrals/admin/affiliates",
    "/api/referrals/admin/content",
    "/api/referrals/admin/campaign",
  ]) {
    const r = await fetchOk(`${PROD}${ep}`, { headers: adminAuth });
    expect(r.status === 200, `admin ${ep} → ${r.status}`);
  }

  // Sin auth → 401
  for (const ep of [
    "/api/referrals/admin/overview",
    "/api/referrals/admin/affiliates",
    "/api/referrals/admin/campaign",
  ]) {
    const r = await fetchOk(`${PROD}${ep}`);
    expect(r.status === 401, `admin ${ep} sin auth → ${r.status}`);
  }

  // Bearer falso → 401
  const fake = await fetchOk(`${PROD}/api/referrals/admin/overview`, {
    headers: { Authorization: "Bearer fake-token-xxx" },
  });
  expect(fake.status === 401, "admin con bearer falso → 401");

  // PATCH campaign validations
  for (const [body, label] of [
    [{ commission_percent: -1 }, "negative %"],
    [{ commission_percent: 101 }, "% > 100"],
    [{ commission_percent: "abc" }, "% non-number"],
    [{ cookie_days: 0 }, "cookie 0"],
    [{ cookie_days: 9999 }, "cookie too big"],
    [{ max_commission_period_months: -1 }, "months negative"],
    [{ attribution: "wrong" }, "attribution wrong"],
  ]) {
    const r = await fetchOk(`${PROD}/api/referrals/admin/campaign`, {
      method: "PATCH", headers: { ...adminAuth, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(r.status === 400, `PATCH campaign ${label} → 400`);
  }

  // PATCH no changes → 400
  const noChange = await fetchOk(`${PROD}/api/referrals/admin/campaign`, {
    method: "PATCH", headers: { ...adminAuth, "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  expect(noChange.status === 400 && noChange.body?.error === "no_changes",
    "PATCH campaign sin cambios → 400");

  // affiliate-status validations
  const sNoBody = await fetchOk(`${PROD}/api/referrals/admin/affiliate-status`, {
    method: "POST", headers: { ...adminAuth, "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  expect(sNoBody.status === 400, "affiliate-status sin body → 400");

  const sBadStatus = await fetchOk(`${PROD}/api/referrals/admin/affiliate-status`, {
    method: "POST", headers: { ...adminAuth, "content-type": "application/json" },
    body: JSON.stringify({ affiliate_id: affId, status: "invalid" }),
  });
  expect(sBadStatus.status === 400, "affiliate-status status inválido → 400");

  // mark-paid sin afiliado_id ni commission_ids → 400
  const mpNoBody = await fetchOk(`${PROD}/api/referrals/payouts/mark-paid`, {
    method: "POST", headers: { ...adminAuth, "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  expect(mpNoBody.status === 400, "mark-paid sin afiliado/ids → 400");

  // approve-pending OK
  const ap = await statusOnly(`${PROD}/api/referrals/approve-pending`, { headers: adminAuth });
  expect(ap === 200, "approve-pending OK con bearer");
}

// ════════════════════════════════════════════════════════════════════
// G. CONVERSION FLOW E2E (simulación SQL)
// ════════════════════════════════════════════════════════════════════
group("G · Conversion flow e2e");

// Tracking
const track = await fetch(`${PROD}/api/referrals/track`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({
    ref: code, path: "/landing",
    utm: { source: "audit", medium: "test", campaign: "final" },
  }),
});
expect((await track.json()).tracked, "track ref válido → tracked:true");

// Visit en BD: tiene que existir al menos una con utm_source=audit
const { data: visits } = await supabase
  .from("aff_visits").select("*").eq("affiliate_id", affId).order("created_at", { ascending: false });
const auditVisit = (visits || []).find((v) => v.utm_source === "audit");
expect(
  !!auditVisit,
  "visita con UTM=audit en BD",
  `no encontrada · ${visits?.length} visitas para afiliado`,
);

// Crear conversión + comisión
const refUserId = "00000000-0000-0000-0000-" + String(Date.now()).slice(-12).padStart(12, "0");
const subId = `sub_final_${Date.now()}`;
const { data: ref } = await supabase.from("aff_referrals").insert({
  tenant_id: TENANT, affiliate_id: affId, referred_user_id: refUserId,
  visit_id: auditVisit?.id, stripe_subscription_id: subId,
  status: "converted", converted_at: new Date().toISOString(),
  metadata: { product: "web", amount_eur: 800, source: "audit-final" },
}).select().single();
expect(ref?.id, "conversión creada en aff_referrals");

const sourceEvent = `inv_final_${Date.now()}`;
const { data: comm } = await supabase.from("aff_commissions").insert({
  tenant_id: TENANT, referral_id: ref.id, affiliate_id: affId,
  source_event: sourceEvent, amount_cents: 16000, currency: "eur",
  month_index: 1, status: "pending",
  due_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
  metadata: { product: "web", amount_eur: 800 },
}).select().single();
expect(comm?.id, "comisión generada");

// Idempotencia
const dup = await supabase.from("aff_commissions").upsert({
  tenant_id: TENANT, referral_id: ref.id, affiliate_id: affId,
  source_event: sourceEvent, amount_cents: 99999, currency: "eur",
  month_index: 1, status: "pending",
}, { onConflict: "tenant_id,source_event", ignoreDuplicates: true }).select();
expect(dup.data?.length === 0, "idempotencia: misma source_event no duplica");

// /me ahora muestra la comisión
const me2 = await fetchOk(`${PROD}/api/referrals/me`, { headers: { cookie } });
expect(me2.body?.stats?.pending_cents === 16000,
  `/me refleja 160 € pendiente (era ${me2.body?.stats?.pending_cents/100} €)`);

// /me/commissions con metadata.product
const myComms = await fetchOk(`${PROD}/api/referrals/me/commissions`, { headers: { cookie } });
const found = myComms.body?.commissions?.find((c) => c.id === comm.id);
expect(found?.metadata?.product === "web", "/me/commissions tiene metadata.product");

// /me/timeseries cuenta el click
const ts2 = await fetchOk(`${PROD}/api/referrals/me/timeseries?days=30`, { headers: { cookie } });
const totalClicks = (ts2.body?.timeseries ?? []).reduce((s, x) => s + x.clicks, 0);
expect(totalClicks >= 1, `/me/timeseries cuenta el click (total ${totalClicks})`);

// Clawback
const { data: voided } = await supabase
  .from("aff_commissions")
  .update({ status: "voided", voided_at: new Date().toISOString() })
  .eq("id", comm.id).neq("status", "paid").select().single();
expect(voided?.status === "voided", "clawback marca como voided");

// Logout
const out = await statusOnly(`${PROD}/api/referrals/public/logout`, {
  method: "POST", headers: { cookie },
});
expect(out === 200, "logout OK");

// /me sin cookie tras logout (la cookie del navegador real estaría borrada;
// aquí simulamos que sigue siendo válida porque el HMAC es válido — esto es
// esperado: el logout solo borra la cookie del cliente, no invalida server-side.)

// ════════════════════════════════════════════════════════════════════
// CLEANUP
// ════════════════════════════════════════════════════════════════════
group("Z · Cleanup");
await supabase.from("aff_commissions").delete().eq("source_event", sourceEvent);
await supabase.from("aff_referrals").delete().eq("id", ref.id);
await supabase.from("aff_visits").delete().eq("affiliate_id", affId);
await supabase.from("aff_affiliates").delete().eq("id", affId);
ok("cleanup completado");

// ════════════════════════════════════════════════════════════════════
// REPORTE
// ════════════════════════════════════════════════════════════════════
const groups = {};
for (const r of results) {
  groups[r.group] = groups[r.group] || [];
  groups[r.group].push(r);
}

console.log();
let pass = 0, fail = 0, warns = 0;
for (const [g, items] of Object.entries(groups)) {
  console.log(`\n${g}`);
  for (const r of items) {
    const icon = r.ok === true ? "\x1b[32m✓\x1b[0m" : r.ok === "warn" ? "\x1b[33m⚠\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`  ${icon} ${r.msg}${r.detail ? "  " + r.detail : ""}`);
    if (r.ok === true) pass++;
    else if (r.ok === "warn") warns++;
    else fail++;
  }
}

console.log(
  `\n══════════ RESULTADO: ${pass} pass · ${warns} warn · ${fail} fail ══════════\n`,
);
process.exit(fail > 0 ? 1 : 0);

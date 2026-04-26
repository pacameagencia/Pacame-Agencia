import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getMetaToken, getActiveTokenSource, isUsingSystemUser } from "@/lib/meta-token";

/**
 * Smoke tests E2E del token Meta activo.
 *
 * Ejecuta 7 chequeos contra Graph API y devuelve un resumen pass/fail.
 *
 * POST /api/admin/meta/test-suite
 * Body opcional: { token: "EAA..." } para testear un token concreto sin tocar env.
 *
 * Auth: Bearer CRON_SECRET o cookie dashboard.
 */

interface TestResult {
  name: string;
  endpoint: string;
  passed: boolean;
  status?: number;
  message?: string;
  data?: unknown;
}

async function probe(
  url: string,
  name: string,
  endpointLabel: string,
  validate?: (json: unknown) => boolean
): Promise<TestResult> {
  try {
    const res = await fetch(url, { method: "GET" });
    const json = (await res.json()) as { error?: { message: string }; [k: string]: unknown };

    if (!res.ok || json.error) {
      return {
        name,
        endpoint: endpointLabel,
        passed: false,
        status: res.status,
        message: json.error?.message || `HTTP ${res.status}`,
      };
    }

    const ok = validate ? validate(json) : true;
    return {
      name,
      endpoint: endpointLabel,
      passed: ok,
      status: res.status,
      data: json,
    };
  } catch (err) {
    return {
      name,
      endpoint: endpointLabel,
      passed: false,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = body.token || getMetaToken("any");

  if (!token) {
    return NextResponse.json(
      { error: "No Meta token configured and none provided in body" },
      { status: 400 }
    );
  }

  const tokenSource = body.token ? "body" : getActiveTokenSource("any");
  const usingSystemUser = !body.token && isUsingSystemUser();

  const PAGE_ID = process.env.META_PAGE_ID;
  const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
  const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const APP_ID = process.env.INSTAGRAM_APP_ID;

  const t = encodeURIComponent(token);
  const G = "https://graph.facebook.com/v21.0";

  const results: TestResult[] = [];

  // Test 1: Token válido — /me
  results.push(
    await probe(
      `${G}/me?fields=id,name&access_token=${t}`,
      "Token valid (/me)",
      "GET /me",
      (json) => typeof (json as { id?: string }).id === "string"
    )
  );

  // Test 2: Page accesible
  if (PAGE_ID) {
    results.push(
      await probe(
        `${G}/${PAGE_ID}?fields=id,name,category&access_token=${t}`,
        "Page accesible",
        `GET /${PAGE_ID}`,
        (json) => (json as { id?: string }).id === PAGE_ID
      )
    );
  } else {
    results.push({ name: "Page accesible", endpoint: "(skip)", passed: false, message: "META_PAGE_ID not set" });
  }

  // Test 3: Instagram accesible
  if (IG_ACCOUNT_ID) {
    results.push(
      await probe(
        `${G}/${IG_ACCOUNT_ID}?fields=id,username,followers_count&access_token=${t}`,
        "Instagram accesible",
        `GET /${IG_ACCOUNT_ID}`,
        (json) => (json as { id?: string }).id === IG_ACCOUNT_ID
      )
    );
  } else {
    results.push({ name: "Instagram accesible", endpoint: "(skip)", passed: false, message: "INSTAGRAM_ACCOUNT_ID not set" });
  }

  // Test 4: WhatsApp Business Account accesible
  if (WABA_ID) {
    results.push(
      await probe(
        `${G}/${WABA_ID}/phone_numbers?access_token=${t}`,
        "WhatsApp Business accesible",
        `GET /${WABA_ID}/phone_numbers`,
        (json) => Array.isArray((json as { data?: unknown[] }).data)
      )
    );
  } else {
    results.push({ name: "WhatsApp Business accesible", endpoint: "(skip)", passed: false, message: "WHATSAPP_BUSINESS_ACCOUNT_ID not set" });
  }

  // Test 5: Ad accounts accesibles (Meta Ads para NEXUS)
  results.push(
    await probe(
      `${G}/me/adaccounts?fields=id,name,account_status&access_token=${t}`,
      "Ad Accounts accesibles",
      "GET /me/adaccounts",
      (json) => Array.isArray((json as { data?: unknown[] }).data)
    )
  );

  // Test 6: Webhook subscriptions activas
  if (APP_ID) {
    const APP_TOKEN = encodeURIComponent(`${APP_ID}|${process.env.INSTAGRAM_APP_SECRET}`);
    results.push(
      await probe(
        `${G}/${APP_ID}/subscriptions?access_token=${APP_TOKEN}`,
        "Webhook subscriptions activas",
        `GET /${APP_ID}/subscriptions`,
        (json) => Array.isArray((json as { data?: unknown[] }).data)
      )
    );
  } else {
    results.push({ name: "Webhook subscriptions", endpoint: "(skip)", passed: false, message: "INSTAGRAM_APP_ID not set" });
  }

  // Test 7: Token NO expira (debug_token)
  if (APP_ID && process.env.INSTAGRAM_APP_SECRET) {
    const APP_TOKEN = encodeURIComponent(`${APP_ID}|${process.env.INSTAGRAM_APP_SECRET}`);
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${t}&access_token=${APP_TOKEN}`;
    results.push(
      await probe(
        debugUrl,
        "Token permanente (no expira)",
        "GET /debug_token",
        (json) => {
          const d = (json as { data?: { expires_at?: number; type?: string } }).data;
          return d?.expires_at === 0 || d?.type === "SYSTEM_USER";
        }
      )
    );
  } else {
    results.push({ name: "Token permanente", endpoint: "(skip)", passed: false, message: "App credentials missing" });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  return NextResponse.json({
    token_source: tokenSource,
    using_system_user: usingSystemUser,
    passed,
    failed,
    total: results.length,
    all_pass: failed === 0,
    results,
    summary:
      failed === 0
        ? "Token Meta operativo: WhatsApp + Instagram + Facebook + Ads + Webhooks OK."
        : `${failed}/${results.length} tests fallaron. Ver results[].message para detalles.`,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

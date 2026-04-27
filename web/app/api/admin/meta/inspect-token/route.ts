import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";

/**
 * Inspecciona un token Meta y devuelve un diagnóstico completo:
 * - Tipo (USER, PAGE, SYSTEM_USER, APP)
 * - Expiración real (`never` = System User permanente)
 * - Scopes presentes vs los 16 requeridos por PACAME
 * - Identidad asociada + Business Manager
 * - Recomendación accionable
 *
 * POST /api/admin/meta/inspect-token
 * Body: { token: "EAA..." } o sin body para inspeccionar el token activo de PACAME
 *
 * Auth: Bearer CRON_SECRET o cookie dashboard.
 */

const REQUIRED_SCOPES = [
  "whatsapp_business_management",
  "whatsapp_business_messaging",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_comments",
  "instagram_manage_insights",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_metadata",
  "pages_manage_engagement",
  "pages_messaging",
  "business_management",
  "ads_management",
  "ads_read",
] as const;

type DebugTokenData = {
  app_id?: string;
  type?: string;
  application?: string;
  expires_at?: number;
  data_access_expires_at?: number;
  is_valid?: boolean;
  scopes?: string[];
  user_id?: string;
  profile_id?: string;
  granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
  metadata?: { auth_type?: string };
  error?: { code?: number; message?: string; subcode?: number };
};

async function callGraph<T = unknown>(
  url: string
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(url, { method: "GET" });
    const json = (await res.json()) as { error?: { message: string }; data?: T } & T;
    if (!res.ok || json.error) {
      return {
        ok: false,
        error: json.error?.message || `HTTP ${res.status}`,
        status: res.status,
      };
    }
    return { ok: true, data: json as T, status: res.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => ({}))) as { token?: string };

  const token =
    body.token ||
    process.env.META_SYSTEM_USER_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.META_PAGE_ACCESS_TOKEN ||
    process.env.WHATSAPP_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "No token provided and no Meta token in env" },
      { status: 400 }
    );
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: "INSTAGRAM_APP_ID + INSTAGRAM_APP_SECRET required for debug_token" },
      { status: 500 }
    );
  }

  const appAccessToken = `${appId}|${appSecret}`;

  // 1. debug_token — identidad + tipo + expiración
  const debugRes = await callGraph<{ data: DebugTokenData }>(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appAccessToken)}`
  );

  // 2. /me — perfil
  const meRes = await callGraph<{ id: string; name?: string }>(
    `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`
  );

  // 3. /me/permissions — scopes vivos
  const permsRes = await callGraph<{ data: Array<{ permission: string; status: string }> }>(
    `https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`
  );

  // 4. /me/businesses — Business Manager asociado
  const bizRes = await callGraph<{ data: Array<{ id: string; name: string }> }>(
    `https://graph.facebook.com/v21.0/me/businesses?access_token=${encodeURIComponent(token)}`
  );

  // 5. WhatsApp accessibility
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  let whatsappAccessible = false;
  let whatsappError: string | undefined;
  if (wabaId) {
    const waRes = await callGraph(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${encodeURIComponent(token)}`
    );
    whatsappAccessible = waRes.ok;
    if (!waRes.ok) whatsappError = waRes.error;
  }

  // Análisis
  const debugData = debugRes.data?.data;
  const isValid = debugData?.is_valid === true;
  const expiresAt = debugData?.expires_at;
  const expiresAtIso =
    expiresAt === 0 || expiresAt === undefined
      ? "never"
      : new Date(expiresAt * 1000).toISOString();
  const tokenType = (debugData?.type || "").toUpperCase();
  const isSystemUser = tokenType === "SYSTEM_USER";

  const scopesAlive: string[] = (permsRes.data?.data || [])
    .filter((p) => p.status === "granted")
    .map((p) => p.permission);

  const scopesFromDebug: string[] = debugData?.scopes || [];
  const scopes = Array.from(new Set([...scopesAlive, ...scopesFromDebug]));

  const missingScopes = REQUIRED_SCOPES.filter((s) => !scopes.includes(s));

  // Recomendación
  let recommendation: string;
  if (!isValid) {
    if (debugRes.data?.data?.error) {
      recommendation = `Token NO válido: ${debugRes.data.data.error.message}. Genera uno nuevo desde business.facebook.com → System Users → Generate Token.`;
    } else if (debugRes.error) {
      recommendation = `Token NO válido: ${debugRes.error}. Posible app mismatch o token caducado. Regenera desde business.facebook.com.`;
    } else {
      recommendation = "Token NO válido. Regenera desde Business Manager.";
    }
  } else if (isSystemUser && expiresAtIso === "never" && missingScopes.length === 0) {
    recommendation = "PERFECTO — System User permanente con los 16 scopes. Listo para producción.";
  } else if (isSystemUser && expiresAtIso === "never") {
    recommendation = `System User permanente OK, pero faltan ${missingScopes.length} scopes: ${missingScopes.join(", ")}. Regenera el token marcando esos scopes en Business Manager.`;
  } else if (isSystemUser) {
    recommendation = `System User pero con expiración (${expiresAtIso}). Regenera marcando "Token expiration: Never".`;
  } else if (tokenType === "USER") {
    recommendation = `Token User long-lived, expira ${expiresAtIso}. Para hacer permanente: business.facebook.com → System Users → crear "PACAME-Permanent" → asignar Apps + Page + IG + WABA + Ad Account → Generate Token con los 16 scopes y expiration Never.`;
  } else if (tokenType === "PAGE") {
    recommendation = `Page token, expira ${expiresAtIso}. NO sirve para WhatsApp. Genera System User para token universal.`;
  } else {
    recommendation = `Token tipo ${tokenType || "desconocido"}. Genera System User en Business Manager.`;
  }

  return NextResponse.json({
    is_valid: isValid,
    type: tokenType.toLowerCase() || "unknown",
    is_system_user: isSystemUser,
    is_permanent: expiresAtIso === "never",
    expires_at: expiresAtIso,
    app_id: debugData?.app_id,
    app_match: debugData?.app_id === appId,
    user_id: debugData?.user_id || meRes.data?.id,
    user_name: meRes.data?.name,
    business_id: bizRes.data?.data?.[0]?.id,
    business_name: bizRes.data?.data?.[0]?.name,
    scopes,
    missing_scopes: missingScopes,
    scope_completeness: `${scopes.filter((s) => (REQUIRED_SCOPES as readonly string[]).includes(s)).length}/${REQUIRED_SCOPES.length}`,
    whatsapp_accessible: whatsappAccessible,
    whatsapp_error: whatsappError,
    recommendation,
    raw: {
      debug: debugRes.data?.data,
      me: meRes.data,
      businesses: bizRes.data?.data,
      permissions_count: permsRes.data?.data?.length,
    },
  });
}

// GET para health-check sin body — usa token activo de env
export async function GET(request: NextRequest) {
  return POST(request);
}

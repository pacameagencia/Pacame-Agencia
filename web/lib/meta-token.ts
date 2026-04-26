/**
 * Meta Graph API token resolver — fallback chain único para WhatsApp + Instagram + Facebook.
 *
 * Prioridad (cualquier scope):
 *   1. META_SYSTEM_USER_TOKEN — System User token permanente (NUNCA expira). Recomendado.
 *   2. Token específico de la plataforma (legado long-lived 60d).
 *   3. Cualquier otro token Meta presente (último recurso, mismo dominio Graph).
 *
 * Lectura dinámica de process.env en cada llamada — evita problemas con HMR de dev
 * y permite rotar tokens en runtime sin reiniciar el lambda.
 *
 * Una vez Pablo genere el System User token desde business.facebook.com,
 * solo hay que poner META_SYSTEM_USER_TOKEN en .env.local + Vercel y todo
 * (lib/instagram.ts, lib/whatsapp.ts, lib/social-publish.ts) lo usa automáticamente.
 *
 * Ver runbook: infra/docs/meta-system-user-token.md
 */

export type MetaTokenScope = "instagram" | "whatsapp" | "page" | "any";

export function getMetaToken(scope: MetaTokenScope = "any"): string {
  const systemUser = process.env.META_SYSTEM_USER_TOKEN;
  if (systemUser) return systemUser;

  const ig = process.env.INSTAGRAM_ACCESS_TOKEN;
  const wa = process.env.WHATSAPP_TOKEN;
  const page = process.env.META_PAGE_ACCESS_TOKEN;

  switch (scope) {
    case "instagram":
      return ig || page || wa || "";
    case "whatsapp":
      return wa || page || ig || "";
    case "page":
      return page || ig || wa || "";
    case "any":
    default:
      return systemUser || page || ig || wa || "";
  }
}

/**
 * True si hay algún token Meta utilizable para el scope dado.
 */
export function hasMetaToken(scope: MetaTokenScope = "any"): boolean {
  return !!getMetaToken(scope);
}

/**
 * True si el token activo es System User permanente.
 * Útil para logs / dashboards.
 */
export function isUsingSystemUser(): boolean {
  return !!process.env.META_SYSTEM_USER_TOKEN;
}

/**
 * Devuelve qué env var está sirviendo el token actualmente — para debugging.
 */
export function getActiveTokenSource(scope: MetaTokenScope = "any"): string {
  if (process.env.META_SYSTEM_USER_TOKEN) return "META_SYSTEM_USER_TOKEN";
  const ig = process.env.INSTAGRAM_ACCESS_TOKEN;
  const wa = process.env.WHATSAPP_TOKEN;
  const page = process.env.META_PAGE_ACCESS_TOKEN;

  switch (scope) {
    case "instagram":
      if (ig) return "INSTAGRAM_ACCESS_TOKEN";
      if (page) return "META_PAGE_ACCESS_TOKEN";
      if (wa) return "WHATSAPP_TOKEN";
      return "none";
    case "whatsapp":
      if (wa) return "WHATSAPP_TOKEN";
      if (page) return "META_PAGE_ACCESS_TOKEN";
      if (ig) return "INSTAGRAM_ACCESS_TOKEN";
      return "none";
    case "page":
      if (page) return "META_PAGE_ACCESS_TOKEN";
      if (ig) return "INSTAGRAM_ACCESS_TOKEN";
      if (wa) return "WHATSAPP_TOKEN";
      return "none";
    case "any":
    default:
      if (page) return "META_PAGE_ACCESS_TOKEN";
      if (ig) return "INSTAGRAM_ACCESS_TOKEN";
      if (wa) return "WHATSAPP_TOKEN";
      return "none";
  }
}

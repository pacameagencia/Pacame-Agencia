/**
 * Multi-brand messaging config resolver — PACAME factory + DarkRoom Capa 3.
 *
 * Cada brand resuelve sus propias env vars para WhatsApp, Telegram e Instagram.
 * Por defecto las funciones existentes (`sendWhatsApp`, `sendTelegram`,
 * publish helpers) caen al brand "pacame" → cero rotura del comportamiento
 * histórico cuando no se pasa el parámetro `brand`.
 *
 * Regla de oro (`strategy/darkroom/canales-mensajeria-adaptacion.md`):
 *   - PACAME y DarkRoom NO comparten tokens Meta. Si Meta banea el token
 *     de DarkRoom por el modelo membresía colectiva, PACAME WhatsApp + IG
 *     deben sobrevivir intactos.
 *   - El refactor permite que el SaaS DarkRoom siga usando este codebase sin
 *     tener que duplicar lógica de Meta Graph, n8n, etc.
 *   - Cada webhook entrante (WhatsApp/IG/Telegram) decide brand por su URL
 *     o por header — luego invoca la función con `{ brand }` y sigue.
 */

import { getMetaToken } from "@/lib/meta-token";

export type Brand = "pacame" | "darkroom";

export const DEFAULT_BRAND: Brand = "pacame";

const env = (key: string): string | undefined => process.env[key]?.trim() || undefined;

// ─── WhatsApp Business API ──────────────────────────────────────────────────

export interface WhatsAppConfig {
  brand: Brand;
  phoneId: string | undefined;
  token: string | undefined;
  verifyToken: string;
}

export function resolveWhatsAppConfig(brand: Brand = DEFAULT_BRAND): WhatsAppConfig {
  if (brand === "darkroom") {
    return {
      brand,
      phoneId: env("DARKROOM_WHATSAPP_PHONE_ID"),
      token:
        env("DARKROOM_META_SYSTEM_USER_TOKEN") ||
        env("DARKROOM_WHATSAPP_TOKEN") ||
        undefined,
      verifyToken: env("DARKROOM_WHATSAPP_VERIFY_TOKEN") || "darkroom_wa_verify_2026",
    };
  }
  // PACAME default — preserva el comportamiento histórico
  return {
    brand: "pacame",
    phoneId: env("WHATSAPP_PHONE_ID"),
    token: getMetaToken("whatsapp") || undefined,
    verifyToken: env("WHATSAPP_VERIFY_TOKEN") || "pacame_wa_verify_2026",
  };
}

export function isWhatsAppConfiguredFor(brand: Brand = DEFAULT_BRAND): boolean {
  const cfg = resolveWhatsAppConfig(brand);
  return !!(cfg.phoneId && cfg.token);
}

// ─── Telegram Bot API ───────────────────────────────────────────────────────

export interface TelegramConfig {
  brand: Brand;
  botToken: string | undefined;
  defaultChatId: string | undefined;        // Pablo personal en PACAME, soporte humano en DarkRoom
  webhookSecret: string | undefined;
}

export function resolveTelegramConfig(brand: Brand = DEFAULT_BRAND): TelegramConfig {
  if (brand === "darkroom") {
    return {
      brand,
      botToken: env("DARKROOM_TELEGRAM_BOT_TOKEN"),
      defaultChatId: env("DARKROOM_TELEGRAM_DEFAULT_CHAT_ID") || env("TELEGRAM_CHAT_ID"),
      webhookSecret: env("DARKROOM_TELEGRAM_WEBHOOK_SECRET"),
    };
  }
  return {
    brand: "pacame",
    botToken: env("TELEGRAM_BOT_TOKEN"),
    defaultChatId: env("TELEGRAM_CHAT_ID"),
    webhookSecret: env("TELEGRAM_WEBHOOK_SECRET"),
  };
}

export function isTelegramConfiguredFor(brand: Brand = DEFAULT_BRAND): boolean {
  return !!resolveTelegramConfig(brand).botToken;
}

// ─── Instagram Business API ─────────────────────────────────────────────────

export interface InstagramConfig {
  brand: Brand;
  appId: string | undefined;
  appSecret: string | undefined;
  accessToken: string | undefined;
  accountId: string | undefined;
  verifyToken: string;
}

export function resolveInstagramConfig(brand: Brand = DEFAULT_BRAND): InstagramConfig {
  if (brand === "darkroom") {
    return {
      brand,
      appId: env("DARKROOM_INSTAGRAM_APP_ID"),
      appSecret: env("DARKROOM_INSTAGRAM_APP_SECRET"),
      accessToken:
        env("DARKROOM_META_SYSTEM_USER_TOKEN") ||
        env("DARKROOM_INSTAGRAM_ACCESS_TOKEN") ||
        undefined,
      accountId: env("DARKROOM_INSTAGRAM_ACCOUNT_ID"),
      verifyToken: env("DARKROOM_INSTAGRAM_VERIFY_TOKEN") || "darkroom_ig_verify_2026",
    };
  }
  return {
    brand: "pacame",
    appId: env("INSTAGRAM_APP_ID"),
    appSecret: env("INSTAGRAM_APP_SECRET"),
    accessToken: getMetaToken("instagram") || undefined,
    accountId: env("INSTAGRAM_ACCOUNT_ID"),
    verifyToken: env("INSTAGRAM_VERIFY_TOKEN") || "pacame_ig_verify_2026",
  };
}

export function isInstagramConfiguredFor(brand: Brand = DEFAULT_BRAND): boolean {
  const cfg = resolveInstagramConfig(brand);
  return !!(cfg.accessToken && cfg.accountId);
}

// ─── Helpers genéricos ──────────────────────────────────────────────────────

/**
 * Detecta el brand desde un request entrante (webhook).
 * Reglas (en orden):
 *   1. Header `x-pacame-brand: darkroom` → darkroom.
 *   2. URL contiene `/api/darkroom/` → darkroom.
 *   3. Default: pacame.
 */
export function brandFromRequest(req: { url: string; headers: Headers }): Brand {
  const headerBrand = req.headers.get("x-pacame-brand")?.toLowerCase().trim();
  if (headerBrand === "darkroom") return "darkroom";
  if (req.url.includes("/api/darkroom/")) return "darkroom";
  return "pacame";
}

import { resolveTelegramConfig, type Brand, DEFAULT_BRAND } from "@/lib/messaging/config";

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramSendOptions {
  parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
  disable_notification?: boolean;
  /**
   * Brand del bot a usar. Default: "pacame" (compat retro).
   * Pasar "darkroom" para enviar desde @DarkRoomBot con su propio token.
   */
  brand?: Brand;
}

/**
 * Manda un mensaje al chat_id que se le indique. Pensado para multi-tenant
 * (cada asesor/cliente tiene su propio chat_id).
 *
 * Multi-brand: por defecto usa el bot PACAME. Pasa `{ brand: "darkroom" }`
 * para enviar desde el bot DarkRoom (`DARKROOM_TELEGRAM_BOT_TOKEN`).
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: TelegramSendOptions = {}
): Promise<boolean> {
  const cfg = resolveTelegramConfig(options.brand);
  if (!cfg.botToken) return false;
  try {
    const res = await fetch(
      `${TELEGRAM_API}/bot${cfg.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options.parse_mode || "HTML",
          disable_notification: options.disable_notification || false,
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send a message to the default chat ID of the brand's bot.
 * - Default (PACAME): manda a Pablo personal (TELEGRAM_CHAT_ID).
 * - DarkRoom: manda al chat de soporte/operaciones DarkRoom configurado.
 *
 * Returns true on success, false if not configured or failed.
 */
export async function sendTelegram(
  text: string,
  options: TelegramSendOptions = {}
): Promise<boolean> {
  const cfg = resolveTelegramConfig(options.brand);
  if (!cfg.botToken || !cfg.defaultChatId) {
    console.warn(
      `[Telegram:${cfg.brand}] Bot token or default chat ID not configured`
    );
    return false;
  }

  try {
    const res = await fetch(
      `${TELEGRAM_API}/bot${cfg.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.defaultChatId,
          text,
          parse_mode: options.parse_mode || "HTML",
          disable_notification: options.disable_notification || false,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error(`[Telegram:${cfg.brand}] Error:`, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[Telegram:${cfg.brand}] Exception:`, err);
    return false;
  }
}

// Re-exporta el tipo Brand para callers que ya importan de telegram.ts
export type { Brand };

// Helper específico para verificar configuración por brand sin instanciar todo el módulo
export function isTelegramConfigured(brand: Brand = DEFAULT_BRAND): boolean {
  const cfg = resolveTelegramConfig(brand);
  return !!cfg.botToken;
}

/**
 * Notify Pablo about a hot lead.
 */
export async function notifyHotLead(lead: {
  name: string;
  business_name?: string;
  score: number;
  problem?: string;
  budget?: string;
  source?: string;
}): Promise<boolean> {
  const emoji = lead.score >= 5 ? "🔥🔥" : "🔥";
  const text =
    `${emoji} <b>Lead Score ${lead.score}</b>\n\n` +
    `<b>${lead.name}</b>${lead.business_name ? ` — ${lead.business_name}` : ""}\n` +
    (lead.problem ? `Problema: ${lead.problem}\n` : "") +
    (lead.budget ? `Presupuesto: ${lead.budget}\n` : "") +
    (lead.source ? `Fuente: ${lead.source}\n` : "") +
    `\nRevisa en el dashboard.`;

  return sendTelegram(text);
}

/**
 * Notify Pablo about a payment.
 */
export async function notifyPayment(
  clientName: string,
  amount: number,
  product: string
): Promise<boolean> {
  return sendTelegram(
    `💰 <b>Pago recibido: ${amount}€</b>\n\n` +
      `Cliente: ${clientName}\n` +
      `Servicio: ${product}`
  );
}

/**
 * Send urgent alert to Pablo.
 */
export async function alertPablo(
  title: string,
  message: string,
  priority: "normal" | "high" | "critical" = "high"
): Promise<boolean> {
  const emoji =
    priority === "critical" ? "🚨" : priority === "high" ? "⚡" : "📢";
  return sendTelegram(`${emoji} <b>${title}</b>\n\n${message}`);
}

/**
 * Notify Pablo about content ready for review.
 */
export async function notifyContentReady(
  clientName: string,
  postCount: number,
  batchId: string
): Promise<boolean> {
  return sendTelegram(
    `🟢 <b>Contenido generado</b>\n\n` +
      `Cliente: ${clientName}\n` +
      `Posts: ${postCount}\n` +
      `Batch: ${batchId}\n\n` +
      `Revisa y aprueba en el dashboard.`
  );
}

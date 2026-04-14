const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();
const TELEGRAM_API = "https://api.telegram.org";

interface TelegramSendOptions {
  parse_mode?: "HTML" | "MarkdownV2";
  disable_notification?: boolean;
}

/**
 * Send a message to Pablo via Telegram bot.
 * Returns true on success, false if not configured or failed.
 */
export async function sendTelegram(
  text: string,
  options: TelegramSendOptions = {}
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not configured");
    return false;
  }

  try {
    const res = await fetch(
      `${TELEGRAM_API}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: options.parse_mode || "HTML",
          disable_notification: options.disable_notification || false,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("[Telegram] Error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram] Exception:", err);
    return false;
  }
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

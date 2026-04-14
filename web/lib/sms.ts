const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+34722669381";

const TWILIO_API = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

interface SmsResult {
  success: boolean;
  message_sid?: string;
  error?: string;
}

/**
 * Check if Twilio SMS is configured.
 */
export function isSmsConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
}

/**
 * Send an SMS via Twilio REST API.
 * Phone must be in E.164 format (e.g., "+34722669381").
 */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("[SMS] Not configured — TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing");
    return { success: false, error: "SMS not configured" };
  }

  // Clean phone: ensure E.164 format
  const cleanPhone = to.replace(/[\s\-()]/g, "");
  if (!/^\+\d{8,15}$/.test(cleanPhone)) {
    return { success: false, error: "Invalid phone format. Use E.164: +34XXXXXXXXX" };
  }

  // Twilio SMS limit: 1600 chars (will be split into segments automatically)
  const truncatedBody = body.slice(0, 1600);

  const params = new URLSearchParams({
    To: cleanPhone,
    From: TWILIO_PHONE_NUMBER,
    Body: truncatedBody,
  });

  try {
    const res = await fetch(TWILIO_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: params.toString(),
    });

    const data = await res.json() as { sid?: string; message?: string; code?: number };

    if (!res.ok) {
      console.error("[SMS] Twilio error:", data);
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }

    return { success: true, message_sid: data.sid };
  } catch (err) {
    console.error("[SMS] Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send a welcome SMS to a new lead.
 */
export async function sendLeadWelcomeSms(
  phone: string,
  leadName: string
): Promise<SmsResult> {
  const firstName = leadName.split(" ")[0] || leadName;
  const message =
    `Hola ${firstName}, soy el asistente de PACAME, tu agencia digital con IA. ` +
    `He recibido tu consulta y quiero entender mejor tu negocio. ` +
    `Respondeme a este mensaje o llamanos al +34 722 669 381. ` +
    `pacameagencia.com`;

  return sendSms(phone, message);
}

/**
 * Send a follow-up SMS to an inactive lead.
 */
export async function sendLeadFollowupSms(
  phone: string,
  leadName: string,
  context: string
): Promise<SmsResult> {
  const firstName = leadName.split(" ")[0] || leadName;
  const message =
    `Hola ${firstName}, soy PACAME. ${context} ` +
    `Te viene bien hablar esta semana? Podemos hacer un diagnostico rapido en 15 min. ` +
    `Responde aqui o llama al +34 722 669 381`;

  return sendSms(phone, message);
}

/**
 * Validate Twilio webhook signature (optional security).
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  // For now, validate by checking AccountSid matches
  // Full signature validation requires crypto HMAC-SHA1
  return params.AccountSid === TWILIO_ACCOUNT_SID;
}

/**
 * Checkout format helpers — pure functions para post-purchase UI.
 * Sin dependencies de Stripe/Supabase — 100% testeable.
 */

/**
 * Formatea cantidad en centimos a string legible con currency.
 * cents=2500, currency=EUR -> "25 EUR"
 * cents=null -> ""
 */
export function formatAmount(
  cents: number | null | undefined,
  currency: string
): string {
  if (cents == null || !Number.isFinite(cents)) return "";
  const amount = cents / 100;
  return `${amount.toLocaleString("es-ES")} ${currency.toUpperCase()}`;
}

/**
 * Genera referencia legible tipo PACAME-XXXXXXXX desde session_id Stripe.
 * Usa ultimos 8 chars en mayuscula, fallback a PACAME-PEND si no hay id.
 */
export function formatOrderRef(sessionId: string | null | undefined): string {
  if (!sessionId || sessionId.length < 8) return "PACAME-PEND";
  return `PACAME-${sessionId.slice(-8).toUpperCase()}`;
}

/**
 * Formatea ETA de entrega desde horas a texto human-friendly.
 * hours=4 -> "4 horas"
 * hours=72 -> "3 dias laborables"
 * null -> "7-14 dias laborables" (fallback conservador)
 */
export function formatDeliveryEta(
  hours: number | null | undefined
): string {
  if (!hours || !Number.isFinite(hours) || hours <= 0) {
    return "7-14 dias laborables";
  }
  if (hours <= 24) return `${hours} horas`;
  return `${Math.round(hours / 24)} dias laborables`;
}

/**
 * Retorna el primer nombre desde el full name del cliente.
 * "Pablo Calleja Gomez" -> "Pablo"
 * null -> null
 */
export function firstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  const trimmed = fullName.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

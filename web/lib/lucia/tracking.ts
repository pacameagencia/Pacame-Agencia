/**
 * Helpers cliente para emitir eventos GA4 + Meta Pixel desde PACAME GPT.
 *
 * GA4 ya está montado vía components/GoogleAnalytics.tsx (NEXT_PUBLIC_GA_MEASUREMENT_ID).
 * Meta Pixel: si NEXT_PUBLIC_META_PIXEL_ID existe, usamos `fbq` global; si no, no-op.
 *
 * Eventos emitidos:
 *   pacame_signup        — al crear cuenta (en login page tras ok)
 *   pacame_first_message — primer mensaje del usuario en la conversación 1
 *   pacame_action_click  — click en QuickAction (action: pdf|email|reminder|copy|share)
 *   pacame_upgrade_click — click en "Pasar a Premium"
 *   pacame_share         — generación de share link
 *   pacame_limit_reached — usuario free llega a 20/día
 */

type Params = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    gtag?: (cmd: string, name: string, params?: Params) => void;
    fbq?: (cmd: string, name: string, params?: Params) => void;
  }
}

/**
 * Emite un evento custom a GA4 y Meta Pixel (si están cargados).
 * Silencioso si no hay analytics: no rompe nada en dev.
 */
export function track(name: string, params: Params = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    // ignore
  }
  try {
    // Meta Pixel: usa nombres estándar para los eventos de conversión clave.
    const fb = window.fbq;
    if (!fb) return;
    if (name === "pacame_signup") fb("track", "CompleteRegistration", params);
    else if (name === "pacame_upgrade_click") fb("track", "InitiateCheckout", params);
    else fb("trackCustom", name, params);
  } catch {
    // ignore
  }
}

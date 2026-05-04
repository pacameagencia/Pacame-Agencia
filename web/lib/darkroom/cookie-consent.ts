/**
 * DarkRoom — utilidades de consentimiento de cookies (LSSI 22.2 + RGPD).
 *
 * Aislado del helper PACAME (`web/lib/cookie-consent.ts`) para:
 *   - Guardar consentimiento en clave distinta (`darkroom_cookie_consent`).
 *   - Loguear consentimiento en Supabase Dark Room IO (prueba RGPD).
 *   - Proteger la separación de marcas: si el usuario consintió en PACAME no
 *     hereda automáticamente para DarkRoom y viceversa.
 *
 * Tipos compatibles con CookieConsentState de PACAME para reutilizar UI base
 * cuando convenga, pero la persistencia es separada.
 */

export interface DarkRoomCookieConsent {
  essential: true;       // siempre true (no negociables)
  analytics: boolean;    // Plausible (privacy-friendly, anónimo) — aún así pedimos
  functional: boolean;   // preferencias de UI / idioma
  timestamp: string;     // ISO 8601
  version: 1;            // schema version
}

const STORAGE_KEY = "darkroom_cookie_consent";
const COOKIE_KEY = "darkroom_consent";       // duplicado en cookie técnica para SSR
const ENDPOINT = "/api/darkroom/cookies/consent";

/** Lee el consentimiento del usuario. Devuelve null si nunca consintió. */
export function getDarkRoomConsent(): DarkRoomCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DarkRoomCookieConsent;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Guarda el consentimiento localmente y lo loguea en Supabase para tener prueba
 * RGPD (artículo 7.1: "el responsable deberá ser capaz de demostrar que [...]
 * el interesado consintió"). El log es no-bloqueante.
 */
export function setDarkRoomConsent(state: Omit<DarkRoomCookieConsent, "version">): void {
  if (typeof window === "undefined") return;
  const full: DarkRoomCookieConsent = { ...state, version: 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  // Cookie técnica de 12 meses (LSSI permite cookie técnica de consentimiento sin pedir consentimiento)
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_KEY}=${full.analytics ? "ok" : "min"}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  // Notifica a otros componentes (analytics tracker)
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  // Log RGPD a backend (no-bloqueante)
  void logConsentToBackend(full);
}

/** Útil para condicionar Plausible / analytics opcional. */
export function hasDarkRoomAnalyticsConsent(): boolean {
  return getDarkRoomConsent()?.analytics === true;
}

/** Útil si en el futuro queremos chequear que existe consentimiento (no necesariamente analytics). */
export function hasAnyDarkRoomConsent(): boolean {
  return getDarkRoomConsent() !== null;
}

async function logConsentToBackend(state: DarkRoomCookieConsent): Promise<void> {
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analytics: state.analytics,
        functional: state.functional,
        timestamp: state.timestamp,
        version: state.version,
        userAgent: navigator.userAgent.slice(0, 240),
        referrer: document.referrer.slice(0, 240) || null,
      }),
      // No-bloqueante: si falla la red, el consentimiento local ya está guardado.
      keepalive: true,
    });
  } catch {
    /* swallow — local storage es source of truth para UX */
  }
}

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  functional: boolean;
  timestamp: string;
}

const STORAGE_KEY = "pacame_cookie_consent";

export function getCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}

export function setCookieConsent(state: CookieConsentState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Dispatch storage event for other components (e.g. GoogleAnalytics)
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}

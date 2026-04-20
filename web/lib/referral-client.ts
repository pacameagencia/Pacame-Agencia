/**
 * Lee el codigo de referral guardado en cookie `pacame_ref`.
 * Sirve en el front al hacer checkout para pasarlo al body del POST.
 * Client-side only.
 */
export function getReferralCode(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )pacame_ref=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]).toUpperCase().trim();
    if (!/^[A-Z0-9_-]{3,32}$/.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

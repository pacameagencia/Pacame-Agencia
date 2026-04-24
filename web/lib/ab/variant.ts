/**
 * A/B test variant assignment — deterministic por sessionId, cookie persistent.
 *
 * Uso (server):
 *   import { getVariantFromCookie } from "@/lib/ab/variant";
 *   const variant = getVariantFromCookie("hero-headline", cookies, ["control", "variant-a"]);
 *
 * Uso (client):
 *   import { useVariant } from "@/lib/ab/hook";
 *   const variant = useVariant("hero-headline", ["control", "variant-a"]);
 */

const COOKIE_PREFIX = "pacame_ab_";
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * FNV-1a hash simple — deterministico, rapido, sin deps.
 */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Pick variant from session seed + test name. Puramente deterministico.
 */
export function pickVariant(seed: string, testName: string, variants: string[]): string {
  if (variants.length === 0) return "";
  const h = hashString(`${seed}:${testName}`);
  return variants[h % variants.length];
}

export const AB_COOKIE_PREFIX = COOKIE_PREFIX;
export const AB_COOKIE_MAX_AGE_S = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

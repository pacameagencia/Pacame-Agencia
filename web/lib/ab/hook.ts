"use client";

import { useEffect, useState } from "react";
import { pickVariant, AB_COOKIE_PREFIX, AB_COOKIE_MAX_AGE_S } from "./variant";
import { trackVariantAssigned } from "@/lib/analytics/events";

function getSessionSeed(): string {
  if (typeof window === "undefined") return "";
  // Intenta reusar seed existente, sino genera y persiste
  const key = `${AB_COOKIE_PREFIX}seed`;
  let seed = "";
  try {
    seed = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${key}=`))
      ?.split("=")[1] || "";
  } catch {
    /* ignore */
  }
  if (!seed) {
    seed = Math.random().toString(36).slice(2, 14);
    try {
      document.cookie = `${key}=${seed}; max-age=${AB_COOKIE_MAX_AGE_S}; path=/; samesite=lax`;
    } catch {
      /* ignore */
    }
  }
  return seed;
}

/**
 * Hook client para A/B testing.
 *
 * @example
 *   const variant = useVariant("hero-headline", ["control", "variant-a"]);
 *   return variant === "variant-a" ? <B /> : <A />;
 *
 * Devuelve la primera variant en SSR (control) y la asignada tras hydration.
 */
export function useVariant<T extends string>(testName: string, variants: readonly T[]): T {
  const [variant, setVariant] = useState<T>(variants[0]);
  const [assigned, setAssigned] = useState(false);

  useEffect(() => {
    const seed = getSessionSeed();
    const picked = pickVariant(seed, testName, [...variants]) as T;
    setVariant(picked);
    if (!assigned) {
      trackVariantAssigned(testName, picked);
      setAssigned(true);
    }
  }, [testName, variants, assigned]);

  return variant;
}

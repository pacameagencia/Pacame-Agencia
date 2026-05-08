"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pacame_reduced_motion_v1";

/**
 * Hook a11y: detecta si el usuario quiere reduced motion.
 *
 * Resolución (en este orden de prioridad):
 *  1. Override explícito en localStorage (`pacame_reduced_motion_v1`).
 *     - "1" → forzar reducido
 *     - "0" → forzar 3D (incluso si la media query dice reduce)
 *  2. Media query `prefers-reduced-motion: reduce` (default user agent).
 *
 * Reactivo a:
 *  - Cambio de la media query (system preference change).
 *  - Evento custom `pacame:reduced-motion-changed` disparado por
 *    ReducedMotionToggle.
 *
 * Cuando true, el Storybook 3D oculta Canvas y muestra fallback HTML.
 */
function resolveReduced(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // ignore
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return true;
  }
  return false;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => setReduced(resolveReduced());
    update();

    // Listener: cambio de system preference
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mq?.addEventListener("change", update);

    // Listener: cambio manual desde ReducedMotionToggle
    const handleCustom = () => update();
    window.addEventListener("pacame:reduced-motion-changed", handleCustom);

    return () => {
      mq?.removeEventListener("change", update);
      window.removeEventListener("pacame:reduced-motion-changed", handleCustom);
    };
  }, []);

  return reduced;
}

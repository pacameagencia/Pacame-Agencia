/**
 * PACAME — useReducedMotion hook (Sprint 25)
 *
 * Wrapper de matchMedia para `prefers-reduced-motion: reduce`.
 * Reactivo: actualiza si el usuario cambia la preferencia.
 */

"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Hook combinado: detecta reduced-motion + viewport mobile.
 * Útil para gating de R3F y animaciones pesadas.
 */
export function useShouldAnimate(): {
  reduced: boolean;
  isMobile: boolean;
  shouldAnimate: boolean;
} {
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return {
    reduced,
    isMobile,
    shouldAnimate: !reduced,
  };
}

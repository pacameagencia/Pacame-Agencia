/**
 * PACAME — Lenis singleton accessor (Sprint 25)
 *
 * El SmoothScrollProvider ya inicializa Lenis y lo expone en `window.__lenis`.
 * Este módulo abstrae el acceso para que componentes no lean el global directamente.
 */

"use client";

import { useEffect, useState } from "react";
import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Devuelve la instancia Lenis si está montada, o null. */
export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  return window.__lenis ?? null;
}

/** Hook que devuelve la instancia Lenis cuando está disponible. */
export function useLenis(): Lenis | null {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const inst = getLenis();
      if (inst) setLenis(inst);
      else raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return lenis;
}

/**
 * Suscribe un listener al scroll de Lenis. Devuelve un cleanup.
 *
 * @example
 *   useEffect(() => {
 *     const off = subscribeScroll(({ progress, scroll }) => {
 *       updateTimeline(progress);
 *     });
 *     return off;
 *   }, []);
 */
export function subscribeScroll(
  cb: (data: { scroll: number; progress: number; velocity: number }) => void,
): () => void {
  const lenis = getLenis();
  if (!lenis) return () => {};
  lenis.on("scroll", cb);
  return () => lenis.off("scroll", cb);
}

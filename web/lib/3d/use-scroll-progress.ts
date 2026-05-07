"use client";

import { useEffect, useState } from "react";

interface LenisLike {
  on?: (event: string, cb: (e: { progress: number; scroll?: number; limit?: number }) => void) => void;
  off?: (event: string, cb: (e: { progress: number; scroll?: number; limit?: number }) => void) => void;
}

declare global {
  interface Window {
    __lenis?: LenisLike;
  }
}

/**
 * Hook fuente única de progress (0..1) para scroll-driven Storybook 3D.
 *
 * Estrategia:
 *   1. Si hay `window.__lenis` (LenisProvider ya montado), suscribirse.
 *   2. Fallback: window.scrollY / (scrollHeight - innerHeight).
 *
 * Razón: Lenis (ya instalado, lib `lenis@^1.3.21`) gestiona smooth-scroll
 * global. Usar SU progress como única fuente evita race conditions con
 * GSAP ScrollTrigger.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lenisHandler: ((e: { progress: number }) => void) | null = null;
    let rafId = 0;

    const fallbackUpdate = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      setProgress(p);
    };

    const tryLenis = () => {
      const lenis = window.__lenis;
      if (lenis?.on) {
        lenisHandler = (e) => setProgress(e.progress);
        lenis.on("scroll", lenisHandler);
        return true;
      }
      return false;
    };

    // Lenis puede tardar un frame en exponerse. Reintenta hasta 10 veces.
    let attempts = 0;
    const tryAttach = () => {
      if (tryLenis()) return;
      attempts++;
      if (attempts < 10) {
        rafId = requestAnimationFrame(tryAttach);
      } else {
        // Fallback definitivo: listener nativo
        window.addEventListener("scroll", fallbackUpdate, { passive: true });
        fallbackUpdate();
      }
    };
    tryAttach();

    return () => {
      cancelAnimationFrame(rafId);
      const lenis = window.__lenis;
      if (lenisHandler && lenis?.off) {
        lenis.off("scroll", lenisHandler);
      }
      window.removeEventListener("scroll", fallbackUpdate);
    };
  }, []);

  return progress;
}

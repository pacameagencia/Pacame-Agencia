"use client";

/**
 * Lenis smooth scroll wrapper — Safari-safe config (del skill pack 3d-scroll-website).
 * Envuelve el layout entero. Funciona con scroll handlers RAF nativos sin bridge.
 */

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Detect iOS/Safari — config diferente para evitar stuttering
    const isSafari =
      typeof navigator !== "undefined" &&
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Safari-specific tuning (del skill pack)
      lerp: isSafari ? 0.1 : 0.08,
      smoothWheel: true,
      syncTouch: !isSafari, // Safari iOS stutters con syncTouch=true
      wheelMultiplier: 1,
    });

    // rAF loop
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Expose global para que componentes avanzados puedan usarlo
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}

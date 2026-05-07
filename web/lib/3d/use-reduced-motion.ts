"use client";

import { useEffect, useState } from "react";

/**
 * Hook a11y: detecta `prefers-reduced-motion: reduce`.
 *
 * Cuando true, el Storybook 3D debe:
 *   - Ocultar Canvas y mostrar `<NoScriptContent>` con animaciones CSS suaves.
 *   - Quitar parallax, scroll-driven cámara, hover scale exuberante.
 *   - Mantener CTA y form auditoría 100% accesibles.
 *
 * Combinable con un toggle manual en el footer (`localStorage`).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();

    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

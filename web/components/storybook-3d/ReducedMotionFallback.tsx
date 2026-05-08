"use client";

import { useReducedMotion } from "@/lib/3d/use-reduced-motion";
import NoScriptContent from "./legacy-shell/NoScriptContent";

/**
 * Fallback para usuarios con `prefers-reduced-motion: reduce` o sin WebGL2.
 *
 * En lugar de Canvas R3F, muestra el `<NoScriptContent>` con visibilidad
 * forzada. Mantiene CTA, copy real y form auditoría 100% accesibles.
 *
 * Esta versión es la mínima de Fase 2. En Fase 5 se puede mejorar con
 * snap-scroll CSS suave entre las 6 secciones.
 */
export default function ReducedMotionFallback() {
  const reducedMotion = useReducedMotion();
  if (!reducedMotion) return null;
  return (
    <div className="relative z-20">
      <NoScriptContent visible />
    </div>
  );
}

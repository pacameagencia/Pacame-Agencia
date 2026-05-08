"use client";

import { useEffect, useState } from "react";

/**
 * Toggle persistente de "modo reducido" para usuarios que no toleran 3D
 * (ya sea por preferencia, mareos, batería, datos limitados o teclado-only).
 *
 * Funcionalidad:
 *  - Lee inicial de localStorage `pacame_reduced_motion_v1` o de la media
 *    query `prefers-reduced-motion: reduce` (default user agent).
 *  - Toggle persiste en localStorage (override la media query).
 *  - Cuando true, dispara evento custom `pacame:reduced-motion-changed`
 *    para que Scene/HUD escuchen y se oculten.
 *
 * Posicionamiento: pequeño botón en la esquina inferior izquierda, discreto.
 * Mobile: oculto por defecto en favor del PersistentCTA. Visible al focus
 * o tocar la esquina.
 */

const STORAGE_KEY = "pacame_reduced_motion_v1";

function loadInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // ignore
  }
  // Fallback: media query
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  return false;
}

export default function ReducedMotionToggle() {
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduced(loadInitial());
  }, []);

  const toggle = () => {
    const next = !reduced;
    setReduced(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
    // Notificar a otros componentes (Scene/HUD pueden escuchar)
    window.dispatchEvent(
      new CustomEvent("pacame:reduced-motion-changed", { detail: { reduced: next } }),
    );
  };

  // SSR-safe: no renderizar hasta hydratar
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={reduced ? "Desactivar modo reducido" : "Activar modo reducido (sin 3D)"}
      aria-pressed={reduced}
      title={reduced ? "Modo reducido activo (sin 3D)" : "Activar modo reducido (sin 3D)"}
      className="
        fixed z-30 bottom-4 left-4
        h-10 px-3 rounded-full
        bg-paper/80 backdrop-blur-md border border-ink/10
        text-xs font-mono uppercase tracking-wider text-ink/60
        hover:bg-paper hover:text-ink hover:border-ink/30
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500
        transition-all
        flex items-center gap-2
      "
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${
          reduced ? "bg-terracotta-500" : "bg-ink/30"
        }`}
      />
      {reduced ? "3D off" : "3D on"}
    </button>
  );
}

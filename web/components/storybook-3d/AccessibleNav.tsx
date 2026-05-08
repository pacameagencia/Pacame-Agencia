"use client";

import { useEffect } from "react";

import { ISLAND_CONTENT, ISLAND_ORDER, type IslandSlug } from "@/lib/storybook/content";

/**
 * Navegación accesible por teclado para el Storybook 3D.
 *
 * Funcionalidad:
 *  - Atajos `1..5`: salta a la isla correspondiente.
 *  - Atajo `0` o `Escape`: vuelve al overview.
 *  - Atajo `?`: muestra ayuda en consola (placeholder; HUD futuro).
 *  - Botones visibles al hacer Tab → focusable, navegables como menú.
 *
 * Visualmente está oculto por defecto (`sr-only`) pero se muestra en cuanto
 * recibe foco (focus-within). Esto cumple WCAG 2.4.3 (focus order) y
 * 2.1.1 (keyboard accessibility) sin contaminar la estética del HUD.
 *
 * Cuando alguien navega solo con teclado, ve un dock discreto en la parte
 * superior con los 5 atajos numéricos como botones "skip-to".
 */

interface AccessibleNavProps {
  /** Llamado cuando el user activa una isla por click o atajo. */
  onIslandSelect: (slug: IslandSlug) => void;
  /** Llamado cuando el user pulsa Esc o "0" (volver a overview). */
  onOverview: () => void;
}

export default function AccessibleNav({
  onIslandSelect,
  onOverview,
}: AccessibleNavProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignora si el usuario está escribiendo en un input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Atajos 1..5
      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= ISLAND_ORDER.length) {
        e.preventDefault();
        const slug = ISLAND_ORDER[digit - 1];
        onIslandSelect(slug);
        return;
      }

      // Overview
      if (e.key === "0" || e.key === "Escape") {
        e.preventDefault();
        onOverview();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onIslandSelect, onOverview]);

  return (
    <nav
      aria-label="Navegación rápida por teclado"
      className="
        fixed top-4 left-1/2 -translate-x-1/2 z-30
        flex flex-row gap-2
        sr-only focus-within:not-sr-only focus-within:rounded-full
        focus-within:bg-paper/90 focus-within:backdrop-blur-md focus-within:px-3 focus-within:py-2
        focus-within:shadow-md
      "
    >
      <button
        type="button"
        onClick={onOverview}
        className="rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-ink/10 text-ink hover:bg-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500"
      >
        Overview (0)
      </button>
      {ISLAND_ORDER.map((slug, idx) => {
        const content = ISLAND_CONTENT[slug];
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onIslandSelect(slug)}
            className="rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-ink/10 text-ink hover:bg-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500"
            aria-label={content.shortcutLabel}
          >
            {content.category} ({idx + 1})
          </button>
        );
      })}
    </nav>
  );
}

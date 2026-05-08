"use client";

import { useIslandState } from "@/lib/storybook/island-state";
import { ISLAND_CONTENT, ISLAND_ORDER, type IslandSlug } from "@/lib/storybook/content";

/**
 * Mini-mapa de 5 dots verticales (desktop) / horizontales (mobile).
 *
 * Estados de cada dot:
 *  - idle:       círculo vacío con borde ink/30
 *  - visited:    círculo lleno tenue (ink/50)
 *  - active:     círculo lleno + halo mostaza (animado)
 *
 * Click en dot → llama setActiveIslandManually() y dispara scroll programático
 * al keyframe de esa isla. Lo gestiona el padre vía onIslandClick.
 *
 * A11y: cada dot es un <button> con aria-label semántico.
 */

interface ProgressIndicatorProps {
  /** Cuando se clica un dot, parent recibe el slug y debe hacer scrollTo(progress). */
  onIslandClick: (slug: IslandSlug) => void;
}

export default function ProgressIndicator({ onIslandClick }: ProgressIndicatorProps) {
  const { activeIsland, visitedIslands } = useIslandState();

  return (
    <nav
      aria-label="Mapa de servicios PACAME"
      className="
        fixed z-30 select-none
        top-20 left-1/2 -translate-x-1/2 flex flex-row gap-3
        sm:top-1/2 sm:left-auto sm:right-6 sm:-translate-x-0 sm:-translate-y-1/2 sm:flex-col sm:gap-4
      "
    >
      {ISLAND_ORDER.map((slug) => {
        const content = ISLAND_CONTENT[slug];
        const isActive = activeIsland === slug;
        const isVisited = visitedIslands.has(slug);

        return (
          <button
            key={slug}
            type="button"
            onClick={() => onIslandClick(slug)}
            aria-label={content.shortcutLabel}
            aria-current={isActive ? "true" : undefined}
            className={`
              relative h-3 w-3 rounded-full
              transition-all duration-300
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper
              ${isActive
                ? "bg-terracotta-500 scale-125"
                : isVisited
                  ? "bg-ink/40 hover:bg-ink/60"
                  : "bg-transparent border border-ink/30 hover:border-ink/60"
              }
            `}
          >
            {/* Halo mostaza animado cuando está activo */}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-0 -m-1 rounded-full bg-mustard-500/40 animate-ping"
              />
            )}
            <span className="sr-only">{content.category}</span>
          </button>
        );
      })}
    </nav>
  );
}

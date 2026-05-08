"use client";

import { useCallback } from "react";

import { useIslandState, progressForIsland } from "@/lib/storybook/island-state";
import type { IslandSlug } from "@/lib/storybook/content";

import PersistentCTA from "./PersistentCTA";
import ProgressIndicator from "./ProgressIndicator";
import ActiveIslandLabel from "./ActiveIslandLabel";
import AccessibleNav from "./AccessibleNav";

/**
 * HUD overlay del Storybook 3D — agrupa todos los componentes UI que
 * viven encima del Canvas R3F.
 *
 * Composición:
 *  - <ActiveIslandLabel/>:  hookline + valor + caso (top center).
 *  - <ProgressIndicator/>:  5 dots clicables (right desktop / top mobile).
 *  - <AccessibleNav/>:      atajos teclado 1..5, 0/Esc.
 *  - <PersistentCTA/>:      CTA único "Pide tu auditoría 15 min".
 *
 * Interacción:
 *  - Click en dot del ProgressIndicator → scroll programático a esa isla.
 *  - Tecla 1..5 → mismo efecto.
 *  - Tecla 0 / Esc → vuelve al overview.
 *
 * Posicionamiento: absoluto fixed encima del canvas, todo z-30+ excepto
 * CTA que está en z-40 para que siempre sea clicable.
 */

export default function HUD() {
  const { setActiveIslandManually, clearOverride } = useIslandState();

  const scrollToIsland = useCallback((slug: IslandSlug) => {
    const targetProgress = setActiveIslandManually(slug);
    if (typeof window !== "undefined") {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: max * targetProgress,
        behavior: "smooth",
      });
    }
  }, [setActiveIslandManually]);

  const scrollToOverview = useCallback(() => {
    clearOverride();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Suprimir warning de progressForIsland sin uso (lo importamos por si Fase 4 lo necesita)
    void progressForIsland;
  }, [clearOverride]);

  return (
    <>
      <AccessibleNav
        onIslandSelect={scrollToIsland}
        onOverview={scrollToOverview}
      />
      <ActiveIslandLabel />
      <ProgressIndicator onIslandClick={scrollToIsland} />
      <PersistentCTA />
    </>
  );
}

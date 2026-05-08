"use client";

import { useIslandState } from "@/lib/storybook/island-state";
import {
  ISLAND_CONTENT,
  OVERVIEW_HOOKLINE,
  OVERVIEW_SUBLINE,
} from "@/lib/storybook/content";

/**
 * Label central del HUD — muestra contenido contextual según isla activa.
 *
 * Estados:
 *  - Sin isla activa (overview):  "Tu agencia de IA. / 5 servicios. 1 transformación."
 *  - Con isla activa:             categoría + hookline + oneLineValue + miniCase
 *
 * Posicionamiento:
 *  - Centrado horizontal, vertical en upper-third (no compite con CTA bottom).
 *  - Pill background semi-translúcido para legibilidad sobre canvas.
 *
 * Animación:
 *  - Fade + slide vertical sutil al cambiar de isla (Framer Motion ya en stack).
 */

import { motion, AnimatePresence } from "framer-motion";

const transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

export default function ActiveIslandLabel() {
  const { activeIsland } = useIslandState();
  const content = activeIsland ? ISLAND_CONTENT[activeIsland] : null;

  return (
    <div
      aria-live="polite"
      className="
        fixed z-30 pointer-events-none
        left-1/2 -translate-x-1/2 top-[12vh] sm:top-[15vh]
        w-[calc(100%-3rem)] max-w-2xl text-center
      "
    >
      <AnimatePresence mode="wait">
        {!content ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
            className="rounded-3xl bg-paper/70 backdrop-blur-md px-6 py-5 sm:px-8 sm:py-6 shadow-sm"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink leading-tight tracking-tight text-balance">
              {OVERVIEW_HOOKLINE}
            </h1>
            <p className="mt-2 text-base sm:text-lg text-ink/70 font-light">
              {OVERVIEW_SUBLINE}
            </p>
            <p className="mt-3 text-xs sm:text-sm text-ink/50 font-mono uppercase tracking-wider">
              ↓ desliza para empezar
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={content.serviceId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={transition}
            className="rounded-3xl bg-paper/75 backdrop-blur-md px-6 py-5 sm:px-8 sm:py-6 shadow-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-ink/50">
              <span
                aria-hidden="true"
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  content.baseColor === "terracotta"
                    ? "bg-terracotta-500"
                    : content.baseColor === "indigo"
                      ? "bg-indigo-600"
                      : content.baseColor === "mustard"
                        ? "bg-mustard-500"
                        : content.baseColor === "olive"
                          ? "bg-olive-500"
                          : "bg-terracotta-500"
                }`}
              />
              {content.category}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-ink leading-tight tracking-tight text-balance">
              {content.hookline}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-ink/75 font-light max-w-xl mx-auto">
              {content.oneLineValue}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-ink/50 font-mono">
              {content.miniCase}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

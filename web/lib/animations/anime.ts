/**
 * PACAME — animejs 4.x SSR-safe wrapper (Sprint 25)
 *
 * animejs es client-only. Este wrapper expone helpers que respetan SSR
 * y `prefers-reduced-motion`.
 *
 * Uso:
 *   import { animateChars, animateOnce } from "@/lib/animations/anime";
 *   useEffect(() => { animateChars(ref.current, { y: ['100%', '0%'] }); }, []);
 */

"use client";

import type { TargetsParam, AnimationParams } from "animejs";
import { EASE_OUT_EXPO_STR, STAGGER } from "./easings";

let animePromise: Promise<typeof import("animejs")> | null = null;

/** Carga animejs dinámicamente (lazy chunk). Solo client. */
function loadAnime() {
  if (typeof window === "undefined") return null;
  if (!animePromise) animePromise = import("animejs");
  return animePromise;
}

/** Detecta si el usuario prefiere movimiento reducido. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Aplica una animación a `targets` con respeto a reduced-motion.
 * Si reduce-motion está activo, fija las propiedades finales sin animar.
 */
export async function animate(
  targets: TargetsParam,
  params: AnimationParams,
): Promise<void> {
  const lib = await loadAnime();
  if (!lib) return;

  if (prefersReducedMotion()) {
    // Salta animación: aplica los valores finales como estado
    const finalParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v) && v.length >= 2) finalParams[k] = v[v.length - 1];
    }
    lib.animate(targets, { ...finalParams, duration: 0 });
    return;
  }

  lib.animate(targets, params);
}

/**
 * Split de texto en chars/words/lines y reveal staggered.
 * Usa animejs 4.x text.split API.
 *
 * @example
 *   animateChars(headingEl, { y: ['100%', '0%'], opacity: [0, 1] });
 */
export async function animateChars(
  el: HTMLElement | null,
  params: AnimationParams = {},
): Promise<void> {
  if (!el) return;
  const lib = await loadAnime();
  if (!lib) return;

  const { text, animate: anim, stagger } = lib;
  const splitter = text.split(el, { chars: { wrap: "clip" } });
  const chars = splitter.chars;

  if (prefersReducedMotion()) {
    anim(chars, { opacity: [0, 1], duration: 0, ease: "linear" });
    return;
  }

  anim(chars, {
    y: ["100%", "0%"],
    opacity: [0, 1],
    delay: stagger(STAGGER.tight),
    duration: 800,
    ease: "out(3)",
    ...params,
  });
}

/**
 * Anima al intersectar viewport (one-shot).
 * Usa IntersectionObserver nativo + animejs.
 */
export function animateOnce(
  el: HTMLElement | null,
  params: AnimationParams,
  options: { threshold?: number; rootMargin?: string } = {},
): () => void {
  if (!el || typeof window === "undefined") return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        animate(el, params);
        observer.disconnect();
      }
    },
    {
      threshold: options.threshold ?? 0.2,
      rootMargin: options.rootMargin ?? "0px 0px -10% 0px",
    },
  );

  observer.observe(el);
  return () => observer.disconnect();
}

/** Re-export helpers comunes desde animejs (lazy) */
export const animeReady = loadAnime;
export { EASE_OUT_EXPO_STR };

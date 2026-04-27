/**
 * PACAME — Cinematic easings (Sprint 25)
 *
 * Curvas de animación reutilizables. Mismas que usa Apple en sus product pages
 * y agencias premium tipo Lusion / Igloo / Active Theory.
 *
 * Uso con framer-motion:
 *   transition={{ duration: 0.9, ease: EASE_APPLE }}
 *
 * Uso con animejs 4.x:
 *   animate(el, { ..., ease: EASE_APPLE_STR })
 */

export const EASE_APPLE = [0.23, 1, 0.32, 1] as const;
export const EASE_LUSION = [0.7, 0, 0.3, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
export const EASE_IN_OUT_CIRC = [0.85, 0, 0.15, 1] as const;
export const EASE_OUT_BACK = [0.34, 1.56, 0.64, 1] as const;
export const EASE_SPRING_SOFT = [0.43, 0.13, 0.23, 0.96] as const;

/** Versiones string para CSS / animejs 4.x */
export const EASE_APPLE_STR = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_LUSION_STR = "cubic-bezier(0.7, 0, 0.3, 1)";
export const EASE_OUT_EXPO_STR = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Duraciones tipográficas cinematic (ms) */
export const DURATION = {
  micro: 150,
  fast: 220,
  medium: 400,
  slow: 600,
  cinematic: 900,
  hero: 1200,
} as const;

/** Stagger delays comunes (ms) */
export const STAGGER = {
  tight: 20,
  normal: 40,
  wide: 80,
  drama: 120,
} as const;

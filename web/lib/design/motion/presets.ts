/**
 * PACAME Motion Presets — Framer Motion reusables
 * Import en componentes: `import { fadeUp, listStagger } from "@/lib/design/motion/presets"`
 *
 * Principio: mismos springs, mismos viewport margins, mismos delays en toda
 * la app → "siente premium" por consistencia, no por efectos llamativos.
 */
import type { Variants } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════
// Base spring presets (del skill pack 3d-scroll-website)
// ═══════════════════════════════════════════════════════════════════
export const SPRING = {
  soft:   { type: "spring", stiffness: 100, damping: 20 } as const,
  bouncy: { type: "spring", stiffness: 150, damping: 15 } as const,
  tight:  { type: "spring", stiffness: 300, damping: 30 } as const,
  gentle: { type: "spring", stiffness: 60,  damping: 18 } as const,
};

/**
 * Easings como tuple 4-tuple fija — Framer Motion 12 acepta BezierDefinition
 * solo si el tipo es exactamente [number, number, number, number].
 */
type Bezier = [number, number, number, number];
export const EASE = {
  apple:   [0.23, 1, 0.32, 1] as Bezier,
  smooth:  [0.4, 0, 0.2, 1]   as Bezier,
  expoOut: [0.16, 1, 0.3, 1]  as Bezier,
  back:    [0.175, 0.885, 0.32, 1.275] as Bezier,
};

export const VIEWPORT = {
  // Activar reveal un poco antes de entrar al viewport (mejor percepcion)
  default: { once: true, margin: "-100px 0px -100px 0px" },
  tight:   { once: true, margin: "-50px 0px -50px 0px" },
  generous:{ once: true, margin: "0px" },
};

// ═══════════════════════════════════════════════════════════════════
// Variants — scroll reveals
// ═══════════════════════════════════════════════════════════════════

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING.soft,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE.apple },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING.soft,
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING.soft,
  },
};

export const springScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING.bouncy,
  },
};

export const glassPop: Variants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { ...SPRING.soft, filter: { duration: 0.3 } },
  },
};

// ═══════════════════════════════════════════════════════════════════
// List stagger — contenedor + item
// ═══════════════════════════════════════════════════════════════════

export const listStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const listStaggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const listStaggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.15,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Hover + tap presets (para buttons / cards interactivos)
// ═══════════════════════════════════════════════════════════════════

export const cardHover = {
  rest:  { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.01, transition: SPRING.tight },
};

export const buttonTap = {
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

// ═══════════════════════════════════════════════════════════════════
// Page transitions
// ═══════════════════════════════════════════════════════════════════

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE.expoOut },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: EASE.smooth },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Drawer / modal slide
// ═══════════════════════════════════════════════════════════════════

export const drawerSlide: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { ...SPRING.tight, stiffness: 200 },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Number counter (usar con animate + useMotionValue)
// ═══════════════════════════════════════════════════════════════════

export const numberCounterTransition = {
  duration: 1.2,
  ease: EASE.expoOut,
};

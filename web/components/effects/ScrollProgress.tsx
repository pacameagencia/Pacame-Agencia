"use client";

import { useScroll, useSpring, motion, useReducedMotion } from "framer-motion";

/**
 * PACAME — ScrollProgress refactor (Sprint 25)
 *
 * Barra superior 2px con gradient tech-accent. Spring suave.
 * Respeta prefers-reduced-motion.
 */

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[51] origin-left bg-tech-aurora"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

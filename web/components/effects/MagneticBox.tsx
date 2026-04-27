"use client";

/**
 * PACAME — MagneticBox wrapper (Sprint 25)
 *
 * Wrapper genérico que aplica efecto magnético a cualquier children.
 * El children se mueve sutilmente hacia el cursor cuando este está cerca.
 * Estilo Lusion.
 *
 * @example
 *   <MagneticBox strength={0.3}>
 *     <button className="...">Click me</button>
 *   </MagneticBox>
 */

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/animations/use-reduced-motion";

interface MagneticBoxProps {
  children: ReactNode;
  /** Multiplier 0..1. Default 0.2 (Apple-grade subtle). Lusion ~0.4. */
  strength?: number;
  /** className passed to wrapper div */
  className?: string;
  /** Optional: disable on mobile (default true) */
  desktopOnly?: boolean;
}

export default function MagneticBox({
  children,
  strength = 0.2,
  className = "",
  desktopOnly = true,
}: MagneticBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduced = useReducedMotion();

  const springConfig = { stiffness: 220, damping: 22, mass: 0.5 };
  const sx = useSpring(x, springConfig);
  const sy = useSpring(y, springConfig);

  const handleMove = (e: React.MouseEvent) => {
    if (reduced) return;
    if (desktopOnly && window.matchMedia("(max-width: 1023px)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

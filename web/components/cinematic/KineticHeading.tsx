"use client";

/**
 * PACAME — KineticHeading (Sprint 25)
 *
 * H1/H2 reutilizable con char-split + reveal staggered al intersectar viewport.
 * Usa animejs 4.x text.split + animate con stagger.
 * Respeta prefers-reduced-motion.
 *
 * @example
 *   <KineticHeading as="h1" className="text-display">
 *     Tu equipo digital,{" "}
 *     <span className="text-tech-accent">resuelto hoy.</span>
 *   </KineticHeading>
 */

import {
  createElement,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
  type ElementType,
} from "react";
import { useInView } from "@/lib/animations/use-in-view";
import { animateChars } from "@/lib/animations/anime";

type HeadingTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

interface KineticHeadingProps {
  children: ReactNode;
  as?: HeadingTag;
  className?: string;
  style?: CSSProperties;
  /** Stagger entre chars (ms). Default 20 */
  stagger?: number;
  /** Duración de cada char (ms). Default 800 */
  duration?: number;
  /** Delay antes de empezar (ms) */
  delay?: number;
  /** Threshold visibility para trigger. Default 0.2 */
  threshold?: number;
  /** Disable la animación (renderiza estático) */
  disabled?: boolean;
}

export default function KineticHeading({
  children,
  as = "h2",
  className = "",
  style,
  stagger = 20,
  duration = 800,
  delay = 0,
  threshold = 0.2,
  disabled = false,
}: KineticHeadingProps) {
  const ref = useRef<HTMLElement | null>(null);
  const animatedRef = useRef(false);
  const [inViewRef, inView] = useInView({ threshold, triggerOnce: true });

  // Combina los 2 refs
  const setRefs = (el: HTMLElement | null) => {
    ref.current = el;
    inViewRef(el);
  };

  useEffect(() => {
    if (disabled || animatedRef.current || !inView || !ref.current) return;
    animatedRef.current = true;
    animateChars(ref.current, {
      duration,
      delay: (_el, i: number) => delay + i * stagger,
      ease: "out(3)",
    });
  }, [inView, disabled, duration, delay, stagger]);

  return createElement(
    as as ElementType,
    { ref: setRefs, className, style },
    children,
  );
}

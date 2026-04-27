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
  /** A11y: texto accesible que screen readers leerán íntegro.
   *  Si no se pasa, intenta extraer del children. */
  ariaLabel?: string;
}

/** Extrae texto plano de ReactNode para aria-label fallback */
function flattenText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(" ");
  if (typeof node === "object" && "props" in node) {
    return flattenText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
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
  ariaLabel,
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

  // A11y: aria-label con texto entero + aria-hidden a los chars (que se
  // generan post-mount con animejs text.split). Screen readers leen el
  // aria-label, NO los <span> sueltos por carácter (Sprint 27 fix).
  const accessibleText = ariaLabel || flattenText(children).trim();

  return createElement(
    as as ElementType,
    {
      ref: setRefs,
      className,
      style,
      "aria-label": accessibleText || undefined,
    },
    // Wrap children en span aria-hidden para que screen readers ignoren
    // los chars individuales tras el text.split de animejs.
    createElement(
      "span",
      { "aria-hidden": "true" as const, style: { display: "contents" } },
      children,
    ),
  );
}

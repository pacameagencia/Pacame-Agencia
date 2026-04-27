"use client";

/**
 * PACAME — CursorRing custom (Sprint 25)
 *
 * Anillo 24px que sigue el cursor con spring lerp.
 * Expande a 64px sobre [data-cursor="hover"].
 * Solo desktop (>=1024px) + hover capable + no reduced-motion.
 *
 * Estilo Lusion / Igloo / Active Theory.
 *
 * Performance:
 *  - usa requestAnimationFrame con interpolación lineal (lerp)
 *  - transform-only (no layout)
 *  - mix-blend-mode difference para contraste sobre cualquier fondo
 */

import { useEffect, useRef } from "react";

export default function CursorRing() {
  const ringRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mqHover = window.matchMedia("(hover: hover)");
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!mqHover.matches || !mqDesktop.matches || mqReduced.matches) {
      return;
    }

    const ring = ringRef.current;
    if (!ring) return;

    ring.style.opacity = "0";

    const handleMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      if (ring.style.opacity === "0") ring.style.opacity = "1";
    };

    const handleLeave = () => {
      if (ring) ring.style.opacity = "0";
    };

    const handleEnter = () => {
      if (ring) ring.style.opacity = "1";
    };

    // Detect hover sobre [data-cursor="hover"] o links/buttons
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target?.closest) return;
      const interactive =
        target.closest('[data-cursor="hover"]') ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest('[role="button"]');
      const shouldHover = !!interactive;
      if (shouldHover !== isHoveringRef.current) {
        isHoveringRef.current = shouldHover;
        ring.classList.toggle("cursor-ring--hover", shouldHover);
      }
    };

    // Animation loop
    const tick = () => {
      const lerp = 0.18;
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * lerp;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * lerp;
      ring.style.transform = `translate(${currentRef.current.x}px, ${currentRef.current.y}px) translate(-50%, -50%)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
  }, []);

  return <div ref={ringRef} className="cursor-ring" aria-hidden="true" />;
}

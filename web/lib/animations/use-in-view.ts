/**
 * PACAME — useInView hook (Sprint 25)
 *
 * Wrapper de react-intersection-observer con defaults sensatos para
 * scroll-triggered animations.
 */

"use client";

import { useInView as useInViewBase } from "react-intersection-observer";

export interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

/**
 * Hook simplificado: devuelve `[ref, isInView]`.
 *
 * @example
 *   const [ref, inView] = useInView();
 *   <div ref={ref}>{inView && <Animated />}</div>
 */
export function useInView(options: UseInViewOptions = {}) {
  return useInViewBase({
    threshold: options.threshold ?? 0.2,
    rootMargin: options.rootMargin ?? "0px 0px -10% 0px",
    triggerOnce: options.triggerOnce ?? true,
    delay: options.delay,
  });
}

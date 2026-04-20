"use client";

/**
 * AnimatedSection + AnimatedItem — staggered scroll reveal premium.
 * Del skill pack 3d-scroll-website. Wraps Framer Motion con viewport once + spring.
 *
 * Usage:
 *   <AnimatedSection>
 *     <AnimatedItem><h2>Heading</h2></AnimatedItem>
 *     <AnimatedItem><p>Paragraph</p></AnimatedItem>
 *   </AnimatedSection>
 */

import { motion, type MotionProps } from "framer-motion";
import { listStagger, fadeUp, VIEWPORT } from "@/lib/design/motion/presets";
import type { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  /** Override el stagger delay (default 0.08s) */
  staggerDelay?: number;
  /** viewport margin override */
  margin?: string;
}

export function AnimatedSection({
  children,
  className,
  staggerDelay,
  margin,
}: AnimatedSectionProps) {
  const variants = staggerDelay
    ? {
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
        },
      }
    : listStagger;

  const viewport = margin ? { once: true, margin } : VIEWPORT.default;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps extends MotionProps {
  children: ReactNode;
  className?: string;
  /** Desactiva spring y usa easing simple (mas lightweight) */
  simple?: boolean;
}

export function AnimatedItem({
  children,
  className,
  simple,
  ...motionProps
}: AnimatedItemProps) {
  const variants = simple
    ? {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
        },
      }
    : fadeUp;

  return (
    <motion.div variants={variants} className={className} {...motionProps}>
      {children}
    </motion.div>
  );
}

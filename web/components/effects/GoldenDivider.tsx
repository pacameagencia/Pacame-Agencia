"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface GoldenDividerProps {
  variant?: "line" | "laurel" | "star";
  className?: string;
}

function LaurelMotif() {
  return (
    <svg width="32" height="16" viewBox="0 0 32 16" fill="none" className="flex-shrink-0">
      {/* Left laurel */}
      <path
        d="M12 8C10 4 7 2 4 1C5 3 5 6 6 8C5 6 3 5 1 5C3 7 4 9 6 10C4 10 2 11 0 13C3 12 6 11 8 10C10 12 12 13 14 14L16 8"
        fill="rgba(212, 168, 83, 0.6)"
      />
      {/* Right laurel (mirrored) */}
      <path
        d="M20 8C22 4 25 2 28 1C27 3 27 6 26 8C27 6 29 5 31 5C29 7 28 9 26 10C28 10 30 11 32 13C29 12 26 11 24 10C22 12 20 13 18 14L16 8"
        fill="rgba(212, 168, 83, 0.6)"
      />
    </svg>
  );
}

function StarMotif() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path
        d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
        fill="rgba(212, 168, 83, 0.5)"
      />
    </svg>
  );
}

export default function GoldenDivider({
  variant = "line",
  className = "",
}: GoldenDividerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reducedMotion = useReducedMotion();

  const lineVariant = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { scaleX: 1, opacity: 1 },
  };

  return (
    <div ref={ref} className={`flex items-center justify-center gap-3 ${className}`}>
      <motion.div
        className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent origin-left"
        initial={reducedMotion ? "visible" : "hidden"}
        animate={isInView ? "visible" : "hidden"}
        variants={lineVariant}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
      />

      {variant === "laurel" && (
        <motion.div
          initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <LaurelMotif />
        </motion.div>
      )}

      {variant === "star" && (
        <motion.div
          initial={reducedMotion ? { opacity: 1, rotate: 0 } : { opacity: 0, rotate: -90 }}
          animate={isInView ? { opacity: 1, rotate: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <StarMotif />
        </motion.div>
      )}

      <motion.div
        className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent origin-right"
        initial={reducedMotion ? "visible" : "hidden"}
        animate={isInView ? "visible" : "hidden"}
        variants={lineVariant}
        transition={{ duration: 1, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}

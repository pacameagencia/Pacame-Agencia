"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}

export default function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = "#7C3AED",
  trackColor = "rgba(255,255,255,0.06)",
  className = "",
}: ProgressRingProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reducedMotion = useReducedMotion();

  const [displayCount, setDisplayCount] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));

  useEffect(() => {
    if (!isInView) return;
    if (reducedMotion) {
      setDisplayCount(clampedPct);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(eased * clampedPct));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, clampedPct, reducedMotion]);

  const strokeDashoffset = circumference - (circumference * (isInView ? clampedPct : 0)) / 100;

  return (
    <div ref={ref} className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: reducedMotion ? strokeDashoffset : strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-heading font-bold text-2xl"
          style={{ color }}
        >
          {displayCount}%
        </span>
        <span className="text-[10px] text-pacame-white/40 font-body mt-0.5">completado</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  suffix?: string;
}

/**
 * Counter con easing cubic on mount/value change.
 * Usado para KPIs en dashboards — da sensacion de live, premium.
 */
export default function AnimatedNumber({
  value,
  duration = 700,
  format,
  className,
  suffix,
}: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    const to = value;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const rounded = Math.round(display);
  const out = format ? format(display) : rounded.toLocaleString("es-ES");
  return (
    <span className={className}>
      {out}
      {suffix}
    </span>
  );
}

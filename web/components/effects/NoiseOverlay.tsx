"use client";

import { useReducedMotion } from "framer-motion";

export default function NoiseOverlay() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[48]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: prefersReduced ? 0 : 0.015,
        mixBlendMode: "overlay",
      }}
    />
  );
}

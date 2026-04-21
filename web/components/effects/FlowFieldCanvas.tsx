"use client";

/**
 * FlowFieldCanvas — algorithmic flow field generative art.
 *
 * "Organic Turbulence" philosophy: chaos constrained by natural law.
 * Thousands of particles flowing through a Perlin-noise vector field,
 * their trails accumulating organic density. Masterfully tuned for the
 * PACAME editorial palette — ocean-blue particles on paper background,
 * slow velocity fades to deep navy, fast bursts to golden sand.
 *
 * Zero dependencies, runtime-only Canvas2D, SSR-safe.
 * Respects prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";

// Inline Perlin noise — 2D simplex-like based on improved Ken Perlin ref
// Avoids adding a p5.js dependency. Deterministic + seeded via Math.
function makeNoise(seed = 1337) {
  const p = new Uint8Array(512);
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  // Seeded Fisher–Yates
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(
      v,
      lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
      lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1)),
    );
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
}

interface Props {
  /** Seed — cambia = diferente aesthetic */
  seed?: number;
  /** Nro particulas (500 = subtle, 1500 = denso) */
  count?: number;
  /** Escala del flow field (0.002 = curvas largas, 0.008 = turbulento) */
  scale?: number;
  /** Velocidad animation (0.3 = hypnotic slow, 1 = alive) */
  speed?: number;
  /** Opacidad global del canvas */
  opacity?: number;
  className?: string;
}

export default function FlowFieldCanvas({
  seed = 1337,
  count = 900,
  scale = 0.004,
  speed = 0.6,
  opacity = 0.4,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Respect reduced motion — static single-frame render only
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const noise = makeNoise(seed);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener("resize", setSize);

    // Build particles
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0,
      vy: 0,
      age: Math.random() * 200,
      maxAge: 150 + Math.random() * 200,
    }));

    // Ocean → Gold color mapping by velocity
    // Low v → deep navy/ocean; high v → golden sand accents
    const colorByVel = (v: number) => {
      const t = Math.min(1, v / 3);
      if (t < 0.4) {
        // Ocean blue range
        const a = (0.08 + t * 0.3) * opacity;
        return `rgba(40, 114, 161, ${a})`;
      } else if (t < 0.75) {
        // Violet transition
        const a = (0.15 + (t - 0.4) * 0.5) * opacity;
        return `rgba(95, 74, 139, ${a})`;
      } else {
        // Golden sand accent
        const a = (0.3 + (t - 0.75) * 0.8) * opacity;
        return `rgba(241, 225, 148, ${a})`;
      }
    };

    let tick = 0;

    const step = () => {
      const r = canvas.getBoundingClientRect();
      // Subtle clear — accumulate trails for organic density, fade over time
      ctx.fillStyle = "rgba(10,10,10,0.04)"; // paper dark with very low alpha
      ctx.fillRect(0, 0, r.width, r.height);

      for (const p of particles) {
        const angle =
          noise(p.x * scale, p.y * scale + tick * 0.001) * Math.PI * 2.5;
        // Acceleration from noise angle
        p.vx += Math.cos(angle) * 0.05 * speed;
        p.vy += Math.sin(angle) * 0.05 * speed;
        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        p.age++;

        // Respawn if off-canvas or aged out
        if (
          p.age > p.maxAge ||
          p.x < -20 ||
          p.x > r.width + 20 ||
          p.y < -20 ||
          p.y > r.height + 20
        ) {
          p.x = Math.random() * r.width;
          p.y = Math.random() * r.height;
          p.vx = 0;
          p.vy = 0;
          p.age = 0;
          continue;
        }

        // Draw particle as 1px dot with velocity-based color
        const v = Math.hypot(p.vx, p.vy);
        ctx.fillStyle = colorByVel(v);
        ctx.fillRect(p.x, p.y, 1.2, 1.2);
      }

      tick++;
      if (!reduce) rafRef.current = requestAnimationFrame(step);
    };

    // Initial render
    step();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setSize);
    };
  }, [seed, count, scale, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}

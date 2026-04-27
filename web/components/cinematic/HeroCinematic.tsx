"use client";

/**
 * PACAME — HeroCinematic (Sprint 25)
 *
 * Hero scroll-driven Apple-grade.
 * Desktop: gradient mesh CSS animado + char split title + lenis subscribe
 *          (R3F mesh 3D opcional vía dynamic import — Sprint 26 si Pablo confirma).
 * Mobile/reduced-motion: gradient CSS estático + char split corto.
 *
 * Estética: Lusion drama + Anthropic minimalismo.
 * Paleta: tech-bg + tech-accent gradient + tech-accent-2 glow.
 *
 * NOTA: este reemplaza completamente al Hero.tsx legacy en /app/page.tsx.
 */

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import KineticHeading from "./KineticHeading";
import MagneticBox from "@/components/effects/MagneticBox";
import { useShouldAnimate } from "@/lib/animations/use-reduced-motion";
import { EASE_APPLE, EASE_LUSION } from "@/lib/animations/easings";

const STATS = [
  { value: "07", label: "Agentes IA" },
  { value: "120+", label: "Especialistas" },
  { value: "60%", label: "Más barato" },
  { value: "24h", label: "Respuesta" },
];

export default function HeroCinematic() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax sutil + fade out al scroll
  const meshY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const statsOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const { reduced } = useShouldAnimate();

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[100svh] overflow-hidden bg-tech-bg text-tech-text pt-24 pb-16 md:pt-32 md:pb-24"
    >
      {/* ── Gradient mesh background animado ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ y: reduced ? "0%" : meshY }}
      >
        {/* Mesh radial multi-layer (CSS only, sin canvas) */}
        <div className="absolute inset-0 bg-tech-mesh opacity-90" />
        {/* Aurora gradient orbiting */}
        <div
          className="absolute -top-1/4 left-1/2 h-[120vh] w-[120vw] -translate-x-1/2 opacity-40 mix-blend-screen blur-3xl animate-gradient-orbit"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, var(--tech-accent) 0deg, transparent 90deg, var(--tech-accent-2) 180deg, transparent 270deg, var(--tech-accent) 360deg)",
            backgroundSize: "200% 200%",
          }}
        />
        {/* Grid sutil */}
        <div className="absolute inset-0 bg-tech-grid opacity-[0.04]" style={{ backgroundSize: "48px 48px" }} />
        {/* Noise grain */}
        <div className="absolute inset-0 bg-tech-noise opacity-30 mix-blend-overlay" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/0 via-tech-bg/0 to-tech-bg" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ── Eyebrow ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_APPLE }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-tech-border bg-tech-surface/60 px-3 py-1.5 backdrop-blur-md"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tech-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tech-accent" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tech-text-soft">
            Agencia digital · Madrid · 2026
          </span>
        </motion.div>

        {/* ── Title kinetic ── */}
        <motion.div style={{ y: titleY, opacity: titleOpacity }}>
          <KineticHeading
            as="h1"
            className="font-sans font-semibold tracking-tight text-tech-text"
            style={{
              fontSize: "clamp(2.75rem, 9vw, 7.5rem)",
              lineHeight: "0.95",
              letterSpacing: "-0.04em",
            }}
          >
            <span className="block">Tu equipo digital.</span>
          </KineticHeading>

          <KineticHeading
            as="h2"
            delay={300}
            className="mt-1 font-sans font-light tracking-tight"
            style={{
              fontSize: "clamp(2.75rem, 9vw, 7.5rem)",
              lineHeight: "0.95",
              letterSpacing: "-0.04em",
              background:
                "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <span className="block">Resuelto hoy.</span>
          </KineticHeading>
        </motion.div>

        {/* ── Subhead ── */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE_APPLE }}
          className="mt-10 max-w-xl text-[17px] md:text-[19px] leading-relaxed text-tech-text-soft"
        >
          Siete agentes de inteligencia artificial especializados, supervisados
          por un humano. Calidad de agencia, velocidad de máquina, precio justo.
        </motion.p>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: EASE_APPLE }}
          className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center"
        >
          {/* CTA primario Sprint 27 — directo a conversion (auditoría gratis) */}
          <MagneticBox strength={0.18}>
            <Link
              href="/contacto?source=hero&type=audit"
              data-cursor="hover"
              aria-label="Reservar auditoría digital gratuita de 30 minutos"
              className="group relative inline-flex min-h-[56px] items-center justify-center gap-3 overflow-hidden rounded-full bg-tech-accent px-7 py-4 text-[15px] font-semibold text-tech-bg transition-all duration-300 hover:bg-tech-accent-soft hover:shadow-tech-glow focus:outline-none focus-visible:ring-4 focus-visible:ring-tech-accent-glow active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.2} />
              Auditoría digital gratis · 30 min
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
            </Link>
          </MagneticBox>

          <Link
            href="/servicios"
            data-cursor="hover"
            className="group inline-flex min-h-[44px] items-center gap-2 px-2 py-3 text-[15px] font-medium text-tech-text-soft underline decoration-tech-text-faint underline-offset-[6px] transition-colors hover:text-tech-text hover:decoration-tech-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40 rounded-md"
          >
            o ver servicios desde 300&nbsp;€
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>

        {/* ── Stats grid ── */}
        <motion.div
          style={{ opacity: statsOpacity }}
          className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-tech-border pt-10 md:mt-24 md:grid-cols-4"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 1.0 + i * 0.08,
                ease: EASE_LUSION,
              }}
              className="space-y-1"
            >
              <div className="font-sans text-4xl font-medium tabular-nums tracking-tight text-tech-text md:text-5xl">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        style={{ opacity: statsOpacity }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tech-text-mute">
          scroll
        </span>
        <div className="h-10 w-px animate-scroll-hint bg-gradient-to-b from-tech-text-mute via-tech-accent to-transparent" />
      </motion.div>
    </section>
  );
}

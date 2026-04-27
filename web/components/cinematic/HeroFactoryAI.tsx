"use client";

/**
 * PACAME — HeroFactoryAI (Sprint 28)
 *
 * Hero rediseñado con la identidad nueva: "Factoría de soluciones IA".
 * Posicionamiento: "Tu web en 48 horas, no en 6 meses."
 * Dos vías de compra explícitas above-the-fold:
 *   1. Self-service: prueba el Studio (scroll a #studio embed)
 *   2. Llamada con Pablo: link directo a /contacto?type=call
 *
 * Reemplaza HeroCinematic en home (mantiene ese para servicios/agentes/casos/contacto).
 */

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, Phone, Sparkles, Zap } from "lucide-react";
import KineticHeading from "./KineticHeading";
import MagneticBox from "@/components/effects/MagneticBox";
import { useShouldAnimate } from "@/lib/animations/use-reduced-motion";
import { EASE_APPLE, EASE_LUSION } from "@/lib/animations/easings";

const COMPARATIVE_STATS = [
  { value: "48h", label: "Entrega típica" },
  { value: "6 meses", label: "Otras agencias", strikethrough: true },
  { value: "0€", label: "Probar el Studio" },
  { value: "100%", label: "Supervisión Pablo" },
];

export default function HeroFactoryAI() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const meshY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { reduced } = useShouldAnimate();

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[100svh] overflow-hidden bg-tech-bg pb-16 pt-24 text-tech-text md:pb-24 md:pt-32"
    >
      {/* Gradient mesh background */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ y: reduced ? "0%" : meshY }}
      >
        <div className="absolute inset-0 bg-tech-mesh opacity-90" />
        <div
          className="absolute -top-1/4 left-1/2 h-[120vh] w-[120vw] -translate-x-1/2 opacity-40 mix-blend-screen blur-3xl animate-gradient-orbit"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, var(--tech-accent) 0deg, transparent 90deg, var(--tech-accent-2) 180deg, transparent 270deg, var(--tech-accent) 360deg)",
            backgroundSize: "200% 200%",
          }}
        />
        <div
          className="absolute inset-0 bg-tech-grid opacity-[0.04]"
          style={{ backgroundSize: "48px 48px" }}
        />
        <div className="absolute inset-0 bg-tech-noise opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/0 via-tech-bg/0 to-tech-bg" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Eyebrow */}
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
            Factoría IA · Madrid · 2026
          </span>
        </motion.div>

        {/* Title */}
        <motion.div style={{ y: titleY, opacity: titleOpacity }}>
          <KineticHeading
            as="h1"
            className="font-sans font-semibold tracking-tight text-tech-text"
            style={{
              fontSize: "clamp(2.75rem, 9vw, 7.5rem)",
              lineHeight: "0.95",
              letterSpacing: "-0.04em",
            }}
            ariaLabel="Tu web en 48 horas. No en 6 meses."
          >
            <span className="block">Tu web en 48 horas.</span>
          </KineticHeading>

          <KineticHeading
            as="div"
            delay={400}
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
            ariaLabel="No en 6 meses."
          >
            <span className="block">No en 6 meses.</span>
          </KineticHeading>
        </motion.div>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE_APPLE }}
          className="mt-10 max-w-2xl text-[17px] leading-relaxed text-tech-text-soft md:text-[20px]"
        >
          Somos una <strong className="font-medium text-tech-text">factoría de soluciones IA</strong>
          . Eliges el camino: pruebas tu web en 30&nbsp;segundos con nuestro Studio
          y la compras al instante, o hablas conmigo y la concretamos juntos.
        </motion.p>

        {/* Two-paths CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: EASE_APPLE }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl"
        >
          {/* Path A: Self-service Studio */}
          <MagneticBox strength={0.12}>
            <a
              href="#studio"
              data-cursor="hover"
              aria-label="Probar el Studio gratis ahora"
              className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-tech-accent/40 bg-tech-elevated p-6 transition-all duration-500 hover:border-tech-accent hover:shadow-tech-glow focus:outline-none focus-visible:ring-4 focus-visible:ring-tech-accent-glow"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-tech-accent/40 bg-tech-accent/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-tech-accent">
                  <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                  Camino A · Self-service
                </span>
                <Zap className="h-4 w-4 text-tech-accent" strokeWidth={2.2} />
              </div>
              <div
                className="font-sans text-[24px] font-semibold leading-tight tracking-tight text-tech-text md:text-[28px]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Pruébalo ahora
              </div>
              <p className="text-[14px] leading-relaxed text-tech-text-soft">
                Cuéntanos qué quieres en 1 frase. La IA te enseña un mockup real
                en 30&nbsp;s. Si te gusta, compras y en 48&nbsp;h la tienes.
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                  3 gratis al día
                </span>
                <ArrowDown className="h-4 w-4 text-tech-accent transition-transform duration-300 group-hover:translate-y-1" />
              </div>
            </a>
          </MagneticBox>

          {/* Path B: Call with Pablo */}
          <MagneticBox strength={0.12}>
            <Link
              href="/contacto?type=call&source=hero"
              data-cursor="hover"
              aria-label="Agendar llamada de 30 minutos con Pablo Calleja"
              className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-tech-border bg-tech-surface p-6 transition-all duration-500 hover:border-tech-text-faint hover:shadow-tech focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-tech-border bg-tech-bg px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-tech-text-soft">
                  <Phone className="h-3 w-3" strokeWidth={2.4} />
                  Camino B · Conversación
                </span>
                <Phone className="h-4 w-4 text-tech-text-soft" strokeWidth={1.8} />
              </div>
              <div
                className="font-sans text-[24px] font-semibold leading-tight tracking-tight text-tech-text md:text-[28px]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Hablar con Pablo
              </div>
              <p className="text-[14px] leading-relaxed text-tech-text-soft">
                30&nbsp;minutos directos conmigo. Te ayudo a concretar lo que
                necesitas y te paso presupuesto exacto en 24&nbsp;h. Sin
                compromiso.
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                  Lun-Vie 9-19h · &lt;2h respuesta
                </span>
                <ArrowDown className="h-4 w-4 -rotate-90 text-tech-text-soft transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          </MagneticBox>
        </motion.div>

        {/* Comparative stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.1, ease: EASE_LUSION }}
          className="mt-16 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-tech-border pt-8 md:grid-cols-4"
        >
          {COMPARATIVE_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 1.2 + i * 0.08,
                ease: EASE_APPLE,
              }}
              className="space-y-1"
            >
              <div
                className={`font-sans text-3xl font-medium tabular-nums tracking-tight md:text-4xl ${
                  stat.strikethrough
                    ? "text-tech-text-faint line-through decoration-tech-danger/60 decoration-2"
                    : "text-tech-text"
                }`}
              >
                {stat.value}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

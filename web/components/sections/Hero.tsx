"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * PACAME Hero — Spanish Modernism
 * Composición editorial: póster modernista + titular Fraunces + metadata estilo revista
 */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.08, ease: [0.7, 0, 0.3, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-paper overflow-hidden pt-32 pb-24">
      {/* Grid baseline sutil — solo como guía tipográfica editorial */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Composición geométrica fondo — sol modernista rotatorio */}
      <SunComposition />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* ── Banda superior editorial — metadatos revista ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex items-center justify-between mb-16 pb-6 border-b-2 border-ink"
        >
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">
              Nº 001
            </span>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
              Primavera 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-olive-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-olive-500" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink">
              En directo · Madrid
            </span>
          </div>
        </motion.div>

        {/* ── Titular principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="lg:col-span-8"
          >
            <span className="kicker block mb-8">Agencia digital · Est. 2026</span>

            <h1 className="font-display text-ink text-balance" style={{ fontSize: "clamp(3rem, 9vw, 8rem)", lineHeight: "0.92", letterSpacing: "-0.035em", fontWeight: 500 }}>
              <span className="block">Tu problema</span>
              <span className="block">
                digital,
              </span>
              <span className="block italic font-light" style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}>
                resuelto hoy.
              </span>
            </h1>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="lg:col-span-4 lg:pb-4"
          >
            <div className="font-sans text-ink-soft text-[17px] leading-relaxed max-w-sm">
              <p className="mb-4">
                Siete agentes de inteligencia artificial especializados, liderados por un humano de carne y hueso.
              </p>
              <p className="font-medium text-ink">
                Calidad de agencia. Velocidad de máquina. Precio justo.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Línea divisoria ornamental ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex items-center gap-4 mt-16 mb-12"
        >
          <div className="h-px flex-1 bg-ink/25" />
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-terracotta-500" aria-hidden="true">
            <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M16 4 L18 14 L28 16 L18 18 L16 28 L14 18 L4 16 L14 14 Z" fill="currentColor" />
          </svg>
          <div className="h-px flex-1 bg-ink/25" />
        </motion.div>

        {/* ── CTAs + Stats grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="lg:col-span-6 flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/servicios"
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-terracotta-500 text-paper font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-terracotta-600 rounded-sm"
              style={{ boxShadow: "5px 5px 0 #1A1813" }}
            >
              Ver servicios desde 300&nbsp;€
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            </Link>
            <Link
              href="/contacto"
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 border-2 border-ink text-ink font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-ink hover:text-paper rounded-sm"
            >
              Hablar con el equipo
            </Link>
          </motion.div>

          {/* Stats — estilo tabla editorial */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="lg:col-span-6 grid grid-cols-4 gap-0 border-l border-ink/20"
          >
            {[
              { value: "07", label: "Especialistas" },
              { value: "24", label: "Horas mín.", suffix: "h" },
              { value: "60", label: "Más barato", prefix: "−", suffix: "%" },
              { value: "100", label: "Supervisión humana", suffix: "%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-4 py-3 border-r border-ink/20 last:border-r-0"
              >
                <div className="font-display font-medium text-3xl text-ink tabular-nums leading-none mb-1">
                  {stat.prefix}{stat.value}<span className="text-terracotta-500 text-2xl">{stat.suffix}</span>
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-ink-mute">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Scroll prompt editorial ── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute">
          Sigue leyendo
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-ink-mute"
        />
      </motion.div>
    </section>
  );
}

/**
 * Composición geométrica: sol modernista rotatorio + arcos + patrón
 * Sustituye a GradientMeshCanvas + ConstellationBackground
 */
function SunComposition() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sol terracota — top right */}
      <svg
        className="absolute -top-32 -right-32 w-[600px] h-[600px] animate-sun-rotate opacity-70"
        viewBox="0 0 600 600"
        aria-hidden="true"
      >
        <circle cx="300" cy="300" r="120" fill="#B54E30" opacity="0.18" />
        <circle cx="300" cy="300" r="80" fill="#B54E30" opacity="0.35" />
        {/* Rays */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <line
              key={i}
              x1="300"
              y1="140"
              x2="300"
              y2="100"
              stroke="#B54E30"
              strokeWidth="3"
              opacity="0.35"
              transform={`rotate(${angle} 300 300)`}
            />
          );
        })}
      </svg>

      {/* Arcos mediterráneos — bottom left (índigo) */}
      <svg
        className="absolute bottom-[-80px] left-[-60px] w-[500px] h-[500px] opacity-30"
        viewBox="0 0 500 500"
        aria-hidden="true"
      >
        <path d="M50 450 L50 280 Q50 180 140 180 Q230 180 230 280 L230 450" fill="none" stroke="#283B70" strokeWidth="3" />
        <path d="M260 450 L260 320 Q260 240 340 240 Q420 240 420 320 L420 450" fill="none" stroke="#283B70" strokeWidth="3" />
      </svg>

      {/* Forma mostaza flotante — right middle */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-20 w-24 h-24 opacity-50"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100">
          <path d="M50 5 L65 35 L95 35 L72 55 L80 85 L50 68 L20 85 L28 55 L5 35 L35 35 Z" fill="#E8B730" />
        </svg>
      </motion.div>

      {/* Gradiente sutil hero */}
      <div className="absolute inset-0 bg-golden-hour opacity-40" />
    </div>
  );
}

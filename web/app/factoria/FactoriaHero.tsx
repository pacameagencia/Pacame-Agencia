"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.08, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function FactoriaHero() {
  return (
    <section className="relative min-h-screen bg-paper overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <FactoriaComposition />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Banda editorial superior */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex items-center justify-between mb-16 pb-6 border-b-2 border-ink"
        >
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">
              Cuaderno · Factoría
            </span>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
              Edición 2026 · v1
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta-500" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink">
              Cerebro · Vivo
            </span>
          </div>
        </motion.div>

        {/* Titular monumental */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="lg:col-span-9"
          >
            <span className="kicker block mb-8">Manifiesto · Producción industrial con IA</span>

            <h1
              className="font-display text-ink text-balance"
              style={{ fontSize: "clamp(3rem, 9vw, 8rem)", lineHeight: "0.92", letterSpacing: "-0.035em", fontWeight: 500 }}
            >
              <span className="block">Una factoría</span>
              <span className="block">de soluciones</span>
              <span
                className="block italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                con IA.
              </span>
            </h1>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="lg:col-span-3 lg:pb-4"
          >
            <div className="font-sans text-ink-soft text-[17px] leading-relaxed">
              <p className="mb-4">
                No vendemos horas. No vendemos PowerPoints. No reinventamos la rueda en cada cliente.
              </p>
              <p className="font-medium text-ink">
                Empaquetamos productos con agentes IA y los ejecutamos en línea de montaje.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Divisor ornamental */}
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
            <rect x="6" y="6" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 16 16)" />
            <circle cx="16" cy="16" r="3" fill="currentColor" />
          </svg>
          <div className="h-px flex-1 bg-ink/25" />
        </motion.div>

        {/* CTAs + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="lg:col-span-6 flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="#catalogo"
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-terracotta-500 text-paper font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-terracotta-600 rounded-sm"
              style={{ boxShadow: "5px 5px 0 #1A1813" }}
            >
              Ver el catálogo
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            </Link>
            <Link
              href="/contacto"
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 border-2 border-ink text-ink font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-ink hover:text-paper rounded-sm"
            >
              Encargar una solución
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="lg:col-span-6 grid grid-cols-4 gap-0 border-l border-ink/20"
          >
            {[
              { value: "10", label: "Agentes" },
              { value: "346", label: "Skills" },
              { value: "1.8", label: "Nodos", suffix: "k" },
              { value: "8", label: "APIs neurales" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3 border-r border-ink/20 last:border-r-0">
                <div className="font-display font-medium text-3xl text-ink tabular-nums leading-none mb-1">
                  {stat.value}
                  <span className="text-terracotta-500 text-2xl">{stat.suffix}</span>
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-ink-mute">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute">
          Las 3 capas
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

function FactoriaComposition() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Engranaje terracota gigante — top right */}
      <svg
        className="absolute -top-40 -right-40 w-[700px] h-[700px] animate-sun-rotate opacity-60"
        viewBox="0 0 700 700"
        aria-hidden="true"
        style={{ animationDuration: "120s" }}
      >
        <circle cx="350" cy="350" r="140" fill="#B54E30" opacity="0.15" />
        <circle cx="350" cy="350" r="100" fill="#B54E30" opacity="0.25" />
        <circle cx="350" cy="350" r="40" fill="#B54E30" opacity="0.5" />
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <rect
              key={i}
              x="345"
              y="180"
              width="10"
              height="50"
              fill="#B54E30"
              opacity="0.4"
              transform={`rotate(${angle} 350 350)`}
            />
          );
        })}
      </svg>

      {/* Cinta transportadora abstracta — bottom */}
      <svg
        className="absolute -bottom-20 -left-20 w-[600px] h-[400px] opacity-25"
        viewBox="0 0 600 400"
        aria-hidden="true"
      >
        <line x1="0" y1="200" x2="600" y2="200" stroke="#283B70" strokeWidth="2" />
        <line x1="0" y1="280" x2="600" y2="280" stroke="#283B70" strokeWidth="2" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={i * 50} y="195" width="40" height="90" fill="#283B70" opacity="0.15" stroke="#283B70" strokeWidth="1" />
        ))}
      </svg>

      {/* Nodos neuronales mostaza — float */}
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-32 w-32 h-32 opacity-50"
        aria-hidden="true"
      >
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="6" fill="#E8B730" />
          <circle cx="20" cy="30" r="4" fill="#E8B730" />
          <circle cx="100" cy="40" r="5" fill="#E8B730" />
          <circle cx="30" cy="100" r="4" fill="#E8B730" />
          <circle cx="95" cy="95" r="5" fill="#E8B730" />
          <line x1="60" y1="60" x2="20" y2="30" stroke="#E8B730" strokeWidth="1" opacity="0.6" />
          <line x1="60" y1="60" x2="100" y2="40" stroke="#E8B730" strokeWidth="1" opacity="0.6" />
          <line x1="60" y1="60" x2="30" y2="100" stroke="#E8B730" strokeWidth="1" opacity="0.6" />
          <line x1="60" y1="60" x2="95" y2="95" stroke="#E8B730" strokeWidth="1" opacity="0.6" />
        </svg>
      </motion.div>

      <div className="absolute inset-0 bg-hero-glow opacity-40" />
    </div>
  );
}

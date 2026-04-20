"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { agents } from "@/lib/data/agents";
import { TOTAL_AGENTS, divisions } from "@/lib/data/agency-constants";

// Mapeo color legacy → accent Spanish Modernism
const ACCENT_MAP: Record<string, string> = {
  nova: "#B54E30",      // terracota
  atlas: "#283B70",     // índigo
  nexus: "#CB6B47",     // terracota claro
  pixel: "#374A8C",     // índigo medio
  core: "#6B7535",      // oliva
  pulse: "#E8B730",     // mostaza
  sage: "#9C3E24",      // terracota oscuro
};

export default function AgentsSection() {
  return (
    <section className="relative section-padding bg-sand-100 overflow-hidden">
      {/* Pattern decorativo bottom-left */}
      <div
        className="absolute bottom-8 left-0 w-96 h-96 bg-azulejo opacity-30 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* ── Header portada de sección ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-indigo-600" aria-hidden="true">
                <circle cx="7" cy="7" r="6" fill="currentColor" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-indigo-600 font-medium">
                Capítulo II
              </span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <h2
              className="font-display text-ink text-balance"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 4rem)",
                lineHeight: "1.02",
                letterSpacing: "-0.03em",
                fontWeight: 500,
              }}
            >
              La redacción.
              <span
                className="block italic font-light"
                style={{
                  color: "#283B70",
                  fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
                }}
              >
                Siete agentes. Un editor jefe.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 lg:self-end">
            <p className="font-sans text-ink-soft text-[15px] leading-relaxed">
              {agents.length} especialistas principales + {TOTAL_AGENTS - agents.length} colaboradores en {divisions.length} divisiones.
              <span className="block mt-2 font-mono text-[11px] tracking-wide text-ink-mute uppercase">
                Dirigidos por Pablo Calleja.
              </span>
            </p>
          </div>
        </div>

        {/* ── Pablo — columna izquierda con retrato editorial ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div
              className="relative aspect-[4/5] overflow-hidden"
              style={{ boxShadow: "8px 8px 0 #1A1813" }}
            >
              <Image
                src="/redesign/agent-nova-portrait.png"
                alt="Retrato editorial del equipo PACAME"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <div className="absolute top-0 left-0 bg-ink text-paper px-4 py-2">
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase">
                  Editor jefe
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.7, 0, 0.3, 1] }}
            className="lg:col-span-7 lg:pt-12"
          >
            <span className="kicker block mb-6" style={{ color: "#B54E30" }}>
              Nº 00 · Dirección
            </span>
            <h3
              className="font-display text-ink mb-6"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                lineHeight: "1.02",
                letterSpacing: "-0.03em",
                fontWeight: 500,
              }}
            >
              Pablo Calleja
            </h3>
            <p
              className="font-display italic text-2xl text-terracotta-500 mb-6"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              Supervisa cada línea. Responde cada email.
            </p>
            <p className="font-sans text-ink-soft text-[17px] leading-relaxed max-w-lg mb-8">
              Los agentes de IA hacen el trabajo pesado. Pablo garantiza que cada entrega tenga
              criterio, intención y el estándar correcto. No hay piloto automático.
            </p>

            <Link
              href="/equipo"
              className="inline-flex items-center gap-3 font-sans font-medium text-ink hover:text-terracotta-500 transition-colors duration-300 link-editorial"
            >
              Leer la ficha completa del editor
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* ── Línea ornamental ── */}
        <div className="section-divider-ornament mb-8">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-indigo-600" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M12 4 L13.5 10.5 L20 12 L13.5 13.5 L12 20 L10.5 13.5 L4 12 L10.5 10.5 Z" fill="currentColor" />
          </svg>
        </div>

        {/* ── Grid de 7 agentes — formato ficha de colaborador ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-ink/20">
          {agents.map((agent, i) => {
            const accent = ACCENT_MAP[agent.id] ?? "#B54E30";
            const isLast = i === agents.length - 1;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: (i % 3) * 0.08,
                  ease: [0.7, 0, 0.3, 1],
                }}
                className={`group border-b border-ink/20 ${
                  i % 3 !== 0 ? "md:border-l" : ""
                } ${i % 2 === 0 && i % 3 === 1 ? "" : ""}`}
              >
                <Link
                  href="/equipo"
                  className="block p-8 h-full hover:bg-paper/60 transition-colors duration-500 relative"
                >
                  <span
                    className="absolute top-6 right-6 font-display italic opacity-25 group-hover:opacity-60 transition-opacity duration-500"
                    style={{
                      color: accent,
                      fontSize: "2.75rem",
                      fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
                      fontWeight: 300,
                      lineHeight: 1,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Símbolo de agente — estrella 8-puntas pequeña */}
                  <svg width="28" height="28" viewBox="0 0 28 28" className="mb-5" aria-hidden="true">
                    <circle cx="14" cy="14" r="13" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
                    <path
                      d="M14 4 L15.5 12.5 L24 14 L15.5 15.5 L14 24 L12.5 15.5 L4 14 L12.5 12.5 Z"
                      fill={accent}
                    />
                  </svg>

                  <span className="kicker block mb-2" style={{ color: accent }}>
                    {agent.role}
                  </span>

                  <h3
                    className="font-display font-medium text-3xl text-ink mb-1 group-hover:text-terracotta-500 transition-colors"
                    style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0, "opsz" 100' }}
                  >
                    {agent.name}
                  </h3>

                  <p
                    className="font-display italic text-base text-ink-mute mb-4"
                    style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 72' }}
                  >
                    {agent.mythTitle}
                  </p>

                  <p className="font-sans text-[14px] text-ink-soft leading-relaxed mb-5 line-clamp-3">
                    {agent.simpleDescription}
                  </p>

                  {/* Status dot + online */}
                  <div className="flex items-center gap-2 pt-3 border-t border-ink/10">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-olive-500 opacity-70" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-olive-500" />
                    </span>
                    <span className="font-mono text-[10px] tracking-widest uppercase text-ink-mute">
                      En servicio
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-ink-mute group-hover:text-terracotta-500 group-hover:rotate-45 transition-all duration-500" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── CTA inferior ── */}
        <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/equipo"
            className="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-ink text-paper font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-terracotta-600 rounded-sm"
            style={{ boxShadow: "5px 5px 0 #B54E30" }}
          >
            Conoce a todo el equipo
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </Link>
          <Link
            href="/servicios"
            className="group inline-flex items-center justify-center gap-3 link-editorial font-display text-xl italic text-ink"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
          >
            Ver servicios y precios
            <ArrowUpRight className="w-4 h-4 text-terracotta-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}

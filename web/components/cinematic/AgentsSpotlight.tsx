"use client";

/**
 * PACAME — AgentsSpotlight (Sprint 25)
 *
 * Showcase de los 7 agentes IA core PACAME.
 * Grid responsive: 2 col mobile, 3 col tablet, 4 col desktop.
 * Cards con retrato editorial generado, hover tilt sutil + glow accent.
 * Disclaimer prominente "personajes editoriales generados por IA".
 *
 * Estilo: Anthropic + Lusion. Fotos en B/N que vuelven a color al hover.
 */

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import KineticHeading from "./KineticHeading";
import { EASE_APPLE } from "@/lib/animations/easings";

interface AgentCard {
  id: string;
  name: string;
  role: string;
  tagline: string;
  accent: string;
}

const AGENTS: AgentCard[] = [
  {
    id: "nova",
    name: "Nova",
    role: "Brand & Identity",
    tagline: "Identidades que se recuerdan.",
    accent: "from-tech-accent to-tech-accent-soft",
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "SEO & Analytics",
    tagline: "Tráfico orgánico que convierte.",
    accent: "from-tech-info to-tech-accent-2",
  },
  {
    id: "nexus",
    name: "Nexus",
    role: "Paid Acquisition",
    tagline: "ROAS positivo desde la primera semana.",
    accent: "from-tech-accent to-tech-warning",
  },
  {
    id: "pixel",
    name: "Pixel",
    role: "Frontend & UI",
    tagline: "Interfaces precisas, performance impecable.",
    accent: "from-tech-accent-2 to-tech-info",
  },
  {
    id: "core",
    name: "Core",
    role: "Backend & Systems",
    tagline: "Arquitectura escalable, código sólido.",
    accent: "from-tech-success to-tech-info",
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "Social & Community",
    tagline: "Contenido vivo, comunidad activa.",
    accent: "from-tech-warning to-tech-accent",
  },
  {
    id: "sage",
    name: "Sage",
    role: "Strategy & Pricing",
    tagline: "Estrategia con cabeza, sin humo.",
    accent: "from-tech-accent-2 to-tech-accent",
  },
];

export default function AgentsSpotlight() {
  return (
    <section
      id="agents"
      className="relative overflow-hidden bg-tech-bg py-32 md:py-48 text-tech-text"
    >
      {/* Background mesh subtle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
      >
        <div className="absolute right-0 top-1/4 h-[40rem] w-[40rem] rounded-full bg-tech-accent-2/10 blur-[120px]" />
        <div className="absolute left-0 bottom-1/4 h-[30rem] w-[30rem] rounded-full bg-tech-accent/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ── Header ── */}
        <div className="mb-16 flex flex-col items-start gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
              <span className="h-px w-8 bg-tech-accent-2" />
              Capítulo 2 · La redacción
            </span>
            <KineticHeading
              as="h2"
              className="font-sans font-semibold tracking-tight text-tech-text"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 4rem)",
                lineHeight: "1.05",
                letterSpacing: "-0.035em",
              }}
            >
              <span className="block">Siete agentes IA.</span>
              <span
                className="block font-light"
                style={{
                  background:
                    "linear-gradient(120deg, var(--tech-accent-2) 0%, var(--tech-accent) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Un editor jefe humano.
              </span>
            </KineticHeading>
          </div>

          <p className="max-w-sm text-[15px] leading-relaxed text-tech-text-soft md:text-right">
            Cada agente domina su disciplina. Pablo Calleja revisa cada entrega.
            Velocidad de máquina, criterio humano.
          </p>
        </div>

        {/* ── Disclaimer IA ── */}
        <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-tech-warning/40 bg-tech-warning/5 px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 text-tech-warning" strokeWidth={2.2} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-warning">
            Personajes editoriales · Agentes IA generados
          </span>
        </div>

        {/* ── Grid agents ── */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AGENTS.map((agent, i) => (
            <motion.li
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.7,
                delay: (i % 4) * 0.08,
                ease: EASE_APPLE,
              }}
            >
              <Link
                href="/agentes"
                data-cursor="hover"
                aria-label={`Conocer al agente ${agent.name}, especialista en ${agent.role}`}
                className="group relative block overflow-hidden rounded-2xl border border-tech-border bg-tech-surface transition-all duration-500 hover:border-tech-accent/50 hover:shadow-tech-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
              >
                {/* Portrait */}
                <div className="relative aspect-[4/5] overflow-hidden bg-tech-elevated">
                  <Image
                    src={`/generated/optimized/agents/${agent.id}.webp`}
                    alt={`${agent.name} — ${agent.role}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover grayscale transition-all duration-700 group-hover:scale-[1.04] group-hover:grayscale-0"
                  />
                  {/* Top gradient mask para legibilidad badge */}
                  <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/40 via-transparent to-tech-bg/95" />
                  {/* Bottom accent glow on hover */}
                  <div
                    className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t opacity-0 transition-opacity duration-700 group-hover:opacity-60 ${agent.accent}`}
                  />

                  {/* Top: index + arrow */}
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text/70 backdrop-blur-sm">
                      0{i + 1} / 07
                    </span>
                    <span className="rounded-full border border-tech-text/20 bg-tech-bg/40 p-1.5 backdrop-blur-sm transition-all duration-300 group-hover:border-tech-accent group-hover:text-tech-accent">
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" />
                    </span>
                  </div>

                  {/* Bottom: name + role */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div
                      className="font-sans text-[28px] font-semibold leading-none tracking-tight text-tech-text"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {agent.name}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-tech-text-soft">
                      {agent.role}
                    </div>
                  </div>
                </div>

                {/* Tagline (debajo de la imagen) */}
                <div className="px-5 py-4 border-t border-tech-border-soft">
                  <p className="text-[13px] leading-relaxed text-tech-text-soft">
                    {agent.tagline}
                  </p>
                </div>
              </Link>
            </motion.li>
          ))}

          {/* Card 8: Pablo el editor jefe (humano) */}
          <motion.li
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: 0.32, ease: EASE_APPLE }}
          >
            <Link
              href="/equipo"
              data-cursor="hover"
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-tech-accent/30 bg-tech-elevated p-5 transition-all duration-500 hover:border-tech-accent hover:shadow-tech-glow"
            >
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-tech-accent/40 bg-tech-accent/5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-tech-accent">
                  <span className="h-1 w-1 rounded-full bg-tech-accent" />
                  Editor jefe humano
                </span>
                <h3 className="mt-6 font-sans text-[28px] font-semibold leading-none tracking-tight text-tech-text" style={{ letterSpacing: "-0.02em" }}>
                  Pablo Calleja
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-tech-text-soft">
                  CEO + Director editorial. Revisa cada línea, responde cada
                  email. Sin piloto automático.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tech-text-mute">
                  Conocer
                </span>
                <ArrowUpRight className="h-4 w-4 text-tech-accent transition-transform duration-300 group-hover:rotate-45" />
              </div>
            </Link>
          </motion.li>
        </ul>
      </div>
    </section>
  );
}

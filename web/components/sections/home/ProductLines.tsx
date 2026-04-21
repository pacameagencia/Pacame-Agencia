"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Calendar, Boxes } from "lucide-react";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

// 3 lineas de producto — Stripe pattern: cards equivalentes con accent distinto
// Paleta @design.deb strict — no mas purple/cyan AI-generic
const productLines = [
  {
    n: "N°04",
    title: "Marketplace",
    tagline: "24 productos digitales entregados en horas",
    bullet: "Logo 99€ · Landing 299€ · SEO 399€...",
    href: "/servicios",
    cta: "Explorar marketplace",
    Icon: ShoppingBag,
    accent: "#F1E194", // Golden Sand
    stat: "24",
    statLabel: "productos",
  },
  {
    n: "N°05",
    title: "Planes mensuales",
    tagline: "Tu equipo digital completo, sin contratar",
    bullet: "Start · Pro · Growth · Scale",
    href: "/planes",
    cta: "Ver planes",
    Icon: Calendar,
    accent: "#2872A1", // Ocean Blue
    stat: "4",
    statLabel: "tiers",
  },
  {
    n: "N°06",
    title: "Apps productizadas",
    tagline: "SaaS para agendar y cerrar leads 24/7",
    bullet: "Contact Forms · Agenda Pro",
    href: "/apps",
    cta: "Descubrir apps",
    Icon: Boxes,
    accent: "#00A19B", // Mint
    stat: "2",
    statLabel: "apps",
  },
];

export default function ProductLines() {
  return (
    <section className="section-padding bg-paper relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="mb-16 border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
            <span className="text-accent-gold">§ 004</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Tres lineas de producto</span>
          </div>
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 items-end">
            <h2 className="font-heading font-bold text-[clamp(2rem,5vw,4rem)] text-ink leading-[0.95] tracking-[-0.03em]">
              Compra una vez.{" "}
              <span className="font-accent italic font-normal text-accent-gold">
                Suscribete
              </span>
              . O ambos
              <span className="text-accent-burgundy">.</span>
            </h2>
            <p className="text-[17px] text-ink/55 font-body leading-[1.55] max-w-[42ch]">
              Flexibilidad maxima. Desde un logo puntual hasta tu equipo completo bajo
              demanda. <span className="text-ink font-medium">Cambia cuando quieras</span>,
              sin permanencia ni fees ocultos.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          staggerDelay={0.1}
        >
          {productLines.map((line) => (
            <StaggerItem key={line.title}>
              <CardTilt tiltMaxAngle={8} scale={1.02}>
                <CardTiltContent>
                  <Link
                    href={line.href}
                    className="group block rounded-3xl p-8 bg-paper-deep border border-ink/[0.06] hover:border-ink/[0.18] transition-all duration-500 relative overflow-hidden h-full card-golden-shine"
                    style={{
                      background: `linear-gradient(180deg, ${line.accent}10 0%, transparent 45%), rgba(22,22,23,0.96)`,
                    }}
                  >
                    {/* Chrono-label top */}
                    <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-6 text-[10px] font-mono uppercase tracking-[0.2em] text-ink/40">
                      <span>{line.n}</span>
                      <span style={{ color: line.accent }}>{line.statLabel}</span>
                    </div>

                    {/* Icon + stat */}
                    <div className="flex items-start justify-between mb-8">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${line.accent}18`,
                          border: `1px solid ${line.accent}38`,
                        }}
                      >
                        <line.Icon className="w-5 h-5" style={{ color: line.accent }} />
                      </div>
                      <div className="text-right">
                        <div className="font-heading font-black text-[44px] text-ink leading-none tabular-nums">
                          {line.stat}
                        </div>
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-2xl text-ink mb-2 tracking-[-0.015em]">
                      {line.title}
                    </h3>
                    <p className="text-[15px] text-ink/55 font-body mb-4 leading-relaxed">
                      {line.tagline}
                    </p>
                    <p className="text-[12px] text-ink/35 font-mono mb-10 tracking-wide">
                      {line.bullet}
                    </p>

                    {/* Editorial CTA — underline instead of arrow ghost */}
                    <div
                      className="inline-flex items-center gap-2 text-[14px] font-heading font-semibold border-b pb-1 group-hover:gap-3 transition-all duration-300"
                      style={{ color: line.accent, borderColor: `${line.accent}60` }}
                    >
                      {line.cta}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </CardTiltContent>
              </CardTilt>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

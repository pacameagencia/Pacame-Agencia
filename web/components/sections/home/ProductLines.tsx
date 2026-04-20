"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Calendar, Boxes } from "lucide-react";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

// 3 lineas de producto — Stripe pattern: cards equivalentes con accent distinto
const productLines = [
  {
    title: "Marketplace",
    tagline: "24 productos digitales entregados en horas",
    bullet: "Logo 99€ · Landing 299€ · SEO 399€...",
    href: "/servicios",
    cta: "Explorar marketplace",
    Icon: ShoppingBag,
    accent: "#D4A853",
    stat: "24",
    statLabel: "productos",
  },
  {
    title: "Planes mensuales",
    tagline: "Tu equipo digital completo, sin contratar",
    bullet: "Start · Pro · Growth · Scale",
    href: "/planes",
    cta: "Ver planes",
    Icon: Calendar,
    accent: "#7C3AED",
    stat: "4",
    statLabel: "tiers",
  },
  {
    title: "Apps productizadas",
    tagline: "SaaS para agendar y cerrar leads 24/7",
    bullet: "Contact Forms · Agenda Pro",
    href: "/apps",
    cta: "Descubrir apps",
    Icon: Boxes,
    accent: "#06B6D4",
    stat: "2",
    statLabel: "apps",
  },
];

export default function ProductLines() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-[12px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.22em]">
            Tres maneras de trabajar con nosotros
          </p>
          <h2 className="font-accent font-bold text-section text-pacame-white mb-5 text-balance">
            Compra una vez.{" "}
            <span className="gradient-text-gold">Suscribete. O ambos.</span>
          </h2>
          <p className="text-lg text-pacame-white/50 max-w-2xl mx-auto font-body">
            Flexibilidad maxima. Desde un logo puntual hasta tu equipo completo bajo demanda.
          </p>
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
                    className="group block rounded-3xl p-8 bg-dark-card border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 relative overflow-hidden h-full card-golden-shine"
                    style={{
                      background: `linear-gradient(180deg, ${line.accent}0A 0%, transparent 40%), #161617`,
                    }}
                  >
                    {/* Icon + stat */}
                    <div className="flex items-start justify-between mb-8">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${line.accent}15`,
                          border: `1px solid ${line.accent}30`,
                        }}
                      >
                        <line.Icon className="w-5 h-5" style={{ color: line.accent }} />
                      </div>
                      <div className="text-right">
                        <div className="font-heading font-bold text-3xl text-pacame-white leading-none">
                          {line.stat}
                        </div>
                        <div className="text-[10px] text-pacame-white/40 uppercase tracking-wider font-body mt-1">
                          {line.statLabel}
                        </div>
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-2xl text-pacame-white mb-2">
                      {line.title}
                    </h3>
                    <p className="text-sm text-pacame-white/55 font-body mb-4 leading-relaxed">
                      {line.tagline}
                    </p>
                    <p className="text-xs text-pacame-white/35 font-body mb-10">
                      {line.bullet}
                    </p>

                    <div
                      className="inline-flex items-center gap-1.5 text-sm font-heading font-semibold group-hover:translate-x-0.5 transition-transform duration-300"
                      style={{ color: line.accent }}
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

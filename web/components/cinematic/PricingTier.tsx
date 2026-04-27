"use client";

/**
 * PACAME — PricingTier (Sprint 25)
 *
 * Pricing cards limpios estilo Linear. Sin 3D tilt.
 * Mantiene anchoring competitivo "Mercado 5–25k€ vs PACAME 1.8k€".
 * Tier featured con border tech-accent + glow sutil.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import KineticHeading from "./KineticHeading";
import MagneticBox from "@/components/effects/MagneticBox";
import { EASE_APPLE } from "@/lib/animations/easings";

interface Tier {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Despega",
    price: "1.800 €",
    cadence: "pago único",
    description: "Para arrancar tu presencia digital de cero con calidad.",
    features: [
      "Web profesional 5–7 páginas",
      "Identidad visual básica",
      "SEO técnico inicial",
      "Google Business Profile",
      "Hosting + mantenimiento 6m",
    ],
    cta: "Reservar plan",
    href: "/checkout?plan=despega",
  },
  {
    name: "Escala",
    price: "3.500 €",
    cadence: "pago único + 250 €/mes",
    description: "Crecimiento digital sostenido. El más elegido.",
    features: [
      "Todo lo de Despega +",
      "SEO contenido mensual",
      "Redes sociales gestionadas",
      "Email marketing",
      "Reporting + reuniones mensuales",
    ],
    cta: "Reservar plan",
    href: "/checkout?plan=escala",
    featured: true,
  },
  {
    name: "Domina",
    price: "8.000 €",
    cadence: "pago único + 750 €/mes",
    description: "Transformación digital total con equipo dedicado.",
    features: [
      "Todo lo de Escala +",
      "Publicidad Meta + Google Ads",
      "Marketing automation",
      "Customer success dedicado",
      "Estrategia trimestral",
    ],
    cta: "Hablar con ventas",
    href: "/contacto?plan=domina",
  },
];

export default function PricingTier() {
  return (
    <section
      id="pricing"
      className="relative bg-tech-bg py-32 md:py-48 text-tech-text"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* ── Header ── */}
        <div className="mb-12 max-w-3xl text-center md:mx-auto md:mb-16 md:text-center">
          <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            <span className="h-px w-8 bg-tech-accent" />
            Capítulo 4 · Planes
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
            <span className="block">Precios claros.</span>
            <span
              className="block font-light"
              style={{
                background:
                  "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Sin sorpresas.
            </span>
          </KineticHeading>
          <p className="mt-6 text-[16px] leading-relaxed text-tech-text-soft md:text-[18px]">
            Combina servicios y ahorra. O elige solo lo que necesitas.
          </p>

          {/* Anchoring competitivo */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-tech-border bg-tech-surface/60 px-5 py-2.5 backdrop-blur-md">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
              Mercado
            </span>
            <span className="h-3 w-px bg-tech-border" />
            <span className="text-[14px] text-tech-text-soft">
              Agencia tradicional:{" "}
              <strong className="text-tech-text">5.000 € – 25.000 €</strong>
            </span>
            <span className="h-3 w-px bg-tech-border" />
            <span className="text-[14px] font-medium text-tech-accent">
              PACAME desde 1.800 €
            </span>
          </div>
        </div>

        {/* ── Tiers grid ── */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_APPLE }}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-500 ${
                tier.featured
                  ? "border-tech-accent/40 bg-tech-elevated shadow-tech-glow md:scale-[1.03]"
                  : "border-tech-border bg-tech-surface hover:border-tech-text-faint"
              }`}
            >
              {/* Featured badge */}
              {tier.featured && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-tech-accent/40 bg-tech-accent/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-tech-accent">
                  <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                  Más elegido
                </span>
              )}

              {/* Tier name */}
              <h3 className="font-sans text-[14px] font-medium uppercase tracking-[0.18em] text-tech-text-soft">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mt-4">
                <div
                  className="font-sans text-5xl font-semibold leading-none tabular-nums tracking-tight text-tech-text md:text-6xl"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {tier.price}
                </div>
                {tier.cadence && (
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-tech-text-mute">
                    {tier.cadence}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="mt-5 text-[14px] leading-relaxed text-tech-text-soft">
                {tier.description}
              </p>

              {/* Features */}
              <ul className="my-7 space-y-3 border-t border-tech-border-soft pt-7">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[14px] text-tech-text-soft"
                  >
                    <Check
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        tier.featured ? "text-tech-accent" : "text-tech-success"
                      }`}
                      strokeWidth={2.2}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                {tier.featured ? (
                  <MagneticBox strength={0.15}>
                    <Link
                      href={tier.href}
                      data-cursor="hover"
                      className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-full bg-tech-accent px-6 py-3 text-[14px] font-semibold text-tech-bg transition-all duration-300 hover:bg-tech-accent-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-tech-accent-glow active:scale-[0.98]"
                    >
                      {tier.cta}
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-45" />
                    </Link>
                  </MagneticBox>
                ) : (
                  <Link
                    href={tier.href}
                    data-cursor="hover"
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-full border border-tech-border bg-tech-bg px-6 py-3 text-[14px] font-medium text-tech-text transition-all duration-300 hover:border-tech-accent hover:text-tech-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
                  >
                    {tier.cta}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-45" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-[13px] text-tech-text-mute">
          Todos los planes incluyen IVA. Sin permanencia. Cancelas cuando
          quieras.
        </p>
      </div>
    </section>
  );
}

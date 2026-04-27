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
  /** Slug interno (Stripe lookup) */
  slug: string;
  /** Nombre comercial Sprint 27 — outcome-focused */
  name: string;
  /** Para quién es (1 línea bajo nombre) */
  forWho: string;
  /** Setup price */
  price: string;
  /** Mes recurring */
  monthly?: string;
  /** Total año 1 transparente (suma de setup + 12 meses) */
  totalYear1: string;
  /** Description larga */
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  /** Etiqueta de behavioral anchor */
  badge?: string;
}

const TIERS: Tier[] = [
  {
    slug: "starter",
    name: "Starter",
    forWho: "Freelancers y micro-PYMEs (<500k€/año)",
    price: "1.800 €",
    monthly: "150 €/mes",
    totalYear1: "Año 1: 3.600 €",
    description:
      "Arranca tu presencia digital con calidad y cero curva técnica.",
    features: [
      "Web profesional 5–7 páginas (Next.js)",
      "Identidad visual básica (logo + paleta)",
      "SEO técnico on-page + Google Business",
      "Hosting + mantenimiento 12 meses",
      "1 campaña digital al mes",
    ],
    cta: "Empezar con Starter",
    href: "/contacto?plan=starter&source=pricing",
  },
  {
    slug: "growth",
    name: "Growth",
    forWho: "PYMEs en crecimiento (2–20M€/año)",
    price: "3.500 €",
    monthly: "350 €/mes",
    totalYear1: "Año 1: 7.700 €",
    description: "Crecimiento sostenido con equipo multidisciplinar.",
    features: [
      "Todo lo de Starter +",
      "SEO contenido mensual + link building",
      "Redes sociales gestionadas (4 publicaciones/sem)",
      "Email marketing + automation básica",
      "Google/Meta Ads (presupuesto aparte)",
      "Reporting + 2 reuniones estratégicas/mes",
    ],
    cta: "Empezar con Growth",
    href: "/contacto?plan=growth&source=pricing",
    featured: true,
    badge: "Más elegido",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    forWho: "Empresas escalando (>20M€/año o tracción rápida)",
    price: "8.000 €",
    monthly: "800 €/mes",
    totalYear1: "Año 1: 17.600 €",
    description: "Transformación digital integral con equipo dedicado.",
    features: [
      "Todo lo de Growth +",
      "Growth hacking + experimentos A/B",
      "Marketing automation avanzada (HubSpot/Customer.io)",
      "Customer success dedicado",
      "Analytics dashboard custom",
      "Estrategia trimestral con CEO",
    ],
    cta: "Hablar con ventas",
    href: "/contacto?plan=enterprise&source=pricing",
    badge: "Custom scope",
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
              {/* Custom badge */}
              {tier.badge && (
                <span className={`absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] ${
                  tier.featured
                    ? "border-tech-accent/40 bg-tech-accent/10 text-tech-accent"
                    : "border-tech-text-mute/30 bg-tech-elevated text-tech-text-soft"
                }`}>
                  {tier.featured && <Sparkles className="h-3 w-3" strokeWidth={2.4} />}
                  {tier.badge}
                </span>
              )}

              {/* Tier name */}
              <h3 className="font-sans text-[14px] font-medium uppercase tracking-[0.18em] text-tech-text-soft">
                {tier.name}
              </h3>

              {/* For who */}
              <p className="mt-1.5 text-[12px] text-tech-text-mute leading-snug">
                {tier.forWho}
              </p>

              {/* Price */}
              <div className="mt-5 border-t border-tech-border-soft pt-5">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-sans text-5xl font-semibold leading-none tabular-nums tracking-tight text-tech-text md:text-6xl"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    {tier.price}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-tech-text-mute">
                    setup
                  </span>
                </div>
                {tier.monthly && (
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-tech-text-mute text-[15px]">+</span>
                    <span className="font-sans text-2xl font-medium tabular-nums text-tech-text-soft">
                      {tier.monthly}
                    </span>
                  </div>
                )}
                {/* Total año 1 transparente — Sprint 27 trust */}
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-tech-border-soft bg-tech-bg px-3 py-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-tech-text-mute">
                    Total
                  </span>
                  <span className="font-sans text-[12px] font-semibold text-tech-text">
                    {tier.totalYear1}
                  </span>
                </div>
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

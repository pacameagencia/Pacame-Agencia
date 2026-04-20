"use client";

import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/scroll-reveal";

// 4 planes tier — hardcoded fallback con precios reales PACAME
// Corresponden a subscription_plans (Start/Pro/Growth/Scale)
const plans = [
  {
    tier: "Start",
    name: "Start",
    tagline: "Para autonomos y side-projects",
    price: 29,
    highlights: [
      "Web basica + hosting",
      "4 posts RRSS / mes",
      "SEO setup inicial",
      "Soporte email",
    ],
    slug: "start",
    featured: false,
  },
  {
    tier: "Pro",
    name: "Pro",
    tagline: "PYME en crecimiento digital",
    price: 149,
    highlights: [
      "Web + blog + 2 landings",
      "12 posts RRSS / mes",
      "SEO on-page + links",
      "1 app incluida",
    ],
    slug: "pro",
    featured: true,
  },
  {
    tier: "Growth",
    name: "Growth",
    tagline: "Multicanal con Ads activos",
    price: 399,
    highlights: [
      "Web + e-commerce",
      "20 posts + reels",
      "SEO + Ads gestionados",
      "2 apps incluidas",
    ],
    slug: "growth",
    featured: false,
  },
  {
    tier: "Scale",
    name: "Scale",
    tagline: "Equipo digital full-stack",
    price: 999,
    highlights: [
      "Todo ilimitado",
      "8h / mes con Pablo",
      "Apps + integraciones",
      "Soporte prioritario",
    ],
    slug: "scale",
    featured: false,
  },
];

export default function PricingPreview() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-14">
          <p className="text-[12px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.22em]">
            Planes mensuales
          </p>
          <h2 className="font-accent font-bold text-section text-pacame-white mb-5 text-balance">
            Un solo precio.{" "}
            <span className="gradient-text-gold">Todo tu equipo digital.</span>
          </h2>
          <p className="text-lg text-pacame-white/50 max-w-xl mx-auto font-body">
            Sin permanencia. Cambia de plan cuando quieras. Garantia 7 dias.
          </p>
        </ScrollReveal>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10"
        >
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`relative rounded-2xl p-6 flex flex-col transition ${
                plan.featured
                  ? "bg-gradient-to-br from-olympus-gold/[0.08] to-transparent border-2 border-olympus-gold/40 shadow-[0_0_50px_-20px_rgba(212,168,83,0.4)]"
                  : "bg-dark-card border border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-olympus-gold text-pacame-black text-[10px] font-heading font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  MOST POPULAR
                </div>
              )}

              <div className="mb-4">
                <div className="text-[11px] font-body font-semibold uppercase tracking-wider text-olympus-gold mb-1">
                  {plan.tier}
                </div>
                <h3 className="font-heading font-bold text-xl text-pacame-white">
                  {plan.name}
                </h3>
                <p className="text-pacame-white/45 font-body text-xs mt-1.5">
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-bold text-4xl text-pacame-white">
                    {plan.price}€
                  </span>
                  <span className="text-pacame-white/50 font-body text-sm">
                    /mes
                  </span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 text-sm font-body text-pacame-white/70"
                  >
                    <Check className="w-4 h-4 text-olympus-gold mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/planes"
                className={`w-full py-2.5 rounded-xl font-heading font-semibold text-sm text-center transition inline-flex items-center justify-center gap-2 ${
                  plan.featured
                    ? "bg-olympus-gold hover:bg-olympus-gold/90 text-pacame-black"
                    : "bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-pacame-white"
                }`}
              >
                Empezar {plan.tier}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </motion.div>

        <div className="text-center">
          <Link
            href="/planes"
            className="inline-flex items-center gap-1.5 text-sm font-body text-olympus-gold hover:text-olympus-gold-light transition-colors underline underline-offset-4 decoration-olympus-gold/30 hover:decoration-olympus-gold"
          >
            Ver comparativa detallada de planes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

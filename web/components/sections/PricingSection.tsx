"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import CheckoutButton from "@/components/CheckoutButton";
import { packages } from "@/lib/data/services";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

// Map package IDs to starting prices for checkout
const packagePrices: Record<string, { amount: number; product: string; description: string }> = {
  despega: { amount: 1800, product: "custom", description: "Paquete Despega — Presencia digital desde cero" },
  escala: { amount: 3500, product: "custom", description: "Paquete Escala — Crecimiento digital completo" },
  domina: { amount: 8000, product: "custom", description: "Paquete Domina — Transformacion digital total" },
};

export default function PricingSection() {
  return (
    <section className="section-padding bg-paper relative" id="paquetes">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="laurel" />
      </div>

      {/* Olympus radial glow centered on featured card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-olympus-radial pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.2em]">
            Paquetes
          </p>
          <h2 className="font-accent font-bold text-section text-ink mb-6 text-balance">
            Precios claros.{" "}
            <span className="gradient-text-gold">Sin sorpresas.</span>
          </h2>
          <p className="text-lg text-ink/65 max-w-lg mx-auto font-body mb-8">
            Combina servicios y ahorra. O elige solo lo que necesitas.
          </p>

          {/* Anchoring competitivo — Sprint 23 CRO fix */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 border border-ink/10 bg-sand-50 rounded-sm max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">
              Mercado
            </span>
            <span className="h-3 w-px bg-ink/15" />
            <span className="text-[14px] font-sans text-ink/75">
              Agencia tradicional: <strong className="text-ink">5.000 € – 25.000 €</strong>
            </span>
            <span className="h-3 w-px bg-ink/15" />
            <span className="text-[14px] font-display italic text-terracotta-600" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}>
              PACAME desde 1.800 €
            </span>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12" staggerDelay={0.1}>
          {packages.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <CardTilt tiltMaxAngle={pkg.featured ? 6 : 8} scale={1.02}>
              <CardTiltContent>
              <motion.div
                className={`relative rounded-2xl p-8 h-full flex flex-col overflow-hidden ${
                  pkg.featured
                    ? "glow-border border border-olympus-gold/30"
                    : "bg-dark-card border border-white/[0.06] hover:border-olympus-gold/15 transition-colors duration-500"
                }`}
                style={pkg.featured ? {
                  background: "linear-gradient(135deg, #B54E30 0%, #E8B730 50%, #283B70 100%)",
                } : {}}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Featured: golden aura behind */}
                {pkg.featured && (
                  <div className="absolute inset-0 bg-black/20" />
                )}

                {pkg.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex items-center gap-2 bg-olympus-gold rounded-full px-4 py-1.5 shadow-glow-gold">
                      {/* Laurel SVG */}
                      <svg width="12" height="10" viewBox="0 0 16 12" fill="none" className="opacity-80">
                        <path d="M8 6C6 2 4 1 2 0.5C3 2 3 4 3.5 6C3 4 1.5 3 0 3C1.5 5 2.5 7 4 8C2.5 8 1 9 0 10.5C2 9.5 4 9 5.5 8C6.5 10 8 11 9 11.5L8 6Z" fill="#1a1a1a" />
                      </svg>
                      <span className="text-xs font-body font-bold text-pacame-black uppercase tracking-wider">
                        Mas popular
                      </span>
                      <svg width="12" height="10" viewBox="0 0 16 12" fill="none" className="opacity-80 scale-x-[-1]">
                        <path d="M8 6C6 2 4 1 2 0.5C3 2 3 4 3.5 6C3 4 1.5 3 0 3C1.5 5 2.5 7 4 8C2.5 8 1 9 0 10.5C2 9.5 4 9 5.5 8C6.5 10 8 11 9 11.5L8 6Z" fill="#1a1a1a" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="relative z-[1] flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-8">
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-xs font-body font-medium mb-4 ${
                        pkg.featured ? "bg-white/20 text-white" : ""
                      }`}
                      style={!pkg.featured ? { backgroundColor: `${pkg.color}10`, color: pkg.color } : {}}
                    >
                      {pkg.subtitle}
                    </div>
                    <h3
                      className={`font-heading font-bold text-2xl mb-1 ${
                        pkg.featured ? "text-white" : "text-ink"
                      }`}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={`text-sm font-body leading-relaxed mb-5 ${
                        pkg.featured ? "text-white/70" : "text-ink/65"
                      }`}
                    >
                      {pkg.target}
                    </p>
                    <div
                      className={`font-heading font-bold text-4xl tracking-tight ${
                        pkg.featured ? "text-white" : "text-ink"
                      }`}
                    >
                      {pkg.price}
                    </div>
                    <p
                      className={`text-xs font-body mt-1.5 ${
                        pkg.featured ? "text-white/50" : "text-ink/60"
                      }`}
                    >
                      {pkg.deadline}
                    </p>
                  </div>

                  {/* Includes */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            pkg.featured ? "text-olympus-gold-light" : "text-olympus-gold/50"
                          }`}
                        />
                        <span
                          className={`text-sm font-body ${
                            pkg.featured ? "text-white/85" : "text-ink/70"
                          }`}
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Savings */}
                  <div
                    className={`text-xs font-body font-medium text-center py-2.5 rounded-xl mb-6 ${
                      pkg.featured ? "bg-white/15 text-white" : ""
                    }`}
                    style={!pkg.featured ? { backgroundColor: `${pkg.color}08`, color: pkg.color } : {}}
                  >
                    {pkg.savings} vs servicios individuales
                  </div>

                  {/* Primary: Buy Now */}
                  <CheckoutButton
                    product={packagePrices[pkg.id]?.product || "custom"}
                    amount={packagePrices[pkg.id]?.amount || 1800}
                    label={`Empezar desde ${(packagePrices[pkg.id]?.amount || 1800).toLocaleString("es-ES")}\u00A0\u20AC`}
                    description={packagePrices[pkg.id]?.description || pkg.name}
                    variant={pkg.featured ? "secondary" : "outline"}
                    size="lg"
                    className={`w-full ${
                      pkg.featured
                        ? "bg-white text-pacame-black hover:bg-white/90"
                        : "border-olympus-gold/20 hover:border-olympus-gold/40 hover:bg-olympus-gold/5"
                    }`}
                  />
                  {/* Secondary: Talk first */}
                  <Link
                    href="/contacto"
                    className={`block text-center text-xs font-body mt-3 transition-colors ${
                      pkg.featured ? "text-white/40 hover:text-white/60" : "text-ink/60 hover:text-ink/70"
                    }`}
                  >
                    o hablar primero sin compromiso
                  </Link>
                </div>
              </motion.div>
              </CardTiltContent>
              </CardTilt>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal>
          <p className="text-center text-sm text-ink/60 font-body">
            Necesitas algo distinto?{" "}
            <Link href="/contacto" className="text-olympus-gold hover:text-olympus-gold-light transition-colors underline underline-offset-4 decoration-olympus-gold/30">
              Hablamos y te preparamos un presupuesto a medida
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

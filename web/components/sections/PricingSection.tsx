"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CheckoutButton from "@/components/CheckoutButton";
import { packages } from "@/lib/data/services";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

// Map package IDs to starting prices for checkout
const packagePrices: Record<string, { amount: number; product: string; description: string }> = {
  despega: { amount: 1800, product: "custom", description: "Paquete Despega — Presencia digital desde cero" },
  escala: { amount: 3500, product: "custom", description: "Paquete Escala — Crecimiento digital completo" },
  domina: { amount: 8000, product: "custom", description: "Paquete Domina — Transformacion digital total" },
};

export default function PricingSection() {
  return (
    <section className="section-padding bg-[#0A0A0A] relative" id="paquetes">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
            Paquetes
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
            Precios claros.{" "}
            <span className="gradient-text-vivid">Sin sorpresas.</span>
          </h2>
          <p className="text-lg text-pacame-white/40 max-w-lg mx-auto font-body">
            Combina servicios y ahorra. O elige solo lo que necesitas.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12" staggerDelay={0.1}>
          {packages.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <motion.div
                className={`relative rounded-2xl p-8 h-full flex flex-col ${
                  pkg.featured
                    ? "bg-brand-gradient"
                    : "bg-dark-card border border-white/[0.06]"
                }`}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {pkg.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-pacame-white rounded-full px-4 py-1.5 shadow-apple">
                      <span className="text-xs font-body font-semibold text-pacame-black uppercase tracking-wider">
                        Mas popular
                      </span>
                    </div>
                  </div>
                )}

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
                      pkg.featured ? "text-white" : "text-pacame-white"
                    }`}
                  >
                    {pkg.name}
                  </h3>
                  <p
                    className={`text-sm font-body leading-relaxed mb-5 ${
                      pkg.featured ? "text-white/70" : "text-pacame-white/40"
                    }`}
                  >
                    {pkg.target}
                  </p>
                  <div
                    className={`font-heading font-bold text-4xl tracking-tight ${
                      pkg.featured ? "text-white" : "text-pacame-white"
                    }`}
                  >
                    {pkg.price}
                  </div>
                  <p
                    className={`text-xs font-body mt-1.5 ${
                      pkg.featured ? "text-white/50" : "text-pacame-white/30"
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
                          pkg.featured ? "text-white/80" : "text-pacame-white/30"
                        }`}
                      />
                      <span
                        className={`text-sm font-body ${
                          pkg.featured ? "text-white/85" : "text-pacame-white/55"
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
                      : "border-white/[0.08] hover:border-white/20"
                  }`}
                />
                {/* Secondary: Talk first */}
                <Link
                  href="/contacto"
                  className={`block text-center text-xs font-body mt-3 transition-colors ${
                    pkg.featured ? "text-white/40 hover:text-white/60" : "text-pacame-white/30 hover:text-pacame-white/50"
                  }`}
                >
                  o hablar primero sin compromiso
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal>
          <p className="text-center text-sm text-pacame-white/30 font-body">
            Necesitas algo distinto?{" "}
            <Link href="/contacto" className="text-electric-violet hover:text-electric-violet/80 transition-colors underline underline-offset-4 decoration-electric-violet/30">
              Hablamos y te preparamos un presupuesto a medida
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

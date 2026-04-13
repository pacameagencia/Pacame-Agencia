"use client";

import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { packages } from "@/lib/data/services";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

export default function PricingSection() {
  return (
    <section className="section-padding bg-pacame-black relative" id="paquetes">
      <div className="absolute inset-0 bg-dots opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-16">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Paquetes
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            Precios claros.
            <br />
            <span className="gradient-text-vivid">Sin sorpresas en la factura.</span>
          </h2>
          <p className="text-lg text-pacame-white/60 max-w-xl mx-auto font-body">
            Combina servicios y ahorra. O elige solo lo que necesitas.
            En cualquier caso, siempre sabras exactamente lo que pagas.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" staggerDelay={0.1}>
          {packages.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <motion.div
                className={`relative rounded-2xl p-7 h-full ${
                  pkg.featured
                    ? "bg-brand-gradient shadow-glow-violet"
                    : "card-interactive card-shine"
                }`}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {pkg.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <motion.div
                      className="flex items-center gap-1.5 bg-pacame-white rounded-full px-4 py-1.5 shadow-lg"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Zap className="w-3 h-3 fill-pacame-black text-pacame-black" />
                      <span className="text-xs font-bold font-body text-pacame-black uppercase tracking-wide">
                        Mas popular
                      </span>
                    </motion.div>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-body font-medium mb-3 ${
                      pkg.featured ? "bg-white/20 text-white" : "text-pacame-white"
                    }`}
                    style={!pkg.featured ? { backgroundColor: `${pkg.color}20`, color: pkg.color } : {}}
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
                    className={`text-sm font-body leading-relaxed mb-4 ${
                      pkg.featured ? "text-white/80" : "text-pacame-white/60"
                    }`}
                  >
                    {pkg.target}
                  </p>
                  <div
                    className={`font-heading font-bold text-3xl ${
                      pkg.featured ? "text-white" : "text-pacame-white"
                    }`}
                  >
                    {pkg.price}
                  </div>
                  <p
                    className={`text-xs font-body mt-1 ${
                      pkg.featured ? "text-white/60" : "text-pacame-white/40"
                    }`}
                  >
                    {pkg.deadline}
                  </p>
                </div>

                {/* Includes */}
                <ul className="space-y-3 mb-7">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          pkg.featured ? "bg-white/20" : ""
                        }`}
                        style={!pkg.featured ? { backgroundColor: `${pkg.color}20` } : {}}
                      >
                        <Check
                          className="w-3 h-3"
                          style={!pkg.featured ? { color: pkg.color } : { color: "white" }}
                        />
                      </div>
                      <span
                        className={`text-sm font-body ${
                          pkg.featured ? "text-white/90" : "text-pacame-white/70"
                        }`}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Savings badge */}
                <div
                  className={`text-xs font-body font-medium text-center py-2 rounded-xl mb-5 ${
                    pkg.featured ? "bg-white/15 text-white" : "text-pacame-white"
                  }`}
                  style={!pkg.featured ? { backgroundColor: `${pkg.color}15`, color: pkg.color } : {}}
                >
                  {pkg.savings} vs servicios individuales
                </div>

                <Button
                  variant={pkg.featured ? "secondary" : "outline"}
                  size="lg"
                  className={`w-full group ${
                    pkg.featured
                      ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                      : "border-white/10 hover:border-electric-violet/40"
                  }`}
                  asChild
                >
                  <Link href="/contacto">
                    Empezar con {pkg.name}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal>
          <p className="text-center text-sm text-pacame-white/40 font-body">
            Necesitas algo distinto?{" "}
            <Link href="/contacto" className="text-electric-violet hover:text-electric-violet/80 transition-colors underline underline-offset-4">
              Hablamos y te preparamos un presupuesto a medida
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

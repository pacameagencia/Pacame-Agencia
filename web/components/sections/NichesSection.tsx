"use client";

import Link from "next/link";
import { ArrowRight, UtensilsCrossed, Stethoscope, Scale, ShoppingBag } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

interface NicheCard {
  slug: string;
  name: string;
  icon: LucideIcon;
  pain: string;
  color: string;
}

const nicheCards: NicheCard[] = [
  {
    slug: "restaurantes",
    name: "Restaurantes",
    icon: UtensilsCrossed,
    pain: "Mesas vacias entre semana? Llenamos tu restaurante con marketing digital.",
    color: "#EA580C",
  },
  {
    slug: "clinicas",
    name: "Clinicas",
    icon: Stethoscope,
    pain: "Pocos pacientes nuevos? Haz que te encuentren cuando buscan tu especialidad.",
    color: "#06B6D4",
  },
  {
    slug: "abogados",
    name: "Abogados",
    icon: Scale,
    pain: "Harto de directorios que no funcionan? Captamos clientes directos para tu despacho.",
    color: "#7C3AED",
  },
  {
    slug: "tiendas",
    name: "Tiendas",
    icon: ShoppingBag,
    pain: "No vendes online? Tu tienda abierta 24/7 con una web profesional.",
    color: "#EC4899",
  },
];

export default function NichesSection() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
            Soluciones por sector
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
            Tu sector.{" "}
            <span className="gradient-text-vivid">Nuestra especialidad.</span>
          </h2>
          <p className="text-lg text-pacame-white/40 max-w-lg mx-auto font-body">
            Soluciones digitales diseñadas para los problemas reales de tu negocio.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.08}>
          {nicheCards.map((niche) => {
            const Icon = niche.icon;
            return (
              <StaggerItem key={niche.slug}>
                <Link href={`/para/${niche.slug}`} className="group block h-full">
                  <motion.div
                    className="rounded-2xl p-7 card-apple h-full relative overflow-hidden"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${niche.color}12` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: niche.color }} />
                    </div>

                    {/* Content */}
                    <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
                      {niche.name}
                    </h3>
                    <p className="text-sm text-pacame-white/45 font-body leading-relaxed mb-5">
                      {niche.pain}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-body font-medium" style={{ color: niche.color }}>
                      Ver solucion
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

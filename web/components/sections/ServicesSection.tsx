"use client";

import Link from "next/link";
import { Monitor, Search, Share2, Megaphone, Palette, ArrowRight, Clock, Euro } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const services = [
  {
    icon: Monitor,
    name: "Desarrollo Web",
    description: "Desde landing pages hasta apps complejas. Next.js, Tailwind, Supabase. Sin codigo legacy.",
    highlights: ["Landing Page desde 300 EUR", "Web corporativa desde 800 EUR", "E-commerce desde 2.000 EUR"],
    deadline: "Entrega en 2-40 dias segun proyecto",
    color: "#06B6D4",
    href: "/servicios#web",
  },
  {
    icon: Search,
    name: "SEO",
    description: "Posicionamiento organico que genera demanda real. Auditorias, contenidos, link building.",
    highlights: ["Auditoria SEO desde 300 EUR", "SEO mensual desde 400 EUR/mes", "Resultados medibles"],
    deadline: "Primeros resultados en 60-90 dias",
    color: "#2563EB",
    href: "/servicios#seo",
  },
  {
    icon: Share2,
    name: "Redes Sociales",
    description: "Contenido que conecta y convierte. Estrategia, diseno, copy y community management.",
    highlights: ["Plan Starter desde 300 EUR/mes", "Diseno + copy incluido", "Reporting mensual"],
    deadline: "Calendario editorial en 48h",
    color: "#EC4899",
    href: "/servicios#redes",
  },
  {
    icon: Megaphone,
    name: "Publicidad Digital",
    description: "Meta Ads y Google Ads que generan ROI. Embudos completos con automatizacion.",
    highlights: ["Setup desde 500 EUR", "Gestion desde 400 EUR/mes", "ROI medible desde dia 1"],
    deadline: "Campanas live en 3-5 dias",
    color: "#EA580C",
    href: "/servicios#ads",
  },
  {
    icon: Palette,
    name: "Branding",
    description: "Identidad visual que se recuerda. Logo, paleta, tipografia y manual de marca.",
    highlights: ["Logo + identidad desde 400 EUR", "Branding completo desde 800 EUR", "Rebranding desde 1.200 EUR"],
    deadline: "Logo en 3-5 dias",
    color: "#7C3AED",
    href: "/servicios#branding",
  },
];

export default function ServicesSection() {
  return (
    <section className="section-padding bg-pacame-black relative">
      {/* Section divider */}
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Servicios
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            Todo lo digital.
            <br />
            <span className="gradient-text-vivid">Un solo equipo.</span>
          </h2>
          <p className="text-lg text-pacame-white/60 max-w-xl mx-auto font-body">
            Desde un logo hasta un SaaS completo. No necesitas cinco proveedores.
            Nosotros somos todos a la vez.
          </p>
        </ScrollReveal>

        {/* Services grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14" staggerDelay={0.08}>
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <StaggerItem key={service.name}>
                <Link
                  href={service.href}
                  className="group relative rounded-2xl p-6 card-interactive card-shine block h-full"
                >
                  {/* Top accent line - visible by default, more vivid on hover */}
                  <div
                    className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-30 group-hover:opacity-100 transition-opacity duration-400"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${service.color}, transparent)`,
                    }}
                  />

                  {/* Icon */}
                  <motion.div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${service.color}20` }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon className="w-5 h-5" style={{ color: service.color }} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="font-heading font-bold text-xl text-pacame-white mb-2 group-hover:text-pacame-white transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-pacame-white/60 font-body mb-5 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-2.5 mb-5">
                    {service.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2.5 text-sm">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="text-pacame-white/70 font-body">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-xs text-pacame-white/40 font-body border-t border-white/[0.06] pt-4">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {service.deadline}
                  </div>

                  {/* Arrow */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-4 h-4" style={{ color: service.color }} />
                  </div>
                </Link>
              </StaggerItem>
            );
          })}

          {/* "+" card for custom */}
          <StaggerItem>
            <div className="rounded-2xl p-6 bg-brand-gradient relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="relative z-10">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-5"
                  whileHover={{ scale: 1.1 }}
                >
                  <Euro className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="font-heading font-bold text-xl text-white mb-2">
                  Proyecto a medida
                </h3>
                <p className="text-sm text-white/80 font-body mb-6 leading-relaxed">
                  Tienes algo especifico en mente? Te decimos si podemos y cuanto cuesta en una llamada de 30 minutos. Sin compromiso.
                </p>
                <Button variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30" asChild>
                  <Link href="/contacto">Cuentanos tu proyecto</Link>
                </Button>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* CTA */}
        <ScrollReveal className="text-center">
          <Button variant="outline" size="lg" asChild className="group border-white/10 hover:border-electric-violet/40">
            <Link href="/servicios">
              Ver todos los servicios y precios
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { Monitor, Search, Share2, Megaphone, Palette, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const services = [
  {
    icon: Monitor,
    name: "Desarrollo Web",
    description: "Desde landing pages hasta apps complejas. Next.js, Tailwind, Supabase.",
    price: "Desde 300 EUR",
    deadline: "2-40 dias",
    color: "#06B6D4",
    href: "/servicios#web",
  },
  {
    icon: Search,
    name: "SEO",
    description: "Posicionamiento organico que genera demanda real. Auditorias, contenidos, link building.",
    price: "Desde 300 EUR",
    deadline: "Resultados en 60-90 dias",
    color: "#2563EB",
    href: "/servicios#seo",
  },
  {
    icon: Share2,
    name: "Redes Sociales",
    description: "Contenido que conecta y convierte. Estrategia, diseno, copy y community.",
    price: "Desde 300 EUR/mes",
    deadline: "Calendario en 48h",
    color: "#EC4899",
    href: "/servicios#redes",
  },
  {
    icon: Megaphone,
    name: "Publicidad Digital",
    description: "Meta Ads y Google Ads que generan ROI. Embudos completos con automatizacion.",
    price: "Desde 400 EUR/mes",
    deadline: "Campanas live en 3-5 dias",
    color: "#EA580C",
    href: "/servicios#ads",
  },
  {
    icon: Palette,
    name: "Branding",
    description: "Identidad visual que se recuerda. Logo, paleta, tipografia y manual de marca.",
    price: "Desde 400 EUR",
    deadline: "Logo en 3-5 dias",
    color: "#7C3AED",
    href: "/servicios#branding",
  },
];

export default function ServicesSection() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
            Servicios
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
            Todo lo digital.{" "}
            <span className="gradient-text-vivid">Un solo equipo.</span>
          </h2>
          <p className="text-lg text-pacame-white/40 max-w-lg mx-auto font-body">
            Desde un logo hasta un SaaS completo. No necesitas cinco proveedores.
          </p>
        </ScrollReveal>

        {/* Services grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16" staggerDelay={0.08}>
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <StaggerItem key={service.name}>
                <Link
                  href={service.href}
                  className="group block rounded-2xl p-7 card-apple h-full relative"
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${service.color}12` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: service.color }} />
                  </div>

                  {/* Content */}
                  <h3 className="font-heading font-bold text-xl text-pacame-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-pacame-white/45 font-body leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-5 mt-auto">
                    <span className="text-sm font-heading font-semibold text-pacame-white/70">
                      {service.price}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-pacame-white/30 font-body">
                      <Clock className="w-3 h-3" />
                      {service.deadline}
                    </span>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-apple">
                    <ArrowRight className="w-4 h-4 text-pacame-white/30" />
                  </div>
                </Link>
              </StaggerItem>
            );
          })}

          {/* Custom project card */}
          <StaggerItem>
            <Link
              href="/contacto"
              className="group block rounded-2xl p-7 bg-brand-gradient relative overflow-hidden h-full"
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="font-heading font-bold text-xl text-white mb-2">
                  Proyecto a medida
                </h3>
                <p className="text-sm text-white/70 font-body leading-relaxed mb-6 flex-1">
                  Algo especifico en mente? Te decimos si podemos y cuanto cuesta. 30 minutos, sin compromiso.
                </p>
                <div className="flex items-center gap-2 text-sm text-white/80 font-body font-medium">
                  Cuentanos tu proyecto
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </StaggerItem>
        </StaggerContainer>

        {/* CTA */}
        <ScrollReveal className="text-center">
          <Button variant="outline" size="lg" asChild className="group rounded-full border-white/[0.08] hover:border-white/20">
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

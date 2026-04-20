"use client";

import Link from "next/link";
import { Monitor, Search, Share2, Megaphone, Palette, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { NovaSigil, AtlasSigil, NexusSigil, PixelSigil, PulseSigil } from "@/components/icons/agent-sigils";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

const services = [
  {
    icon: Monitor,
    sigil: PixelSigil,
    name: "Desarrollo Web",
    description: "Desde landing pages hasta apps complejas. Next.js, Tailwind, Supabase.",
    price: "Desde 300 EUR",
    deadline: "2-40 dias",
    color: "#06B6D4",
    href: "/servicios#web",
  },
  {
    icon: Search,
    sigil: AtlasSigil,
    name: "SEO",
    description: "Posicionamiento organico que genera demanda real. Auditorias, contenidos, link building.",
    price: "Desde 300 EUR",
    deadline: "Resultados en 60-90 dias",
    color: "#2563EB",
    href: "/servicios#seo",
  },
  {
    icon: Share2,
    sigil: PulseSigil,
    name: "Redes Sociales",
    description: "Contenido que conecta y convierte. Estrategia, diseno, copy y community.",
    price: "Desde 300 EUR/mes",
    deadline: "Calendario en 48h",
    color: "#EC4899",
    href: "/servicios#redes",
  },
  {
    icon: Megaphone,
    sigil: NexusSigil,
    name: "Publicidad Digital",
    description: "Meta Ads y Google Ads que generan ROI. Embudos completos con automatizacion.",
    price: "Desde 400 EUR/mes",
    deadline: "Campanas live en 3-5 dias",
    color: "#EA580C",
    href: "/servicios#ads",
  },
  {
    icon: Palette,
    sigil: NovaSigil,
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
    <section className="section-padding bg-paper relative">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="laurel" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-accent-gold/70 mb-4 uppercase tracking-[0.2em]">
            Servicios
          </p>
          <h2 className="font-accent font-bold text-section text-ink mb-6 text-balance">
            Todo lo digital.{" "}
            <span className="gradient-text-gold">Un solo equipo.</span>
          </h2>
          <p className="text-lg text-ink/40 max-w-lg mx-auto font-body">
            Desde un logo hasta un SaaS completo. No necesitas cinco proveedores.
          </p>
        </ScrollReveal>

        {/* Services grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16" staggerDelay={0.08}>
          {services.map((service) => {
            const Sigil = service.sigil;
            return (
              <StaggerItem key={service.name}>
                <CardTilt tiltMaxAngle={10} scale={1.02}><CardTiltContent>
                  <Link
                    href={service.href}
                    className="group block rounded-2xl p-7 card-apple card-golden-shine h-full relative overflow-hidden"
                  >
                    {/* Sigil icon with rotating ring */}
                    <div className="relative w-14 h-14 mb-6 flex items-center justify-center">
                      {/* Rotating dashed ring */}
                      <div
                        className="absolute inset-0 rounded-full border border-dashed opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                        style={{
                          borderColor: service.color,
                          animation: "sigil-rotate 20s linear infinite",
                        }}
                      />
                      <Sigil color={service.color} size={28} />
                    </div>

                    {/* Content */}
                    <h3 className="font-heading font-bold text-xl text-ink mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-ink/45 font-body leading-relaxed mb-6">
                      {service.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between border-t border-accent-gold/10 pt-5 mt-auto">
                      <span className="text-sm font-heading font-semibold text-ink/70">
                        {service.price}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-ink/30 font-body">
                        <Clock className="w-3 h-3" />
                        {service.deadline}
                      </span>
                    </div>

                    {/* Hover arrow */}
                    <div className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-apple">
                      <ArrowRight className="w-4 h-4 text-accent-gold/60" />
                    </div>
                  </Link>
                </CardTiltContent></CardTilt>
              </StaggerItem>
            );
          })}

          {/* Custom project card — aurora gradient */}
          <StaggerItem>
            <CardTilt tiltMaxAngle={10} scale={1.02}><CardTiltContent>
              <Link
                href="/contacto"
                className="group block rounded-2xl p-7 relative overflow-hidden h-full"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #FF6B9D 25%, #D4A853 50%, #4ECDC4 75%, #06B6D4 100%)",
                  backgroundSize: "400% 400%",
                  animation: "text-shimmer 8s ease infinite",
                }}
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="font-accent font-bold text-xl text-white mb-2">
                    Proyecto a medida
                  </h3>
                  <p className="text-sm text-white/70 font-body leading-relaxed mb-6 flex-1">
                    Algo especifico en mente? Te decimos si podemos y cuanto cuesta. 30 minutos, sin compromiso.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-white/90 font-body font-medium">
                    Cuentanos tu proyecto
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </CardTiltContent></CardTilt>
          </StaggerItem>
        </StaggerContainer>

        {/* CTA */}
        <ScrollReveal className="text-center">
          <Button variant="outline" size="lg" asChild className="group rounded-full border-accent-gold/20 hover:border-accent-gold/40 hover:bg-accent-gold/5">
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

import Link from "next/link";
import { Monitor, Search, Share2, Megaphone, Palette, ArrowRight, Clock, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Monitor,
    name: "Desarrollo Web",
    description: "Desde landing pages hasta apps complejas. Next.js, Tailwind, Supabase. Sin código legacy.",
    highlights: ["Landing Page desde 300 €", "Web corporativa desde 800 €", "E-commerce desde 2.000 €"],
    deadline: "Entrega en 2-40 días según proyecto",
    color: "#06B6D4",
    href: "/servicios#web",
  },
  {
    icon: Search,
    name: "SEO",
    description: "Posicionamiento orgánico que genera demanda real. Auditorías, contenidos, link building.",
    highlights: ["Auditoría SEO desde 300 €", "SEO mensual desde 400 €/mes", "Resultados medibles"],
    deadline: "Primeros resultados en 60-90 días",
    color: "#2563EB",
    href: "/servicios#seo",
  },
  {
    icon: Share2,
    name: "Redes Sociales",
    description: "Contenido que conecta y convierte. Estrategia, diseño, copy y community management.",
    highlights: ["Plan Starter desde 300 €/mes", "Diseño + copy incluido", "Reporting mensual"],
    deadline: "Calendario editorial en 48h",
    color: "#EC4899",
    href: "/servicios#redes",
  },
  {
    icon: Megaphone,
    name: "Publicidad Digital",
    description: "Meta Ads y Google Ads que generan ROI. Embudos completos con automatización.",
    highlights: ["Setup desde 500 €", "Gestión desde 400 €/mes", "ROI medible desde día 1"],
    deadline: "Campañas live en 3-5 días",
    color: "#EA580C",
    href: "/servicios#ads",
  },
  {
    icon: Palette,
    name: "Branding",
    description: "Identidad visual que se recuerda. Logo, paleta, tipografía y manual de marca.",
    highlights: ["Logo + identidad desde 400 €", "Branding completo desde 800 €", "Rebranding desde 1.200 €"],
    deadline: "Logo en 3-5 días",
    color: "#7C3AED",
    href: "/servicios#branding",
  },
];

export default function ServicesSection() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Servicios
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            Todo lo digital.
            <br />
            <span className="gradient-text">Un solo equipo.</span>
          </h2>
          <p className="text-lg text-pacame-white/60 max-w-xl mx-auto font-body">
            Desde un logo hasta un SaaS completo. No necesitas cinco proveedores.
            Nosotros somos todos a la vez.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.name}
                href={service.href}
                className="group relative rounded-2xl p-6 bg-dark-card border border-white/[0.06] hover:border-opacity-50 transition-all duration-300 hover:-translate-y-1 block"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
                  style={{ backgroundColor: service.color }}
                />

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: service.color }} />
                </div>

                {/* Content */}
                <h3 className="font-heading font-bold text-xl text-pacame-white mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-pacame-white/60 font-body mb-5 leading-relaxed">
                  {service.description}
                </p>

                {/* Highlights */}
                <ul className="space-y-2 mb-5">
                  {service.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm">
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
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                  <ArrowRight className="w-4 h-4" style={{ color: service.color }} />
                </div>
              </Link>
            );
          })}

          {/* "+" card for custom */}
          <div className="rounded-2xl p-6 bg-brand-gradient relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                <Euro className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">
                Proyecto a medida
              </h3>
              <p className="text-sm text-white/80 font-body mb-6 leading-relaxed">
                ¿Tienes algo específico en mente? Te decimos si podemos y cuánto cuesta en una llamada de 30 minutos. Sin compromiso.
              </p>
              <Button variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30" asChild>
                <Link href="/contacto">Cuéntanos tu proyecto</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="outline" size="lg" asChild className="group">
            <Link href="/servicios">
              Ver todos los servicios y precios
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

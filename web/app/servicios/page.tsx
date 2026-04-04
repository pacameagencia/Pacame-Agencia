import type { Metadata } from "next";
import Link from "next/link";
import {
  Monitor, Search, Share2, Megaphone, Palette,
  Check, Clock, ArrowRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { services, packages } from "@/lib/data/services";

export const metadata: Metadata = {
  title: "Servicios — Diseño Web, SEO, Ads, Social Media y Branding",
  description:
    "Todos los servicios digitales que necesita tu empresa. Precios transparentes, plazos concretos. Web desde 300€, SEO desde 400€/mes, Ads desde 500€.",
  alternates: { canonical: "https://pacame.es/servicios" },
};

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Monitor, Search, Share2, Megaphone, Palette,
};

const serviceCategories = [
  { id: "web", color: "#06B6D4" },
  { id: "seo", color: "#2563EB" },
  { id: "redes", color: "#EC4899" },
  { id: "ads", color: "#EA580C" },
  { id: "branding", color: "#7C3AED" },
];

export default function ServiciosPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Servicios y precios
          </p>
          <h1 className="font-heading font-bold text-[clamp(2.5rem,5vw,4rem)] text-pacame-white leading-tight mb-6">
            Precios claros.
            <br />
            <span className="gradient-text">Resultados concretos.</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body max-w-2xl mx-auto mb-10">
            Sin presupuestos que se inflan. Sin sorpresas en la factura.
            Todo lo que necesita tu negocio, con plazos y precios reales.
          </p>

          {/* Jump nav */}
          <div className="flex flex-wrap justify-center gap-2">
            {services.map((s) => {
              const catColor = serviceCategories.find((c) => c.id === s.id)?.color || "#7C3AED";
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-4 py-2 rounded-full text-sm font-body border transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: `${catColor}40`,
                    color: catColor,
                    backgroundColor: `${catColor}10`,
                  }}
                >
                  {s.name}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      {services.map((service, sIdx) => {
        const catColor = serviceCategories.find((c) => c.id === service.id)?.color || "#7C3AED";
        const Icon = iconMap[service.icon];
        return (
          <section
            key={service.id}
            id={service.id}
            className={`section-padding ${sIdx % 2 === 0 ? "bg-pacame-black" : "bg-dark-elevated"}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section header */}
              <div className="flex items-start gap-5 mb-12">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${catColor}20` }}
                >
                  {Icon && <Icon className="w-6 h-6" style={{ color: catColor }} />}
                </div>
                <div>
                  <div
                    className="text-xs font-mono uppercase tracking-widest mb-1"
                    style={{ color: catColor }}
                  >
                    {service.category}
                  </div>
                  <h2 className="font-heading font-bold text-3xl text-pacame-white mb-2">
                    {service.name}
                  </h2>
                  <p className="text-pacame-white/60 font-body max-w-xl">{service.description}</p>
                </div>
              </div>

              {/* Service cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {service.items.map((item) => (
                  <div
                    key={item.name}
                    className={`rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 relative ${
                      item.featured
                        ? "border-2"
                        : "bg-dark-card border border-white/[0.06] hover:border-white/10"
                    }`}
                    style={
                      item.featured
                        ? {
                            background: `linear-gradient(135deg, ${catColor}15, transparent)`,
                            borderColor: `${catColor}50`,
                          }
                        : {}
                    }
                  >
                    {item.featured && (
                      <div
                        className="absolute -top-3 left-5"
                        style={{
                          backgroundColor: catColor,
                          borderRadius: "999px",
                          padding: "2px 12px",
                        }}
                      >
                        <span className="text-[11px] font-bold font-body text-white uppercase tracking-wide">
                          Más contratado
                        </span>
                      </div>
                    )}

                    <h3 className="font-heading font-bold text-xl text-pacame-white mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-sm text-pacame-white/60 font-body mb-5">
                      {item.description}
                    </p>

                    <ul className="space-y-2.5 mb-6">
                      {item.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2.5">
                          <Check
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: catColor }}
                          />
                          <span className="text-sm text-pacame-white/70 font-body">{inc}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-white/[0.06] pt-4 flex items-end justify-between">
                      <div>
                        <div className="font-heading font-bold text-2xl text-pacame-white">
                          {item.price}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-pacame-white/40 font-body mt-1">
                          <Clock className="w-3 h-3" />
                          {item.deadline}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-shrink-0"
                        style={item.featured ? { borderColor: catColor, color: catColor } : {}}
                      >
                        <Link href="/contacto">Contratar</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Packages section */}
      <section className="section-padding bg-dark-elevated" id="paquetes">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
              Paquetes combinados
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
              Combina servicios.
              <span className="gradient-text"> Ahorra hasta un 35%.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 relative ${
                  pkg.featured ? "bg-brand-gradient" : "bg-dark-card border border-white/[0.06]"
                }`}
              >
                {pkg.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 bg-pacame-white rounded-full px-4 py-1.5 shadow-lg">
                      <Zap className="w-3 h-3 fill-pacame-black text-pacame-black" />
                      <span className="text-xs font-bold font-body text-pacame-black uppercase tracking-wide">
                        Más popular
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className={`font-heading font-bold text-2xl mb-1 ${pkg.featured ? "text-white" : "text-pacame-white"}`}>
                    {pkg.name}
                  </h3>
                  <p className={`text-sm font-body mb-4 ${pkg.featured ? "text-white/70" : "text-pacame-white/60"}`}>
                    {pkg.target}
                  </p>
                  <div className={`font-heading font-bold text-3xl ${pkg.featured ? "text-white" : "text-pacame-white"}`}>
                    {pkg.price}
                  </div>
                  <p className={`text-xs font-body mt-1 ${pkg.featured ? "text-white/60" : "text-pacame-white/40"}`}>
                    {pkg.deadline}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.featured ? "text-white" : ""}`}
                        style={!pkg.featured ? { color: pkg.color } : {}} />
                      <span className={`text-sm font-body ${pkg.featured ? "text-white/90" : "text-pacame-white/70"}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className={`text-xs text-center font-body font-medium py-2 rounded-xl mb-5 ${
                    pkg.featured ? "bg-white/15 text-white" : ""
                  }`}
                  style={!pkg.featured ? { backgroundColor: `${pkg.color}15`, color: pkg.color } : {}}
                >
                  {pkg.savings} vs servicios individuales
                </div>

                <Button
                  size="lg"
                  className={`w-full group ${pkg.featured ? "bg-white/20 border-white/30 text-white hover:bg-white/30" : ""}`}
                  variant={pkg.featured ? "secondary" : "outline"}
                  asChild
                >
                  <Link href="/contacto">
                    Empezar con {pkg.name}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            ¿No ves lo que necesitas?
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Te escuchamos y preparamos un presupuesto a medida. En 24 horas.
          </p>
          <Button variant="gradient" size="xl" asChild className="group">
            <Link href="/contacto">
              Hablar con el equipo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

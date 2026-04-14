import type { Metadata } from "next";
import Link from "next/link";
import {
  Monitor, Search, Share2, Megaphone, Palette,
  Check, Clock, ArrowRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { services, packages } from "@/lib/data/services";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ServiceCheckoutButton from "@/components/ServiceCheckoutButton";
import PackageCheckoutButton from "@/components/PackageCheckoutButton";

export const metadata: Metadata = {
  title: "Servicios — Diseño Web, SEO, Ads, Social Media y Branding",
  description:
    "Todos los servicios digitales que necesita tu empresa. Precios transparentes, plazos concretos. Web desde 300€, SEO desde 400€/mes, Ads desde 500€.",
  alternates: { canonical: "https://pacameagencia.com/servicios" },
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

function ServicesJsonLd() {
  const allOffers = services.flatMap((service) =>
    service.items.map((item) => ({
      "@type": "Offer",
      name: `${item.name} — ${service.name}`,
      description: item.description,
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "EUR",
        price: item.price,
      },
      seller: {
        "@type": "Organization",
        name: "PACAME",
        url: "https://pacameagencia.com",
      },
      areaServed: { "@type": "Country", name: "Spain" },
    })),
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Servicios PACAME — Agencia Digital IA",
    description: "Todos los servicios digitales de PACAME: desarrollo web, SEO, redes sociales, publicidad digital y branding.",
    url: "https://pacameagencia.com/servicios",
    numberOfItems: allOffers.length,
    itemListElement: allOffers.map((offer, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: offer,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function ServiciosPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Servicios", url: "https://pacameagencia.com/servicios" },
        ]}
      />
      <ServicesJsonLd />
      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/[0.06] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
            Servicios y precios
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            Precios claros.{" "}
            <span className="gradient-text-vivid">Resultados concretos.</span>
          </h1>
          <p className="text-xl text-pacame-white/60 font-body max-w-2xl mx-auto mb-12 font-light">
            Sin presupuestos que se inflan. Sin sorpresas en la factura.
          </p>

          {/* Jump nav */}
          <div className="flex flex-wrap justify-center gap-2">
            {services.map((s) => {
              const catColor = serviceCategories.find((c) => c.id === s.id)?.color || "#7C3AED";
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-4 py-2 rounded-full text-sm font-body border transition-all duration-300 hover:translate-y-[-1px]"
                  style={{
                    borderColor: `${catColor}20`,
                    color: catColor,
                    backgroundColor: `${catColor}06`,
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
            className="section-padding relative"
          >
            {sIdx > 0 && <div className="absolute top-0 inset-x-0 section-divider" />}

            <div className="max-w-6xl mx-auto px-6">
              {/* Section header */}
              <div className="flex items-start gap-5 mb-14">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${catColor}10` }}
                >
                  {Icon && <Icon className="w-5 h-5" style={{ color: catColor }} />}
                </div>
                <div>
                  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-pacame-white mb-2">
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
                    className={`rounded-2xl p-7 transition-all duration-500 ease-apple relative ${
                      item.featured
                        ? "border-2 hover:translate-y-[-2px]"
                        : "bg-dark-card border border-white/[0.06] hover:border-white/[0.1] hover:translate-y-[-2px]"
                    }`}
                    style={
                      item.featured
                        ? {
                            background: `linear-gradient(135deg, ${catColor}08, transparent)`,
                            borderColor: `${catColor}30`,
                          }
                        : {}
                    }
                  >
                    {item.featured && (
                      <div
                        className="absolute -top-3 left-6 rounded-full px-3 py-1"
                        style={{ backgroundColor: catColor }}
                      >
                        <span className="text-[11px] font-body font-semibold text-white uppercase tracking-wider">
                          Mas contratado
                        </span>
                      </div>
                    )}

                    <h3 className="font-heading font-bold text-xl text-pacame-white mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-sm text-pacame-white/60 font-body mb-6">
                      {item.description}
                    </p>

                    <ul className="space-y-2.5 mb-7">
                      {item.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2.5">
                          <Check
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: catColor }}
                          />
                          <span className="text-sm text-pacame-white/60 font-body">{inc}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-white/[0.06] pt-5 flex items-end justify-between">
                      <div>
                        <div className="font-heading font-bold text-2xl text-pacame-white">
                          {item.price}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-pacame-white/50 font-body mt-1">
                          <Clock className="w-3 h-3" />
                          {item.deadline}
                        </div>
                      </div>
                      <ServiceCheckoutButton
                        serviceName={item.name}
                        serviceCategory={service.name}
                        featured={item.featured}
                        accentColor={catColor}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Packages section */}
      <section className="section-padding relative" id="paquetes">
        <div className="absolute top-0 inset-x-0 section-divider" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-body font-medium text-neon-cyan mb-4 uppercase tracking-[0.2em]">
              Paquetes combinados
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
              Combina servicios.{" "}
              <span className="gradient-text-vivid">Ahorra hasta un 35%.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-8 transition-all duration-500 ease-apple hover:translate-y-[-2px] relative flex flex-col ${
                  pkg.featured ? "bg-brand-gradient" : "bg-dark-card border border-white/[0.06]"
                }`}
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

                <div className="mb-6">
                  <h3 className={`font-heading font-bold text-2xl mb-1 ${pkg.featured ? "text-white" : "text-pacame-white"}`}>
                    {pkg.name}
                  </h3>
                  <p className={`text-sm font-body mb-5 ${pkg.featured ? "text-white/60" : "text-pacame-white/60"}`}>
                    {pkg.target}
                  </p>
                  <div className={`font-heading font-bold text-4xl tracking-tight ${pkg.featured ? "text-white" : "text-pacame-white"}`}>
                    {pkg.price}
                  </div>
                  <p className={`text-xs font-body mt-1.5 ${pkg.featured ? "text-white/50" : "text-pacame-white/50"}`}>
                    {pkg.deadline}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.featured ? "text-white/80" : "text-pacame-white/50"}`} />
                      <span className={`text-sm font-body ${pkg.featured ? "text-white/85" : "text-pacame-white/60"}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className={`text-xs text-center font-body font-medium py-2.5 rounded-xl mb-6 ${
                    pkg.featured ? "bg-white/15 text-white" : ""
                  }`}
                  style={!pkg.featured ? { backgroundColor: `${pkg.color}08`, color: pkg.color } : {}}
                >
                  {pkg.savings} vs servicios individuales
                </div>

                <PackageCheckoutButton
                  packageId={pkg.id}
                  packageName={pkg.name}
                  featured={pkg.featured}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4 text-balance">
            No ves lo que necesitas?
          </h2>
          <p className="text-pacame-white/60 font-body mb-10 text-lg">
            Te escuchamos y preparamos un presupuesto a medida. En 24 horas.
          </p>
          <Button variant="gradient" size="xl" asChild className="group rounded-full shadow-glow-violet">
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

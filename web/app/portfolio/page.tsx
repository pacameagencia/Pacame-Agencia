import type { Metadata } from "next";
import Link from "next/link";

// ISR: portfolio — 1h cache
export const revalidate = 3600;

import {
  ArrowRight, TrendingUp, Clock, Star,
  Monitor, Search, Share2, Megaphone, Palette, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

export const metadata: Metadata = {
  title: "Portfolio — Casos de Éxito Reales con Resultados | PACAME",
  description:
    "Proyectos reales con resultados medibles. Webs, SEO, ads, redes sociales y branding para PYMEs en España. Ve lo que nuestro equipo IA puede hacer por tu negocio.",
  alternates: { canonical: "https://pacameagencia.com/portfolio" },
  openGraph: {
    title: "Portfolio — Casos de Éxito con Resultados Medibles | PACAME",
    description: "Proyectos reales para PYMEs españolas. Resultados medibles en web, SEO, ads y branding.",
    url: "https://pacameagencia.com/portfolio",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Monitor, Search, Share2, Megaphone, Palette,
};

interface CaseStudy {
  id: string;
  client: string;
  sector: string;
  city: string;
  challenge: string;
  solution: string;
  services: string[];
  results: { metric: string; value: string; improvement: string }[];
  testimonial: string;
  duration: string;
  investment: string;
  color: string;
  icon: string;
}

const cases: CaseStudy[] = [
  {
    id: "constructora-martinez",
    client: "Construcciones Martinez",
    sector: "Constructora / Reformas",
    city: "Madrid",
    challenge:
      "Web anticuada de 2018 en WordPress que no generaba ni un lead. Dependian al 100% de boca a boca para conseguir clientes.",
    solution:
      "Web corporativa moderna con portfolio de obras, formulario inteligente, SEO local para 'reformas Madrid' y ficha de Google Business optimizada.",
    services: ["Web Corporativa", "SEO Local", "Google Business"],
    results: [
      { metric: "Leads/mes", value: "24", improvement: "+2.300%" },
      { metric: "Trafico organico", value: "1.800/mes", improvement: "+640%" },
      { metric: "Posicion Google", value: "Top 5", improvement: "reformas madrid" },
      { metric: "Tiempo de carga", value: "1.2s", improvement: "-78%" },
    ],
    testimonial: "En 3 dias tenia una web que ninguna agencia me habia podido hacer en 2 meses.",
    duration: "5 dias",
    investment: "1.200 EUR",
    color: "#B54E30",
    icon: "Monitor",
  },
  {
    id: "laura-coach",
    client: "Laura Fernandez Coaching",
    sector: "Coaching / Formacion",
    city: "Barcelona",
    challenge:
      "Emprendedora con Instagram pero sin web profesional ni embudo de captacion. Vendia por DM sin sistema.",
    solution:
      "Landing page con embudo completo: lead magnet, secuencia de emails automatizada, Meta Ads y branding completo.",
    services: ["Landing Page", "Embudo", "Meta Ads", "Branding"],
    results: [
      { metric: "Leads/mes", value: "85", improvement: "desde 0" },
      { metric: "Coste por lead", value: "3.20 EUR", improvement: "Meta Ads" },
      { metric: "Tasa conversion", value: "4.8%", improvement: "embudo" },
      { metric: "Facturacion", value: "+180%", improvement: "en 3 meses" },
    ],
    testimonial: "Web, logo, redes y Google Ads en menos de dos semanas. Ya tengo mis primeros clientes.",
    duration: "10 dias",
    investment: "2.800 EUR",
    color: "#EC4899",
    icon: "Megaphone",
  },
  {
    id: "tienda-artesana",
    client: "Tienda Artesana",
    sector: "E-commerce / Artesania",
    city: "Valencia",
    challenge:
      "Vendia en Etsy y por Instagram con margenes ajustados por comisiones. Queria su propia tienda online.",
    solution:
      "E-commerce con Stripe, SEO para productos, contenido de marca y campanas de Meta Ads para trafico propio.",
    services: ["E-commerce", "SEO", "Meta Ads", "Branding"],
    results: [
      { metric: "Ventas online", value: "+320%", improvement: "en 90 dias" },
      { metric: "Margen neto", value: "+15%", improvement: "sin comisiones" },
      { metric: "Trafico organico", value: "2.400/mes", improvement: "+890%" },
      { metric: "ROAS Meta Ads", value: "4.2x", improvement: "por EUR invertido" },
    ],
    testimonial: "En la primera semana ya habia recuperado la inversion. El embudo funciona solo.",
    duration: "15 dias",
    investment: "3.500 EUR",
    color: "#EA580C",
    icon: "Share2",
  },
  {
    id: "clinica-salud",
    client: "Clinica Salud Integral",
    sector: "Clinica Medica",
    city: "Malaga",
    challenge:
      "Clinica con buena reputacion offline pero invisible online. Perdia pacientes frente a clinicas con mejor presencia digital.",
    solution:
      "Web premium con reserva online, gestion de redes sociales, SEO local y Google Business completo.",
    services: ["Web Premium", "SEO Local", "Redes Sociales", "Google Business"],
    results: [
      { metric: "Pacientes/mes", value: "35", improvement: "+400%" },
      { metric: "Engagement", value: "x5", improvement: "en 4 meses" },
      { metric: "Reviews Google", value: "4.9/5", improvement: "87 resenas" },
      { metric: "Reservas online", value: "60%", improvement: "del total" },
    ],
    testimonial: "4 meses con Pulse gestionando nuestras redes. Engagement x5 y lista de espera.",
    duration: "12 dias",
    investment: "2.200 EUR + 600 EUR/mes",
    color: "#283B70",
    icon: "Monitor",
  },
  {
    id: "despacho-legal",
    client: "Bufete Sanchez & Asociados",
    sector: "Despacho Juridico",
    city: "Bilbao",
    challenge:
      "Despacho con web de los anos 2000. El 80% de clientes por referidos pero querian diversificar y captar por Google.",
    solution:
      "Rebranding completo, web corporativa con blog juridico SEO, y Google Ads para captacion directa.",
    services: ["Branding", "Web Corporativa", "SEO", "Google Ads"],
    results: [
      { metric: "Consultas/mes", value: "18", improvement: "desde 0" },
      { metric: "Posicion Google", value: "Top 3", improvement: "abogado bilbao" },
      { metric: "Trafico web", value: "3.200/mes", improvement: "+1.100%" },
      { metric: "Clientes por web", value: "40%", improvement: "del total nuevos" },
    ],
    testimonial: "Nova lo entendio en la primera llamada. El resultado supero todo lo que imagine.",
    duration: "8 dias",
    investment: "2.500 EUR + 800 EUR/mes",
    color: "#2563EB",
    icon: "Search",
  },
];

function PortfolioJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Portfolio PACAME — Casos de Exito",
    description: "Proyectos reales con resultados medibles para PYMEs en Espana.",
    url: "https://pacameagencia.com/portfolio",
    numberOfItems: cases.length,
    itemListElement: cases.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: `${c.client} — ${c.sector}`,
        description: c.challenge,
        creator: { "@type": "Organization", name: "PACAME", url: "https://pacameagencia.com" },
        locationCreated: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: c.city, addressCountry: "ES" } },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function PortfolioPage() {
  return (
    <div className="bg-paper min-h-screen">
      <PortfolioJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Portfolio", url: "https://pacameagencia.com/portfolio" },
        ]}
      />
      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-brand-primary mb-5 uppercase tracking-[0.2em]">
            Portfolio
          </p>
          <h1 className="font-heading font-bold text-display text-ink mb-6 text-balance">
            Resultados reales.{" "}
            <span className="gradient-text-vivid">No promesas vacias.</span>
          </h1>
          <p className="text-xl text-ink/60 font-body max-w-2xl mx-auto mb-14 font-light">
            Cada proyecto con metricas concretas. Porque los numeros no mienten.
          </p>

          {/* Quick stats */}
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden max-w-3xl mx-auto" staggerDelay={0.1}>
            {[
              { value: "50+", label: "Proyectos entregados" },
              { value: "98%", label: "Clientes satisfechos" },
              { value: "5 dias", label: "Media de entrega" },
              { value: "4.9/5", label: "Valoracion media" },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
              <div className="bg-paper p-6 text-center">
                <div className="font-heading font-bold text-2xl text-ink mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-ink/50 font-body">{stat.label}</div>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      </section>

      {/* Case Studies */}
      <section className="section-padding relative">
        <div className="px-6"><GoldenDivider variant="laurel" /></div>

        <div className="max-w-6xl mx-auto px-6 space-y-8">
          {cases.map((c, caseIdx) => {
            const Icon = iconMap[c.icon];
            return (
              <ScrollReveal key={c.id} delay={caseIdx * 0.1}>
              <div
                className="rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-ink/[0.1] transition-all duration-500 ease-apple overflow-hidden card-golden-shine"
              >
                <div className="p-8 lg:p-10">
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${c.color}10` }}
                      >
                        {Icon && <Icon className="w-5 h-5" style={{ color: c.color }} />}
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-xl text-ink">
                          {c.client}
                        </h2>
                        <p className="text-sm text-ink/50 font-body">
                          {c.sector} &middot; {c.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.services.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-3 py-1 rounded-full font-body"
                          style={{
                            backgroundColor: `${c.color}08`,
                            color: c.color,
                            border: `1px solid ${c.color}15`,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Challenge + Solution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-xs font-body font-medium uppercase tracking-[0.15em] text-ink/50 mb-2">
                        El problema
                      </h3>
                      <p className="text-sm text-ink/60 font-body leading-relaxed">
                        {c.challenge}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-body font-medium uppercase tracking-[0.15em] text-ink/50 mb-2">
                        La solucion
                      </h3>
                      <p className="text-sm text-ink/60 font-body leading-relaxed">
                        {c.solution}
                      </p>
                    </div>
                  </div>

                  {/* Results grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {c.results.map((r) => (
                      <div
                        key={r.metric}
                        className="rounded-xl p-4 text-center"
                        style={{ backgroundColor: `${c.color}06`, border: `1px solid ${c.color}10` }}
                      >
                        <div
                          className="font-heading font-bold text-xl mb-1"
                          style={{ color: c.color }}
                        >
                          {r.value}
                        </div>
                        <div className="text-xs text-ink/50 font-body">{r.metric}</div>
                        <div className="text-[10px] text-ink/40 font-body mt-1">
                          {r.improvement}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial + meta */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 pt-6 border-t border-white/[0.04]">
                    <div className="flex-1">
                      <p className="text-sm text-ink/60 font-body italic leading-relaxed">
                        &ldquo;{c.testimonial}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-ink/50 font-body flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {c.duration}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {c.investment}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-accent-gold text-accent-gold" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-paper text-center">
        <ScrollReveal className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-ink mb-4 text-balance">
            Tu proyecto puede ser el siguiente.
          </h2>
          <p className="text-lg text-ink/60 font-body mb-10">
            Cuentanos que necesitas. Diagnostico gratuito, sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton>
              <ShinyButton
                gradientFrom="#E8B730"
                gradientTo="#B54E30"
                gradientOpacity={0.8}
                className="group min-w-[280px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
              >
                <Link href="/contacto" className="flex items-center gap-2 text-ink">
                  <MessageSquare className="w-5 h-5" />
                  Pedir diagnostico gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </ShinyButton>
            </MagneticButton>
            <Button variant="outline" size="xl" asChild className="rounded-full border-ink/[0.08] hover:border-white/20">
              <Link href="/servicios">Ver servicios y precios</Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

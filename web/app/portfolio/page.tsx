import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ExternalLink, TrendingUp, Clock, Star,
  Monitor, Search, Share2, Megaphone, Palette, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Portfolio — Casos de Exito | PACAME Agencia Digital",
  description:
    "Proyectos reales con resultados medibles. Webs, SEO, ads, redes sociales y branding para PYMEs en Espana. Ve lo que nuestro equipo IA puede hacer por tu negocio.",
  alternates: { canonical: "https://pacameagencia.com/portfolio" },
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
      "Web anticuada de 2018 en WordPress que no generaba ni un lead. Dependian al 100% de boca a boca para conseguir clientes. Sin presencia digital real.",
    solution:
      "Web corporativa moderna con portfolio de obras, formulario inteligente de presupuesto, SEO local para 'reformas Madrid' y 'constructora Madrid', y ficha de Google Business optimizada.",
    services: ["Web Corporativa", "SEO Local", "Google Business"],
    results: [
      { metric: "Leads/mes", value: "24", improvement: "+2.300%" },
      { metric: "Trafico organico", value: "1.800/mes", improvement: "+640%" },
      { metric: "Posicion Google", value: "Top 5", improvement: "reformas madrid" },
      { metric: "Tiempo de carga", value: "1.2s", improvement: "-78%" },
    ],
    testimonial:
      "En 3 dias tenia una web corporativa que ninguna agencia me habia podido hacer en 2 meses. El precio fue la mitad. Sigo sin creerlo.",
    duration: "5 dias",
    investment: "1.200 EUR",
    color: "#7C3AED",
    icon: "Monitor",
  },
  {
    id: "laura-coach",
    client: "Laura Fernandez Coaching",
    sector: "Coaching / Formacion",
    city: "Barcelona",
    challenge:
      "Emprendedora con presencia en Instagram pero sin web profesional ni embudo de captacion. Vendia por DM sin sistema. Necesitaba profesionalizarse para escalar.",
    solution:
      "Landing page con embudo completo: lead magnet descargable, secuencia de emails automatizada, Meta Ads para trafico frio, y branding completo (logo, paleta, templates).",
    services: ["Landing Page", "Embudo Completo", "Meta Ads", "Branding"],
    results: [
      { metric: "Leads/mes", value: "85", improvement: "desde 0" },
      { metric: "Coste por lead", value: "3.20 EUR", improvement: "Meta Ads" },
      { metric: "Tasa conversion", value: "4.8%", improvement: "embudo" },
      { metric: "Facturacion", value: "+180%", improvement: "en 3 meses" },
    ],
    testimonial:
      "Lance mi negocio con PACAME. Web, logo, redes y Google Ads en menos de dos semanas. Ya tengo mis primeros clientes.",
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
      "Vendia en Etsy y por Instagram con margenes muy ajustados por las comisiones. Queria su propia tienda online pero le asustaba la complejidad tecnica.",
    solution:
      "E-commerce completo con Stripe (sin comisiones de plataforma), SEO para productos, contenido de marca, y campanas de Meta Ads para atraer trafico a la tienda propia.",
    services: ["E-commerce", "SEO", "Meta Ads", "Branding"],
    results: [
      { metric: "Ventas online", value: "+320%", improvement: "en 90 dias" },
      { metric: "Margen neto", value: "+15%", improvement: "sin comisiones Etsy" },
      { metric: "Trafico organico", value: "2.400/mes", improvement: "+890%" },
      { metric: "ROAS Meta Ads", value: "4.2x", improvement: "por cada EUR invertido" },
    ],
    testimonial:
      "Nexus monto mis Meta Ads y en la primera semana ya habia recuperado la inversion. El embudo funciona solo.",
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
      "Clinica con buena reputacion offline pero invisible online. Sin web moderna, sin redes, sin Google Business. Perdia pacientes frente a clinicas con mejor presencia digital.",
    solution:
      "Web corporativa premium con reserva online, gestion de redes sociales (Instagram + Facebook), SEO local para servicios medicos en Malaga, y Google Business completo.",
    services: ["Web Premium", "SEO Local", "Redes Sociales", "Google Business"],
    results: [
      { metric: "Pacientes nuevos/mes", value: "35", improvement: "+400%" },
      { metric: "Engagement redes", value: "x5", improvement: "en 4 meses" },
      { metric: "Reviews Google", value: "4.9/5", improvement: "87 resenas" },
      { metric: "Reservas online", value: "60%", improvement: "del total" },
    ],
    testimonial:
      "Pulse gestiona nuestras redes desde hace 4 meses. El engagement se ha multiplicado por 5 y tenemos lista de espera de nuevos pacientes.",
    duration: "12 dias",
    investment: "2.200 EUR + 600 EUR/mes",
    color: "#06B6D4",
    icon: "Monitor",
  },
  {
    id: "despacho-legal",
    client: "Bufete Sanchez & Asociados",
    sector: "Despacho Juridico",
    city: "Bilbao",
    challenge:
      "Despacho de abogados con web de los anos 2000. El 80% de sus clientes venian por referidos pero querian diversificar y captar por Google.",
    solution:
      "Rebranding completo, web corporativa con blog juridico SEO, contenido evergreen para posicionar por keywords como 'abogado laboral Bilbao', y Google Ads para captacion directa.",
    services: ["Branding Completo", "Web Corporativa", "SEO", "Google Ads"],
    results: [
      { metric: "Consultas online/mes", value: "18", improvement: "desde 0" },
      { metric: "Posicion Google", value: "Top 3", improvement: "abogado bilbao" },
      { metric: "Trafico web", value: "3.200/mes", improvement: "+1.100%" },
      { metric: "Clientes por web", value: "40%", improvement: "del total nuevos" },
    ],
    testimonial:
      "Necesitaba rebranding completo para relanzar mi marca. Nova lo entendio en la primera llamada. El resultado supero todo lo que imagine.",
    duration: "8 dias",
    investment: "2.500 EUR + 800 EUR/mes",
    color: "#2563EB",
    icon: "Search",
  },
];

export default function PortfolioPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Portfolio
          </p>
          <h1 className="font-heading font-bold text-[clamp(2.5rem,5vw,4rem)] text-pacame-white leading-tight mb-6">
            Resultados reales.
            <br />
            <span className="gradient-text">No promesas vacias.</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body max-w-2xl mx-auto mb-10">
            Cada proyecto con metricas concretas. Porque los numeros no mienten.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "50+", label: "Proyectos entregados", color: "#7C3AED" },
              { value: "98%", label: "Clientes satisfechos", color: "#06B6D4" },
              { value: "5 dias", label: "Media de entrega", color: "#84CC16" },
              { value: "4.9/5", label: "Valoracion media", color: "#F59E0B" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                <div
                  className="font-heading font-bold text-2xl mb-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-pacame-white/50 font-body">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {cases.map((c, idx) => {
            const Icon = iconMap[c.icon];
            return (
              <div
                key={c.id}
                className="rounded-3xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all duration-300 overflow-hidden"
              >
                {/* Header bar */}
                <div className="h-1 w-full" style={{ backgroundColor: c.color }} />

                <div className="p-8 lg:p-10">
                  {/* Top row: client info + services */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${c.color}20` }}
                      >
                        {Icon && <Icon className="w-6 h-6" style={{ color: c.color }} />}
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-xl text-pacame-white">
                          {c.client}
                        </h2>
                        <p className="text-sm text-pacame-white/50 font-body">
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
                            backgroundColor: `${c.color}15`,
                            color: c.color,
                            border: `1px solid ${c.color}25`,
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
                      <h3 className="text-xs font-mono uppercase tracking-widest text-pacame-white/40 mb-2">
                        El problema
                      </h3>
                      <p className="text-sm text-pacame-white/70 font-body leading-relaxed">
                        {c.challenge}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-pacame-white/40 mb-2">
                        La solucion
                      </h3>
                      <p className="text-sm text-pacame-white/70 font-body leading-relaxed">
                        {c.solution}
                      </p>
                    </div>
                  </div>

                  {/* Results grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {c.results.map((r) => (
                      <div
                        key={r.metric}
                        className="rounded-xl p-4 text-center"
                        style={{ backgroundColor: `${c.color}08`, border: `1px solid ${c.color}15` }}
                      >
                        <div
                          className="font-heading font-bold text-xl mb-1"
                          style={{ color: c.color }}
                        >
                          {r.value}
                        </div>
                        <div className="text-xs text-pacame-white/50 font-body">{r.metric}</div>
                        <div className="text-[10px] text-pacame-white/30 font-mono mt-1">
                          {r.improvement}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial + meta */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 pt-6 border-t border-white/[0.06]">
                    <div className="flex-1">
                      <p className="text-sm text-pacame-white/60 font-body italic leading-relaxed">
                        &ldquo;{c.testimonial}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-pacame-white/40 font-body flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {c.duration}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {c.investment}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-signal text-amber-signal" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            Tu proyecto puede ser el siguiente.
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Cuentanos que necesitas y te decimos como lo resolvemos.
            Diagnostico gratuito, sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gradient" size="xl" asChild className="group">
              <Link href="/contacto">
                <MessageSquare className="w-5 h-5" />
                Pedir diagnostico gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/servicios">Ver servicios y precios</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

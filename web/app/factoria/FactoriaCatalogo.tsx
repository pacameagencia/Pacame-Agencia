"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

const tiers = [
  {
    code: "T·01",
    name: "Starter",
    sub: "Para validar la presencia digital",
    priceFrom: "500",
    priceTo: "1.500",
    sub_monthly: "+ 49 €/mes mantenimiento",
    description:
      "Activa la presencia digital mínima viable. Web profesional, posicionamiento básico, agente IA conversacional para responder consultas 24/7.",
    agents: ["PIXEL", "ATLAS", "COPY"],
    skills: 24,
    deliverables: [
      "Landing 1 página · Next.js · responsive",
      "SEO técnico + 5 keywords objetivo",
      "Agente IA para WhatsApp (FAQ + leads)",
      "Dashboard básico de tráfico",
      "Setup analytics (GA4 + Hotjar)",
    ],
    timeline: "5–10 días",
    accent: "#B54E30",
    bg: "bg-paper",
    border: "border-ink",
    featured: false,
  },
  {
    code: "T·02",
    name: "Stack",
    sub: "Para escalar lo que ya funciona",
    priceFrom: "2.000",
    priceTo: "5.000",
    sub_monthly: "+ 149 €/mes mantenimiento",
    description:
      "El paquete que pivota una PYME a digital-first. Web completa + automatización de captación + agente IA con voz + seguimiento por canales.",
    agents: ["PIXEL", "NEXUS", "PULSE", "COPY", "CORE"],
    skills: 96,
    deliverables: [
      "Web completa (5–8 páginas) + blog SEO",
      "Embudo de captación (Meta + Google Ads)",
      "Agente IA conversacional (web + WhatsApp + voz)",
      "n8n automatizaciones (lead → CRM → email)",
      "Dashboard ROI por canal",
      "10 piezas/mes redes sociales",
    ],
    timeline: "15–30 días",
    accent: "#283B70",
    bg: "bg-ink",
    border: "border-mustard-500",
    featured: true,
  },
  {
    code: "T·03",
    name: "Ready",
    sub: "Auditoría + transformación IA-first",
    priceFrom: "1.500",
    priceTo: "3.000",
    sub_monthly: "Pago único · sin mensualidad",
    description:
      "Diagnóstico completo de tu negocio digital + roadmap de implementación priorizado. Si quieres saber dónde estás antes de invertir.",
    agents: ["DIOS", "SAGE", "LENS"],
    skills: 12,
    deliverables: [
      "Auditoría 360° (web, SEO, ads, social, ops)",
      "Análisis de competencia + market gap",
      "Roadmap 6 meses priorizado por ROI",
      "Stack tecnológico recomendado",
      "Plan de inversión + KPIs trackeables",
      "Sesión estratégica 90 min con Pablo",
    ],
    timeline: "7–14 días",
    accent: "#E8B730",
    bg: "bg-paper",
    border: "border-ink",
    featured: false,
  },
];

export default function FactoriaCatalogo() {
  return (
    <section id="catalogo" className="relative section-padding bg-sand-100">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-mustard-500" aria-hidden="true">
                <polygon points="7,1 13,12 1,12" fill="currentColor" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">§ II</span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="kicker block mb-4">Catálogo · 3 productos empaquetados</span>
            <h2
              className="font-display text-ink"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              Configuraciones,{" "}
              <span
                className="italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                no presupuestos.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <p className="font-sans text-ink-soft text-[15px] leading-relaxed">
              Cada tier es una combinación predefinida de agentes y skills. Pricing variable + suscripción mensual + ofertas Hormozi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, idx) => {
            const isFeatured = tier.featured;
            return (
              <motion.div
                key={tier.code}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] }}
                className={`relative ${tier.bg} border-2 ${tier.border} flex flex-col ${
                  isFeatured ? "lg:scale-[1.02] lg:-translate-y-2" : ""
                }`}
                style={{
                  boxShadow: isFeatured ? "8px 8px 0 #1A1813" : "5px 5px 0 #1A1813",
                }}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-mustard-500 text-ink px-4 py-1.5">
                      <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-medium">
                        ★ Más demandado
                      </span>
                    </div>
                  </div>
                )}

                <div className={`p-8 border-b-2 ${isFeatured ? "border-mustard-500/40" : "border-ink/20"}`}>
                  <div className="flex items-start justify-between mb-6">
                    <span
                      className={`font-mono text-[11px] tracking-[0.25em] uppercase ${
                        isFeatured ? "text-mustard-400" : "text-ink-mute"
                      }`}
                    >
                      {tier.code}
                    </span>
                    <span
                      className="font-mono text-[11px] tracking-[0.2em] uppercase px-2 py-1"
                      style={{
                        backgroundColor: tier.accent + "20",
                        color: tier.accent,
                      }}
                    >
                      {tier.skills} skills
                    </span>
                  </div>

                  <h3
                    className={`font-display mb-2 ${isFeatured ? "text-paper" : "text-ink"}`}
                    style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", lineHeight: "1", letterSpacing: "-0.02em", fontWeight: 500 }}
                  >
                    {tier.name}
                  </h3>
                  <p className={`font-sans text-[14px] mb-6 ${isFeatured ? "text-paper/70" : "text-ink-mute"}`}>
                    {tier.sub}
                  </p>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`font-display tabular-nums ${isFeatured ? "text-paper" : "text-ink"}`}
                      style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
                    >
                      {tier.priceFrom}
                    </span>
                    <span
                      className={`font-display tabular-nums ${isFeatured ? "text-mustard-400" : "text-ink-mute"}`}
                      style={{ fontSize: "1.25rem", fontWeight: 500 }}
                    >
                      –
                    </span>
                    <span
                      className={`font-display tabular-nums ${isFeatured ? "text-paper" : "text-ink"}`}
                      style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
                    >
                      {tier.priceTo}
                      <span className={`text-[1.25rem] ${isFeatured ? "text-mustard-400" : "text-terracotta-500"}`}> €</span>
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] tracking-[0.2em] uppercase ${
                      isFeatured ? "text-paper/60" : "text-ink-mute"
                    }`}
                  >
                    {tier.sub_monthly}
                  </span>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <p className={`font-sans text-[15px] leading-relaxed mb-8 ${isFeatured ? "text-paper/85" : "text-ink-soft"}`}>
                    {tier.description}
                  </p>

                  <div className="mb-6">
                    <span
                      className={`font-mono text-[10px] tracking-[0.25em] uppercase block mb-3 ${
                        isFeatured ? "text-mustard-400" : "text-ink-mute"
                      }`}
                    >
                      Agentes incluidos
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {tier.agents.map((agent) => (
                        <span
                          key={agent}
                          className={`font-mono text-[11px] tracking-[0.15em] uppercase px-2.5 py-1 border ${
                            isFeatured ? "border-paper/30 text-paper" : "border-ink/30 text-ink"
                          }`}
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.deliverables.map((deliv) => (
                      <li key={deliv} className="flex items-start gap-3">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.accent }} />
                        <span className={`font-sans text-[14px] leading-snug ${isFeatured ? "text-paper/85" : "text-ink-soft"}`}>
                          {deliv}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div
                    className={`pt-6 border-t ${
                      isFeatured ? "border-paper/15" : "border-ink/15"
                    } flex items-center justify-between mb-6`}
                  >
                    <span
                      className={`font-mono text-[11px] tracking-[0.2em] uppercase ${
                        isFeatured ? "text-paper/60" : "text-ink-mute"
                      }`}
                    >
                      Entrega
                    </span>
                    <span className={`font-display ${isFeatured ? "text-paper" : "text-ink"}`} style={{ fontSize: "1.25rem", fontWeight: 500 }}>
                      {tier.timeline}
                    </span>
                  </div>

                  <Link
                    href="/contacto"
                    className={`group inline-flex items-center justify-center gap-3 px-5 py-3.5 font-sans font-medium text-[14px] tracking-wide transition-all duration-300 rounded-sm ${
                      isFeatured
                        ? "bg-mustard-500 text-ink hover:bg-mustard-400"
                        : "border-2 border-ink text-ink hover:bg-ink hover:text-paper"
                    }`}
                  >
                    Encargar este tier
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-10 border-t-2 border-ink"
        >
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">Aviso</span>
          </div>
          <div className="lg:col-span-10">
            <p className="font-sans text-ink-soft text-[15px] leading-relaxed max-w-3xl">
              <span className="font-medium text-ink">Pricing variable por valor entregado.</span> El tramo bajo aplica si la PYME ya tiene
              assets digitales. El tramo alto si arranca de cero o el sector tiene complejidad regulatoria. Cada tier admite ofertas de
              bonificación según volumen de skills activadas. Sin sorpresas: cotización cerrada antes de empezar.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

// ISR: pagina de equipo — 1h cache
export const revalidate = 3600;

import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  ArrowRight, CheckCircle2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

export const metadata: Metadata = {
  title: "El Equipo — 7 Agentes IA + 1 Humano | PACAME",
  description:
    "Conoce al equipo de PACAME: 7 agentes IA especializados en branding, SEO, desarrollo web, ads, social media, backend y estrategia. Liderados por Pablo Calleja.",
  alternates: { canonical: "https://pacameagencia.com/equipo" },
  openGraph: {
    title: "El Equipo PACAME — 7 Agentes IA + Pablo Calleja",
    description: "7 agentes IA especializados + 1 humano al mando. Conoce quién trabaja en tu proyecto.",
    url: "https://pacameagencia.com/equipo",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
};

function TeamJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Equipo PACAME — 7 Agentes IA + 1 Humano",
    description: "Conoce al equipo de agentes IA especializados de PACAME, liderados por Pablo Calleja.",
    url: "https://pacameagencia.com/equipo",
    mainEntity: {
      "@type": "Organization",
      name: "PACAME",
      url: "https://pacameagencia.com",
      founder: { "@type": "Person", name: "Pablo Calleja", jobTitle: "CEO" },
      employee: agents.map((agent) => ({
        "@type": "Person",
        name: agent.name,
        jobTitle: agent.role,
        description: agent.description,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function EquipoPage() {
  return (
    <div className="bg-paper min-h-screen">
      <TeamJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Equipo", url: "https://pacameagencia.com/equipo" },
        ]}
      />
      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-olympus-radial pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-accent-gold/70 mb-5 uppercase tracking-[0.2em]">
            El Panteon
          </p>
          <h1 className="font-accent font-bold text-display text-ink mb-6 text-balance">
            No es un chatbot.{" "}
            <span className="gradient-text-aurora">Es un equipo completo.</span>
          </h1>
          <p className="text-xl text-ink/60 font-body max-w-2xl mx-auto font-light text-balance">
            7 agentes IA, cada uno experto en su campo. Supervisados por Pablo Calleja.
            Lo que una agencia tarda semanas, nosotros lo entregamos en dias.
          </p>
        </ScrollReveal>
      </section>

      {/* Agents detailed */}
      <section className="section-padding relative">
        <div className="px-6"><GoldenDivider variant="laurel" /></div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-6">
            {agents.map((agent, agentIdx) => {
              const Icon = iconMap[agent.icon];
              return (
                <ScrollReveal key={agent.id} delay={agentIdx * 0.08}>
                <div
                  className="rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/15 transition-all duration-500 ease-apple overflow-hidden card-golden-shine"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    {/* Agent identity */}
                    <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `${agent.color}12` }}
                        >
                          {Icon && <Icon className="w-6 h-6" style={{ color: agent.color }} />}
                        </div>
                        <div>
                          <h2
                            className="font-accent font-bold text-2xl"
                            style={{ color: agent.color }}
                          >
                            {agent.name}
                          </h2>
                          <p className="text-[11px] text-accent-gold/50 font-body italic mb-0.5">
                            {agent.mythTitle}
                          </p>
                          <p className="text-xs text-ink/50 font-body uppercase tracking-wider">
                            {agent.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-[15px] text-ink/60 font-body leading-relaxed mb-6">
                        {agent.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {agent.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-3 py-1 rounded-full font-body"
                            style={{
                              backgroundColor: `${agent.color}08`,
                              color: agent.color,
                              border: `1px solid ${agent.color}15`,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Agent deliverables */}
                    <div className="lg:col-span-3 p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-ink/[0.06]">
                      <h3 className="font-heading font-semibold text-lg text-ink mb-2">
                        Lo que entrega {agent.name}
                      </h3>
                      <p className="text-xs text-ink/50 font-body mb-6 uppercase tracking-wider">
                        {agent.personality}
                      </p>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {agent.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-3">
                            <CheckCircle2
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{ color: agent.color }}
                            />
                            <span className="text-sm text-ink/60 font-body">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                </ScrollReveal>
              );
            })}

            {/* Pablo card */}
            <ScrollReveal delay={0.2}>
            <CardTilt tiltMaxAngle={4} scale={1.01}>
            <CardTiltContent>
            <div className="rounded-2xl overflow-hidden relative border border-accent-gold/30" style={{ background: "linear-gradient(135deg, #B54E30 0%, #E8B730 50%, #283B70 100%)" }}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center">
                      <span className="font-heading font-bold text-ink text-xl">PC</span>
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-2xl text-white">
                        Pablo Calleja
                      </h2>
                      <p className="text-sm text-white/60 font-body">
                        CEO — El humano del equipo
                      </p>
                    </div>
                  </div>
                  <p className="text-[15px] text-white/70 font-body leading-relaxed">
                    Superviso cada proyecto. Conecto las APIs y herramientas externas.
                    Hablo con los clientes. Tomo las decisiones que la IA no debe tomar.
                    Si algo sale mal, yo respondo.
                  </p>
                </div>
                <div className="lg:col-span-3 p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-white/20">
                  <h3 className="font-heading font-semibold text-lg text-white mb-6">
                    Mi compromiso
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Supervision humana en cada entrega",
                      "Respuesta en menos de 2 horas",
                      "Presupuesto en 24 horas, sin compromiso",
                      "Sin letra pequena. Si no podemos, te lo decimos",
                      "Integracion de cualquier herramienta que necesites",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/80" />
                        <span className="text-sm text-white/80 font-body">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            </CardTiltContent>
            </CardTilt>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How they work together */}
      <section className="section-padding relative">
        <div className="px-6"><GoldenDivider variant="line" /></div>

        <ScrollReveal className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-accent-gold/70 mb-4 uppercase tracking-[0.2em]">
            El sistema
          </p>
          <h2 className="font-accent font-bold text-section text-ink mb-6 text-balance">
            Trabajan en red.{" "}
            <span className="gradient-text-gold">No en silos.</span>
          </h2>
          <p className="text-lg text-ink/60 font-body max-w-2xl mx-auto mb-14">
            Cuando Pixel construye tu web, Atlas ya ha optimizado la estructura SEO.
            Cuando Nexus lanza los ads, Nova ya ha disenado los creativos.
            Todo conectado.
          </p>

          {/* Flow */}
          <CardTilt tiltMaxAngle={4} scale={1.01}>
          <CardTiltContent>
          <div className="rounded-2xl border border-ink/[0.06] bg-paper-deep p-8 sm:p-10 text-left">
            <div className="space-y-5">
              {[
                { step: "1", agent: "Sage", color: "#D97706", text: "Diagnostica tu negocio y define la estrategia" },
                { step: "2", agent: "Nova", color: "#B54E30", text: "Disena la identidad visual y la direccion creativa" },
                { step: "3", agent: "Pixel + Core", color: "#283B70", text: "Construyen la web, la app o la plataforma" },
                { step: "4", agent: "Atlas", color: "#2563EB", text: "Optimiza para SEO y posiciona en Google" },
                { step: "5", agent: "Nexus", color: "#EA580C", text: "Monta el embudo, los ads y la automatizacion" },
                { step: "6", agent: "Pulse", color: "#EC4899", text: "Crea el contenido y gestiona las redes sociales" },
                { step: "7", agent: "Pablo", color: "#F5F5F7", text: "Supervisa, integra herramientas y entrega al cliente" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm"
                    style={{ backgroundColor: `${item.color}10`, color: item.color }}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <span className="font-heading font-semibold text-sm" style={{ color: item.color }}>
                      {item.agent}
                    </span>
                    <span className="text-ink/60 font-body text-sm ml-2">
                      {item.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </CardTiltContent>
          </CardTilt>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="section-padding bg-paper text-center">
        <ScrollReveal className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-ink mb-4 text-balance">
            Quieres que el equipo trabaje para ti?
          </h2>
          <p className="text-lg text-ink/60 font-body mb-10">
            Cuentanos tu problema y te decimos como lo resolvemos, quien lo resuelve y cuanto cuesta.
          </p>
          <MagneticButton>
            <ShinyButton
              gradientFrom="#E8B730"
              gradientTo="#B54E30"
              gradientOpacity={0.8}
              className="group min-w-[280px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <Link href="/contacto" className="flex items-center gap-2 text-ink">
                <MessageSquare className="w-5 h-5" />
                Hablar con el equipo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ShinyButton>
          </MagneticButton>
        </ScrollReveal>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  ArrowRight, CheckCircle2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";

export const metadata: Metadata = {
  title: "El Equipo — 7 Agentes IA + 1 Humano",
  description:
    "Conoce al equipo de PACAME: 7 agentes IA especializados en branding, SEO, desarrollo web, ads, social media, backend y estrategia. Liderados por Pablo Calleja.",
  alternates: { canonical: "https://pacameagencia.com/equipo" },
};

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
};

export default function EquipoPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-electric-violet/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
            El equipo
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            No es un chatbot.{" "}
            <span className="gradient-text-vivid">Es un equipo completo.</span>
          </h1>
          <p className="text-xl text-pacame-white/40 font-body max-w-2xl mx-auto font-light text-balance">
            7 agentes IA, cada uno experto en su campo. Supervisados por Pablo Calleja.
            Lo que una agencia tarda semanas, nosotros lo entregamos en dias.
          </p>
        </div>
      </section>

      {/* Agents detailed */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-6">
            {agents.map((agent) => {
              const Icon = iconMap[agent.icon];
              return (
                <div
                  key={agent.id}
                  className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/[0.1] transition-all duration-500 ease-apple overflow-hidden"
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
                            className="font-heading font-bold text-2xl"
                            style={{ color: agent.color }}
                          >
                            {agent.name}
                          </h2>
                          <p className="text-xs text-pacame-white/35 font-body uppercase tracking-wider">
                            {agent.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-[15px] text-pacame-white/50 font-body leading-relaxed mb-6">
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
                    <div className="lg:col-span-3 p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-white/[0.06]">
                      <h3 className="font-heading font-semibold text-lg text-pacame-white mb-2">
                        Lo que entrega {agent.name}
                      </h3>
                      <p className="text-xs text-pacame-white/30 font-body mb-6 uppercase tracking-wider">
                        {agent.personality}
                      </p>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {agent.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-3">
                            <CheckCircle2
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{ color: agent.color }}
                            />
                            <span className="text-sm text-pacame-white/55 font-body">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pablo card */}
            <div className="rounded-2xl bg-brand-gradient overflow-hidden relative">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center">
                      <span className="font-heading font-bold text-pacame-black text-xl">PC</span>
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
          </div>
        </div>
      </section>

      {/* How they work together */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-neon-cyan mb-4 uppercase tracking-[0.2em]">
            El sistema
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
            Trabajan en red.{" "}
            <span className="gradient-text-vivid">No en silos.</span>
          </h2>
          <p className="text-lg text-pacame-white/40 font-body max-w-2xl mx-auto mb-14">
            Cuando Pixel construye tu web, Atlas ya ha optimizado la estructura SEO.
            Cuando Nexus lanza los ads, Nova ya ha disenado los creativos.
            Todo conectado.
          </p>

          {/* Flow */}
          <div className="rounded-2xl border border-white/[0.06] bg-dark-card p-8 sm:p-10 text-left">
            <div className="space-y-5">
              {[
                { step: "1", agent: "Sage", color: "#D97706", text: "Diagnostica tu negocio y define la estrategia" },
                { step: "2", agent: "Nova", color: "#7C3AED", text: "Disena la identidad visual y la direccion creativa" },
                { step: "3", agent: "Pixel + Core", color: "#06B6D4", text: "Construyen la web, la app o la plataforma" },
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
                    <span className="text-pacame-white/40 font-body text-sm ml-2">
                      {item.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4 text-balance">
            Quieres que el equipo trabaje para ti?
          </h2>
          <p className="text-lg text-pacame-white/40 font-body mb-10">
            Cuentanos tu problema y te decimos como lo resolvemos, quien lo resuelve y cuanto cuesta.
          </p>
          <Button variant="gradient" size="xl" asChild className="group rounded-full shadow-glow-violet">
            <Link href="/contacto">
              <MessageSquare className="w-5 h-5" />
              Hablar con el equipo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

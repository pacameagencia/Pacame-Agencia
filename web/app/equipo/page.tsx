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
  alternates: { canonical: "https://pacame.es/equipo" },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
};

export default function EquipoPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-electric-violet/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            El equipo
          </p>
          <h1 className="font-heading font-bold text-[clamp(2.5rem,5vw,4rem)] text-pacame-white leading-tight mb-6">
            No es un chatbot.
            <br />
            <span className="gradient-text">Es un equipo completo.</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body max-w-2xl mx-auto">
            7 agentes IA, cada uno experto en su campo. Trabajan en red, se coordinan entre sí
            y están supervisados por Pablo Calleja. Resultado: lo que una agencia tarda semanas,
            nosotros lo entregamos en días.
          </p>
        </div>
      </section>

      {/* Agents detailed */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {agents.map((agent, index) => {
              const Icon = iconMap[agent.icon];
              const isEven = index % 2 === 0;
              return (
                <div
                  key={agent.id}
                  className="rounded-3xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all duration-300 overflow-hidden"
                >
                  <div className={`grid grid-cols-1 lg:grid-cols-5 gap-0`}>
                    {/* Agent identity */}
                    <div
                      className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${agent.color}15 0%, transparent 70%)`,
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: agent.color }} />

                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: agent.color }}
                        >
                          {Icon && <Icon className="w-7 h-7 text-white" />}
                        </div>
                        <div>
                          <h2
                            className="font-heading font-bold text-2xl"
                            style={{ color: agent.color }}
                          >
                            {agent.name}
                          </h2>
                          <p className="text-sm text-pacame-white/50 font-body uppercase tracking-wide">
                            {agent.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-pacame-white/70 font-body leading-relaxed mb-6">
                        {agent.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {agent.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-3 py-1 rounded-full font-body"
                            style={{
                              backgroundColor: `${agent.color}15`,
                              color: agent.color,
                              border: `1px solid ${agent.color}25`,
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
                      <p className="text-xs text-pacame-white/40 font-body mb-6 uppercase tracking-wide">
                        {agent.personality}
                      </p>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {agent.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-3">
                            <CheckCircle2
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{ color: agent.color }}
                            />
                            <span className="text-sm text-pacame-white/70 font-body">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pablo card */}
            <div className="rounded-3xl bg-brand-gradient overflow-hidden relative">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center">
                      <span className="font-heading font-bold text-pacame-black text-2xl">PC</span>
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-2xl text-white">
                        Pablo Calleja
                      </h2>
                      <p className="text-sm text-white/70 font-body">
                        CEO · El humano del equipo
                      </p>
                    </div>
                  </div>
                  <p className="text-white/80 font-body leading-relaxed">
                    Superviso cada proyecto. Conecto las APIs y herramientas externas.
                    Hablo con los clientes. Tomo las decisiones que la IA no debe tomar.
                    Si algo sale mal, yo respondo. Si algo sale bien, el equipo se lleva el mérito.
                  </p>
                </div>
                <div className="lg:col-span-3 p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-white/20">
                  <h3 className="font-heading font-semibold text-lg text-white mb-6">
                    Mi compromiso
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Supervisión humana en cada entrega",
                      "Respuesta en menos de 2 horas",
                      "Presupuesto en 24 horas, sin compromiso",
                      "Sin letra pequeña. Si no podemos, te lo decimos",
                      "Integración de cualquier herramienta que necesites",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                        <span className="text-sm text-white/90 font-body">{item}</span>
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
      <section className="section-padding bg-pacame-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
            El sistema
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            Trabajan en red.
            <span className="gradient-text"> No en silos.</span>
          </h2>
          <p className="text-pacame-white/60 font-body max-w-2xl mx-auto mb-12">
            Cuando Pixel construye tu web, Atlas ya ha optimizado la estructura SEO.
            Cuando Nexus lanza los ads, Nova ya ha diseñado los creativos.
            Cuando Pulse publica en redes, Sage ya ha definido el mensaje.
            Todo conectado. Todo coordinado.
          </p>

          {/* Flow diagram */}
          <div className="glass rounded-3xl p-8 sm:p-12 text-left">
            <div className="space-y-6">
              {[
                { step: "1", agent: "Sage", color: "#D97706", text: "Diagnostica tu negocio y define la estrategia" },
                { step: "2", agent: "Nova", color: "#7C3AED", text: "Diseña la identidad visual y la dirección creativa" },
                { step: "3", agent: "Pixel + Core", color: "#06B6D4", text: "Construyen la web, la app o la plataforma" },
                { step: "4", agent: "Atlas", color: "#2563EB", text: "Optimiza para SEO y posiciona en Google" },
                { step: "5", agent: "Nexus", color: "#EA580C", text: "Monta el embudo, los ads y la automatización" },
                { step: "6", agent: "Pulse", color: "#EC4899", text: "Crea el contenido y gestiona las redes sociales" },
                { step: "7", agent: "Pablo", color: "#F5F5F0", text: "Supervisa, integra herramientas y entrega al cliente" },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <span className="font-heading font-semibold text-sm" style={{ color: item.color }}>
                      {item.agent}
                    </span>
                    <span className="text-pacame-white/60 font-body text-sm ml-2">
                      {item.text}
                    </span>
                  </div>
                  {idx < 6 && (
                    <div className="hidden sm:block w-8 text-center text-pacame-white/20">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark-elevated text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            ¿Quieres que el equipo trabaje para ti?
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Cuéntanos tu problema y te decimos cómo lo resolvemos, quién lo resuelve y cuánto cuesta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gradient" size="xl" asChild className="group">
              <Link href="/contacto">
                <MessageSquare className="w-5 h-5" />
                Hablar con el equipo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

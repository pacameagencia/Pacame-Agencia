"use client";

import Link from "next/link";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
};

export default function AgentsSection() {
  return (
    <section className="section-padding bg-dark-elevated relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-electric-violet/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
            Sistema de Agentes
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            No es una IA.
            <br />
            <span className="gradient-text">Es un equipo completo.</span>
          </h2>
          <p className="text-lg text-pacame-white/60 max-w-2xl mx-auto font-body">
            Cada agente domina su especialidad. Trabajan en red, coordinados por Pablo,
            para resolver cualquier problema digital que tengas.
          </p>
        </div>

        {/* Agents grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {agents.map((agent, index) => {
            const Icon = iconMap[agent.icon];
            return (
              <div
                key={agent.id}
                className={`group relative rounded-2xl p-6 bg-dark-card border border-white/[0.06] hover:border-opacity-50 transition-all duration-300 hover:-translate-y-1 agent-glow-${agent.id}`}
                style={{
                  animationDelay: `${index * 0.08}s`,
                  "--agent-color": agent.color,
                } as React.CSSProperties}
              >
                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${agent.color}40`,
                  }}
                />

                {/* Avatar */}
                <div className="relative mb-4">
                  {/* Gradient ring */}
                  <div className="w-14 h-14 rounded-2xl p-[2px] bg-brand-gradient">
                    <div
                      className="w-full h-full rounded-[14px] flex items-center justify-center"
                      style={{ backgroundColor: agent.color }}
                    >
                      {Icon && <Icon className="w-6 h-6 text-white" />}
                    </div>
                  </div>

                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-lime-pulse border-2 border-dark-card" />
                </div>

                {/* Info */}
                <div>
                  <h3
                    className="font-heading font-bold text-lg mb-1"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </h3>
                  <p className="text-xs text-pacame-white/50 font-body mb-3 uppercase tracking-wide">
                    {agent.role}
                  </p>
                  <p className="text-sm text-pacame-white/70 font-body leading-relaxed line-clamp-3">
                    {agent.description}
                  </p>
                </div>

                {/* Skills preview */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-2 py-0.5 rounded-full font-body"
                      style={{
                        backgroundColor: `${agent.color}20`,
                        color: agent.color,
                        border: `1px solid ${agent.color}30`,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Pablo card */}
          <div className="group relative rounded-2xl p-6 bg-dark-card border border-white/[0.06] hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-pacame-white flex items-center justify-center">
                <span className="font-heading font-bold text-pacame-black text-xl">PC</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-signal border-2 border-dark-card" />
            </div>
            <h3 className="font-heading font-bold text-lg text-pacame-white mb-1">Pablo</h3>
            <p className="text-xs text-pacame-white/50 font-body mb-3 uppercase tracking-wide">
              CEO · El humano del equipo
            </p>
            <p className="text-sm text-pacame-white/70 font-body leading-relaxed">
              Supervisa cada entrega. Garantiza que los resultados superen las expectativas. Escala cuando hace falta.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="outline" size="lg" asChild className="group">
            <Link href="/equipo">
              Conocer al equipo completo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

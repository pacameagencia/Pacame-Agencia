"use client";

import Link from "next/link";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass, ArrowRight, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";
import { TOTAL_AGENTS, divisions } from "@/lib/data/agency-agents";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
};

export default function AgentsSection() {
  return (
    <section className="section-padding bg-dark-elevated relative overflow-hidden">
      {/* Ambient - more vivid */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-violet/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neon-cyan/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-dots" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-vivid border border-electric-violet/20 mb-6"
            whileHover={{ scale: 1.02 }}
          >
            <Zap className="w-4 h-4 text-electric-violet" />
            <span className="text-sm font-mono text-electric-violet">{TOTAL_AGENTS}+ Agentes IA Especializados</span>
          </motion.div>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            No es una IA.
            <br />
            <span className="gradient-text-vivid">Es un ejercito digital.</span>
          </h2>
          <p className="text-lg text-pacame-white/60 max-w-2xl mx-auto font-body">
            10 agentes principales + {TOTAL_AGENTS - 10} sub-especialistas en {divisions.length} divisiones.
            Coordinados por Pablo para resolver cualquier problema digital.
          </p>
        </ScrollReveal>

        {/* Agents grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12" staggerDelay={0.06}>
          {agents.map((agent) => {
            const Icon = iconMap[agent.icon];
            return (
              <StaggerItem key={agent.id}>
                <motion.div
                  className="group relative rounded-2xl p-6 card-interactive card-shine h-full"
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{
                    "--agent-color": agent.color,
                  } as React.CSSProperties}
                >
                  {/* Hover border glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 1px ${agent.color}50, 0 0 30px ${agent.color}15`,
                    }}
                  />

                  {/* Avatar */}
                  <div className="relative mb-4">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: agent.color }}
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {Icon && <Icon className="w-6 h-6 text-white" />}
                    </motion.div>

                    {/* Online indicator with ping */}
                    <div className="absolute -bottom-1 -right-1">
                      <span className="relative flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-lime-pulse opacity-40 animate-ping" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-lime-pulse border-2 border-dark-card" />
                      </span>
                    </div>
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
                        className="text-[10px] px-2 py-0.5 rounded-full font-body transition-colors"
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
                </motion.div>
              </StaggerItem>
            );
          })}

          {/* Pablo card */}
          <StaggerItem>
            <motion.div
              className="group relative rounded-2xl p-6 h-full gradient-border"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="relative mb-4">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-pacame-white flex items-center justify-center"
                  whileHover={{ scale: 1.08 }}
                >
                  <span className="font-heading font-bold text-pacame-black text-xl">PC</span>
                </motion.div>
                <div className="absolute -bottom-1 -right-1">
                  <span className="relative flex h-4 w-4">
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-signal border-2 border-dark-card" />
                  </span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg text-pacame-white mb-1">Pablo</h3>
              <p className="text-xs text-pacame-white/50 font-body mb-3 uppercase tracking-wide">
                CEO - El humano del equipo
              </p>
              <p className="text-sm text-pacame-white/70 font-body leading-relaxed">
                Supervisa cada entrega. Garantiza que los resultados superen las expectativas. Escala cuando hace falta.
              </p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* CTA */}
        <ScrollReveal className="text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" size="lg" asChild className="group shadow-glow-violet">
            <Link href="/agentes">
              Ver los {TOTAL_AGENTS}+ agentes
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="group border-white/10 hover:border-electric-violet/40">
            <Link href="/equipo">
              Conocer al equipo core
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

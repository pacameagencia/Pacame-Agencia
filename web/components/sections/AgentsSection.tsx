"use client";

import Link from "next/link";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";
import { TOTAL_AGENTS, divisions } from "@/lib/data/agency-constants";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const iconMap: Record<string, LucideIcon> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
};

export default function AgentsSection() {
  return (
    <section className="section-padding bg-[#0A0A0A] relative overflow-hidden">
      {/* Subtle ambient */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-violet/[0.04] rounded-full blur-[200px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
            {agents.length} agentes + {TOTAL_AGENTS - agents.length} sub-especialistas
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
            No es una IA generica.{" "}
            <span className="gradient-text-vivid">Es un equipo completo.</span>
          </h2>
          <p className="text-lg text-pacame-white/40 max-w-2xl mx-auto font-body">
            {agents.length} agentes principales + {TOTAL_AGENTS - agents.length} sub-especialistas en {divisions.length} divisiones.
            Coordinados por Pablo para resolver cualquier problema digital.
          </p>
        </ScrollReveal>

        {/* Agents grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16" staggerDelay={0.06}>
          {agents.map((agent) => {
            const Icon = iconMap[agent.icon];
            return (
              <StaggerItem key={agent.id}>
                <Link href="/equipo" className="block h-full">
                <motion.div
                  className="group rounded-2xl p-6 card-apple h-full"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  {/* Avatar */}
                  <div className="relative mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${agent.color}12` }}
                    >
                      {Icon && <Icon className="w-5 h-5" color={agent.color} />}
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <span className="block w-3 h-3 rounded-full bg-lime-pulse border-2 border-dark-card" />
                    </div>
                  </div>

                  {/* Info */}
                  <h3
                    className="font-heading font-bold text-lg mb-1"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </h3>
                  <p className="text-xs text-pacame-white/35 font-body mb-3 uppercase tracking-wider">
                    {agent.role}
                  </p>
                  <p className="text-sm text-pacame-white/50 font-body leading-relaxed line-clamp-3">
                    {agent.simpleDescription}
                  </p>

                  {/* Benefits */}
                  <ul className="mt-5 space-y-1.5">
                    {agent.benefits.slice(0, 2).map((benefit) => (
                      <li
                        key={benefit}
                        className="text-[11px] text-pacame-white/35 font-body flex items-start gap-1.5"
                      >
                        <span style={{ color: agent.color }} className="mt-0.5">&#x2713;</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </motion.div>
                </Link>
              </StaggerItem>
            );
          })}

          {/* Pablo card */}
          <StaggerItem>
            <motion.div
              className="group rounded-2xl p-6 h-full gradient-border"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="relative mb-5">
                <div className="w-12 h-12 rounded-2xl bg-pacame-white flex items-center justify-center">
                  <span className="font-heading font-bold text-pacame-black text-base">PC</span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg text-pacame-white mb-1">Pablo</h3>
              <p className="text-xs text-pacame-white/35 font-body mb-3 uppercase tracking-wider">
                CEO — El humano del equipo
              </p>
              <p className="text-sm text-pacame-white/50 font-body leading-relaxed">
                Supervisa cada entrega. Garantiza que los resultados superen las expectativas.
              </p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* CTA */}
        <ScrollReveal className="text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" size="lg" asChild className="group rounded-full shadow-glow-violet">
            <Link href="/equipo">
              Conoce a tu equipo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="group rounded-full border-white/[0.08] hover:border-white/20">
            <Link href="/servicios">
              Ver servicios y precios
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

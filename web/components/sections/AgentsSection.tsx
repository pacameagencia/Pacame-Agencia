"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";
import { TOTAL_AGENTS, divisions } from "@/lib/data/agency-constants";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { AgentSigil } from "@/components/icons/agent-sigils";
import AgentAura from "@/components/effects/AgentAura";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import { FancyText } from "@/components/ui/fancy-text";

export default function AgentsSection() {
  return (
    <section className="section-padding bg-[#0A0A0A] relative overflow-hidden">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="star" />
      </div>

      {/* Ambient aura */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-olympus-radial pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.2em]">
            {agents.length} agentes + {TOTAL_AGENTS - agents.length} sub-especialistas
          </p>
          <h2 className="font-accent font-bold text-section text-pacame-white mb-6 text-balance">
            El Panteon{" "}
            <FancyText
              className="font-accent font-bold text-section text-white/10"
              fillClassName="gradient-text-aurora"
              stagger={0.07}
              duration={1.2}
              delay={0.2}
            >
              PACAME.
            </FancyText>
          </h2>
          <p className="text-lg text-pacame-white/40 max-w-2xl mx-auto font-body">
            {agents.length} agentes principales + {TOTAL_AGENTS - agents.length} sub-especialistas en {divisions.length} divisiones.
            Coordinados por Pablo para resolver cualquier problema digital.
          </p>
        </ScrollReveal>

        {/* Agents grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16" staggerDelay={0.06}>
          {agents.map((agent) => (
            <StaggerItem key={agent.id}>
              <CardTilt tiltMaxAngle={8} scale={1.02}>
              <CardTiltContent>
              <Link href="/equipo" className="block h-full">
                <motion.div
                  className="group rounded-2xl p-6 card-apple h-full relative overflow-hidden border-t border-olympus-gold/10 hover:border-olympus-gold/25 transition-colors duration-500"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  {/* Agent aura — pulsing background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <AgentAura color={agent.color} size={200} gold />
                  </div>

                  {/* Sigil + avatar */}
                  <div className="relative mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                      style={{ backgroundColor: `${agent.color}12` }}
                    >
                      <AgentSigil agentId={agent.id} color={agent.color} size={24} />
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <span className="block w-3 h-3 rounded-full bg-lime-pulse border-2 border-dark-card" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="relative">
                    <h3
                      className="font-accent font-bold text-lg mb-0.5"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </h3>
                    <p className="text-[11px] text-olympus-gold/50 font-body mb-2 italic">
                      {agent.mythTitle}
                    </p>
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
                  </div>
                </motion.div>
              </Link>
              </CardTiltContent>
              </CardTilt>
            </StaggerItem>
          ))}

          {/* Pablo card — golden border */}
          <StaggerItem>
            <CardTilt tiltMaxAngle={8} scale={1.02}>
            <CardTiltContent>
            <motion.div
              className="group rounded-2xl p-6 h-full relative overflow-hidden border border-olympus-gold/30 bg-dark-card"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Golden glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-olympus-gold/[0.06] to-transparent pointer-events-none" />

              <div className="relative">
                <div className="relative mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    {/* Golden gradient background */}
                    <div className="absolute inset-0 bg-myth-gradient opacity-90" />
                    <span className="relative font-heading font-bold text-white text-base">PC</span>
                  </div>
                  {/* Laurel accent */}
                  <svg width="14" height="10" viewBox="0 0 16 12" fill="none" className="absolute -bottom-1 -right-1 opacity-60">
                    <path d="M8 6C6 2 4 1 2 0.5C3 2 3 4 3.5 6C3 4 1.5 3 0 3C1.5 5 2.5 7 4 8C2.5 8 1 9 0 10.5C2 9.5 4 9 5.5 8C6.5 10 8 11 9 11.5L8 6Z" fill="#D4A853" />
                  </svg>
                </div>

                <h3 className="font-accent font-bold text-lg text-pacame-white mb-0.5">Pablo</h3>
                <p className="text-[11px] text-olympus-gold/60 font-body mb-2 italic">
                  El Arquitecto
                </p>
                <p className="text-xs text-pacame-white/35 font-body mb-3 uppercase tracking-wider">
                  CEO — El humano del equipo
                </p>
                <p className="text-sm text-pacame-white/50 font-body leading-relaxed">
                  Supervisa cada entrega. Garantiza que los resultados superen las expectativas.
                </p>
              </div>
            </motion.div>
            </CardTiltContent>
            </CardTilt>
          </StaggerItem>
        </StaggerContainer>

        {/* CTA */}
        <ScrollReveal className="text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" size="lg" asChild className="group rounded-full shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500">
            <Link href="/equipo">
              Conoce a tu equipo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="group rounded-full border-olympus-gold/20 hover:border-olympus-gold/40 hover:bg-olympus-gold/5">
            <Link href="/servicios">
              Ver servicios y precios
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

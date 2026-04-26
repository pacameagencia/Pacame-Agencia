"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import CountUpNumber from "@/components/effects/CountUpNumber";
import { FancyText } from "@/components/ui/fancy-text";

const steps = [
  {
    number: 1,
    title: "Cuentanos tu problema",
    description:
      "Agenda una llamada de 30 minutos con Pablo. Escuchamos primero, cotizamos despues. Sin formularios eternos.",
    color: "#B54E30",
    agents: ["sage"],
  },
  {
    number: 2,
    title: "El equipo entra en accion",
    description:
      "Sage diagnostica, Nova disena, Pixel construye, Atlas posiciona. Cada agente hace lo suyo. En paralelo.",
    color: "#283B70",
    agents: ["sage", "nova", "pixel", "atlas"],
  },
  {
    number: 3,
    title: "Recibes tu entregable",
    description:
      "En dias, no en semanas. Pablo revisa antes de entregarte. Con metricas, guia de uso y soporte.",
    color: "#84CC16",
    agents: ["pablo"],
  },
];

const agentColors: Record<string, string> = {
  sage: "#D97706",
  nova: "#B54E30",
  pixel: "#283B70",
  atlas: "#2563EB",
  pablo: "#E8B730",
};

function AnimatedPath() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="absolute left-7 top-0 bottom-0 w-px hidden md:block">
      <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
        {/* Background line */}
        <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(212,168,83,0.1)" strokeWidth="2" />
        {/* Animated golden line */}
        <motion.line
          x1="0" y1="0" x2="0" y2="100%"
          stroke="url(#goldGrad)"
          strokeWidth="2"
          style={{ pathLength }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B54E30" />
            <stop offset="50%" stopColor="#E8B730" />
            <stop offset="100%" stopColor="#84CC16" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="section-padding bg-paper relative">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="line" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.2em]">
            Como funciona
          </p>
          <h2 className="font-accent font-bold text-section text-ink text-balance">
            De problema a solucion.{" "}
            <FancyText
              className="font-accent font-bold text-section text-olympus-gold/15"
              fillClassName="gradient-text-gold"
              stagger={0.05}
              duration={1}
              delay={0.3}
            >
              En tres pasos.
            </FancyText>
          </h2>
        </ScrollReveal>

        {/* Steps — vertical timeline */}
        <div className="relative max-w-3xl mx-auto mb-16">
          <AnimatedPath />

          <StaggerContainer className="space-y-16 md:pl-20" staggerDelay={0.15}>
            {steps.map((step) => (
              <StaggerItem key={step.number}>
                <div className="relative">
                  {/* Step number — luminous circle */}
                  <div className="hidden md:flex absolute -left-20 top-0 w-14 h-14 items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{
                        backgroundColor: step.color,
                        boxShadow: `0 0 30px ${step.color}40`,
                      }}
                    />
                    <div
                      className="relative font-heading font-bold text-xl"
                      style={{ color: step.color }}
                    >
                      <CountUpNumber target={step.number} duration={1} prefix="0" />
                    </div>
                  </div>

                  {/* Mobile number */}
                  <div
                    className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 text-base font-heading font-bold"
                    style={{
                      backgroundColor: `${step.color}15`,
                      color: step.color,
                    }}
                  >
                    0{step.number}
                  </div>

                  <h3 className="font-heading font-bold text-xl text-ink mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[15px] text-ink/65 font-body leading-relaxed mb-4 max-w-lg">
                    {step.description}
                  </p>

                  {/* Agent avatars */}
                  <div className="flex items-center gap-1.5">
                    {step.agents.map((agent) => (
                      <div
                        key={agent}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-heading font-bold text-white/90 border border-white/10"
                        style={{ backgroundColor: `${agentColors[agent]}30` }}
                        title={agent.charAt(0).toUpperCase() + agent.slice(1)}
                      >
                        {agent.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    <span className="text-[11px] text-ink/55 font-body ml-1.5">
                      {step.agents.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Tagline + CTA */}
        <ScrollReveal className="text-center" delay={0.3}>
          <div className="inline-block rounded-2xl px-8 py-5 border border-olympus-gold/15 bg-dark-card mb-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-olympus-gold/[0.03] via-transparent to-olympus-gold/[0.03]" />
            <p className="font-accent font-bold text-lg sm:text-xl text-ink text-balance relative">
              Lo que una agencia tarda semanas,{" "}
              <span className="gradient-text-aurora">nosotros lo entregamos en dias.</span>
            </p>
          </div>
          <div>
            <Button variant="gradient" size="lg" asChild className="group rounded-full shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500">
              <Link href="/contacto">
                Empezar ahora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

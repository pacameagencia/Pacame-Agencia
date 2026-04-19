"use client";

import { MessageSquare, ShoppingBag, Workflow, PackageCheck } from "lucide-react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";

// 4 pasos estilo Stripe — simple, numerado, action-oriented
const steps = [
  {
    n: "01",
    Icon: MessageSquare,
    title: "Cuentanos que necesitas",
    desc: "Llamada de 15 min o mensaje directo. Sin formularios eternos.",
  },
  {
    n: "02",
    Icon: ShoppingBag,
    title: "Eliges producto o plan",
    desc: "24 productos a la carta, 4 planes mensuales o apps a medida.",
  },
  {
    n: "03",
    Icon: Workflow,
    title: "Tu equipo IA ejecuta",
    desc: "10 agentes coordinados por Pablo. Entrega en horas, no semanas.",
  },
  {
    n: "04",
    Icon: PackageCheck,
    title: "Recibes y escalas",
    desc: "Todo en tu portal. Soporte continuo, metricas claras, iteracion rapida.",
  },
];

export default function HowItWorksStripe() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="px-6">
        <GoldenDivider variant="line" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-[12px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.22em]">
            Como funciona
          </p>
          <h2 className="font-accent font-bold text-section text-pacame-white mb-5 text-balance">
            Cuatro pasos.{" "}
            <span className="gradient-text-gold">Cero friccion.</span>
          </h2>
          <p className="text-lg text-pacame-white/50 max-w-xl mx-auto font-body">
            Disenado para lanzar rapido. Pago unico o suscripcion, tu eliges.
          </p>
        </ScrollReveal>

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          staggerDelay={0.08}
        >
          {steps.map((step) => (
            <StaggerItem key={step.n}>
              <div className="relative rounded-2xl p-6 bg-dark-card border border-white/[0.06] hover:border-olympus-gold/30 transition-colors duration-500 h-full flex flex-col">
                {/* Numero grande, estilo editorial */}
                <div className="flex items-start justify-between mb-6">
                  <span className="font-accent font-bold text-4xl text-olympus-gold/30">
                    {step.n}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-olympus-gold/10 border border-olympus-gold/20 flex items-center justify-center">
                    <step.Icon className="w-4 h-4 text-olympus-gold" />
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg text-pacame-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-pacame-white/50 font-body leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

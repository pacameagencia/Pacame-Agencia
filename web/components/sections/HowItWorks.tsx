"use client";

import { motion } from "framer-motion";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Cuentanos tu problema",
    description:
      "Agenda una llamada de 30 minutos con Pablo. Sin formularios eternos ni presupuestos ciegos. Escuchamos primero, cotizamos despues.",
    color: "#7C3AED",
    icon: "💬",
  },
  {
    number: "02",
    title: "El equipo entra en accion",
    description:
      "Sage diagnostica, Nova disena, Pixel construye, Atlas posiciona... Cada agente hace lo suyo. En paralelo. A velocidad IA.",
    color: "#06B6D4",
    icon: "⚡",
  },
  {
    number: "03",
    title: "Recibes tu entregable",
    description:
      "Tienes el trabajo en dias, no en semanas. Pablo revisa antes de entregarte. Con metricas, con guia de uso, con soporte.",
    color: "#84CC16",
    icon: "✅",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-dark-elevated relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-100" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-16">
          <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
            Como funciona
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            De problema a solucion.
            <br />
            <span className="gradient-text-vivid">En tres pasos.</span>
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 relative" staggerDelay={0.15}>
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-electric-violet/40 via-neon-cyan/40 to-lime-pulse/40" />
            <motion.div
              className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-electric-violet to-transparent"
              animate={{ left: ["0%", "66%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "blur(2px)" }}
            />
          </div>

          {steps.map((step) => (
            <StaggerItem key={step.number}>
              <div className="relative text-center group">
                {/* Number circle */}
                <div className="relative inline-flex mb-8">
                  <motion.div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl card-interactive"
                    style={{
                      backgroundColor: `${step.color}12`,
                      border: `1px solid ${step.color}25`,
                    }}
                    whileHover={{
                      scale: 1.08,
                      boxShadow: `0 0 40px ${step.color}30`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {step.icon}
                  </motion.div>
                  <div
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-heading shadow-lg"
                    style={{ backgroundColor: step.color, color: "#0D0D0D" }}
                  >
                    {step.number}
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
                  {step.title}
                </h3>
                <p className="text-pacame-white/60 font-body text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Tagline */}
        <ScrollReveal className="text-center mt-16" delay={0.3}>
          <motion.div
            className="inline-block glass-vivid rounded-2xl px-8 py-5"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <p className="font-heading font-bold text-xl text-pacame-white">
              Lo que una agencia tarda semanas,{" "}
              <span className="gradient-text-vivid">nosotros lo entregamos en dias.</span>
            </p>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}

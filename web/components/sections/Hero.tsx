"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] },
  },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-pacame-black">
      {/* Ambient orbs - subtle, Apple-like */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow */}
        <motion.div variants={itemVariants} className="mb-8">
          <span className="inline-flex items-center gap-2.5 text-[13px] font-body font-medium text-pacame-white/40 tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-pulse opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-pulse" />
            </span>
            Equipo disponible ahora
          </span>
        </motion.div>

        {/* Headline - massive, Apple-scale */}
        <motion.h1
          variants={itemVariants}
          className="font-heading font-bold text-hero text-pacame-white mb-8 text-balance"
        >
          Tu problema digital.
          <br />
          <span className="gradient-text-vivid">Resuelto hoy.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl sm:text-2xl text-pacame-white/50 max-w-2xl mx-auto mb-12 leading-relaxed font-body font-light text-balance"
        >
          7 agentes IA especializados, liderados por un humano.
          Calidad de agencia, velocidad de IA, precio de freelancer.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Button variant="gradient" size="xl" asChild className="group rounded-full min-w-[240px] shadow-glow-violet">
            <Link href="/servicios">
              Ver servicios desde 300{"\u00A0"}{"\u20AC"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild className="rounded-full min-w-[200px] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]">
            <Link href="/contacto">
              Hablar con el equipo
            </Link>
          </Button>
        </motion.div>

        {/* Stats - clean, minimal */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden max-w-3xl mx-auto"
        >
          {[
            { value: "7", label: "Especialistas IA" },
            { value: "24h", label: "Entrega minima" },
            { value: "-60%", label: "vs agencia tradicional" },
            { value: "100%", label: "Supervision humana" },
          ].map((stat) => (
            <div key={stat.label} className="bg-pacame-black p-6 sm:p-8 text-center">
              <div className="font-heading font-bold text-2xl sm:text-3xl text-pacame-white mb-1.5">
                {stat.value}
              </div>
              <div className="text-xs text-pacame-white/50 font-body">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-pacame-black to-transparent z-[1]" />
    </section>
  );
}

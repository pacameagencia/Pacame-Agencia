"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import TextReveal from "@/components/effects/TextReveal";
import CountUpNumber from "@/components/effects/CountUpNumber";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

const GradientMeshCanvas = dynamic(
  () => import("@/components/effects/GradientMeshCanvas"),
  { ssr: false }
);
const ConstellationBackground = dynamic(
  () => import("@/components/effects/ConstellationBackground"),
  { ssr: false }
);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] },
  },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void-purple">
      {/* Animated gradient mesh background */}
      <GradientMeshCanvas
        colors={["#7C3AED", "#4338CA", "#06B6D4", "#D4A853"]}
        speed={0.25}
        intensity={0.1}
      />

      {/* Constellation stars overlay */}
      <ConstellationBackground density={50} interactive />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow — Olympus badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <span className="inline-flex items-center gap-2.5 text-[13px] font-body font-medium tracking-wide">
            {/* Golden laurel left */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="opacity-60">
              <path d="M8 6C6 2 4 1 2 0.5C3 2 3 4 3.5 6C3 4 1.5 3 0 3C1.5 5 2.5 7 4 8C2.5 8 1 9 0 10.5C2 9.5 4 9 5.5 8C6.5 10 8 11 9 11.5L8 6Z" fill="#D4A853" />
            </svg>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-pulse opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-pulse" />
            </span>
            <span className="gradient-text-gold">El Olimpo Digital</span>
            {/* Golden laurel right */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="opacity-60 scale-x-[-1]">
              <path d="M8 6C6 2 4 1 2 0.5C3 2 3 4 3.5 6C3 4 1.5 3 0 3C1.5 5 2.5 7 4 8C2.5 8 1 9 0 10.5C2 9.5 4 9 5.5 8C6.5 10 8 11 9 11.5L8 6Z" fill="#D4A853" />
            </svg>
          </span>
        </motion.div>

        {/* Headline — mixed fonts for premium feel */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-hero text-pacame-white text-balance">
            <TextReveal
              text="Tu problema digital."
              mode="words"
              tag="span"
              className="font-accent font-bold block"
            />
            <TextReveal
              text="Resuelto hoy."
              mode="words"
              tag="span"
              className="font-heading font-bold gradient-text-aurora block mt-2"
              delay={0.4}
            />
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl sm:text-2xl text-pacame-white/50 max-w-2xl mx-auto mb-12 leading-relaxed font-body font-light text-balance"
        >
          7 agentes IA especializados, liderados por un humano.
          <br className="hidden sm:block" />
          Calidad de agencia, velocidad de IA, precio de freelancer.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <MagneticButton>
            <ShinyButton
              gradientFrom="#D4A853"
              gradientTo="#7C3AED"
              gradientOpacity={0.8}
              className="group min-w-[260px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <Link href="/servicios" className="flex items-center gap-2 text-pacame-white">
                Ver servicios desde 300{"\u00A0"}{"\u20AC"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ShinyButton>
          </MagneticButton>
          <Button
            variant="outline"
            size="xl"
            asChild
            className="rounded-full min-w-[200px] border-white/[0.08] hover:border-olympus-gold/30 hover:bg-white/[0.03] transition-colors duration-500"
          >
            <Link href="/contacto">Hablar con el equipo</Link>
          </Button>
        </motion.div>

        {/* Stats — floating glassmorphism cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
        >
          {[
            { value: 7, label: "Especialistas IA", suffix: "" },
            { value: 24, label: "Entrega minima", suffix: "h" },
            { value: 60, label: "vs agencia tradicional", prefix: "-", suffix: "%" },
            { value: 100, label: "Supervision humana", suffix: "%" },
          ].map((stat) => (
            <CardTilt key={stat.label} tiltMaxAngle={10} scale={1.04}>
              <CardTiltContent>
                <div className="relative glass rounded-2xl p-5 sm:p-6 text-center border-t border-olympus-gold/10 hover:border-olympus-gold/20 transition-colors duration-500">
                  <div className="font-heading font-bold text-2xl sm:text-3xl text-pacame-white mb-1.5">
                    <CountUpNumber
                      target={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </div>
                  <div className="text-xs text-pacame-white/50 font-body">{stat.label}</div>
                </div>
              </CardTiltContent>
            </CardTilt>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="text-[11px] font-body text-olympus-gold/50 tracking-widest uppercase">
          Descubre
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4 text-olympus-gold/40" />
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-pacame-black to-transparent z-[1]" />
    </section>
  );
}

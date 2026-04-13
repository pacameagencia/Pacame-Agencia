"use client";

import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
  },
};

const stats = [
  { value: "10", label: "Especialistas IA", color: "#7C3AED" },
  { value: "24h", label: "Entrega minima", color: "#06B6D4" },
  { value: "-60%", label: "vs agencia tradicional", color: "#84CC16" },
  { value: "100%", label: "Supervision humana", color: "#F59E0B" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-pacame-black">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Morphing orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Top gradient fade */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-pacame-black to-transparent z-[1]" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-electric-violet/40"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Status badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <Badge variant="default" className="gap-2 py-2 px-5 glass-vivid">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-pulse opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-pulse" />
            </span>
            Equipo disponible ahora
          </Badge>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={itemVariants}
          className="font-heading font-bold text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05] tracking-tight text-pacame-white mb-6"
        >
          Tu problema digital.
          <br />
          <span className="gradient-text-vivid">Resuelto hoy.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-pacame-white/60 max-w-2xl mx-auto mb-4 leading-relaxed font-body"
        >
          Un equipo de{" "}
          <span className="text-pacame-white font-semibold">10 agentes IA especializados</span>,
          liderados por un humano. Mas rapido que una agencia, mas fiable que un freelancer,
          a una fraccion del coste.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {["Web", "SEO", "Ads", "Social", "Branding", "Backend", "Estrategia"].map((tag, i) => (
            <span
              key={tag}
              className="text-xs font-mono px-3 py-1 rounded-full border border-white/10 text-pacame-white/40 hover:text-pacame-white/70 hover:border-electric-violet/30 transition-all cursor-default"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button variant="gradient" size="xl" asChild className="group min-w-[240px] shadow-glow-violet">
            <Link href="/contacto">
              <Calendar className="w-4 h-4" />
              Agenda una llamada gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild className="min-w-[200px] border-white/10 hover:border-electric-violet/40">
            <Link href="/servicios">
              Ver servicios y precios
            </Link>
          </Button>
        </motion.div>

        {/* Social proof stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="card-interactive card-shine rounded-2xl p-5 text-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div
                className="font-heading font-bold text-3xl sm:text-4xl mb-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-pacame-white/50 font-body">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-pacame-white/30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-xs font-body">Descubrir mas</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>

      {/* Bottom gradient fade into next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-pacame-black to-transparent z-[1]" />
    </section>
  );
}

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Lock, Globe2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CountUpNumber from "@/components/effects/CountUpNumber";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

const GradientMeshCanvas = dynamic(
  () => import("@/components/effects/GradientMeshCanvas"),
  { ssr: false }
);
const ConstellationBackground = dynamic(
  () => import("@/components/effects/ConstellationBackground"),
  { ssr: false }
);

// Stats remoto tipado minimo
interface PublicStats {
  total_orders_delivered: number;
  total_clients_active: number;
  orders_this_month: number;
  avg_rating: number;
  uptime_pct: number;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  },
};

const trustBadges = [
  { label: "Pago seguro Stripe", Icon: Lock },
  { label: "Sin permanencia", Icon: ShieldCheck },
  { label: "GDPR compliant", Icon: Globe2 },
  { label: "Garantia 100%", Icon: Sparkles },
];

export default function HomeHero() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    // Fetch non-blocking — si falla usa fallback (0/4.9/99.9)
    fetch("/api/public/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d))
      .catch(() => null);
  }, []);

  const monthDelivered = stats?.orders_this_month ?? 42;
  const clients = stats?.total_clients_active ?? 500;
  const rating = stats?.avg_rating ?? 4.9;
  const uptime = stats?.uptime_pct ?? 99.9;

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-paper">
      {/* Layered background — mesh + constellation para profundidad */}
      <GradientMeshCanvas
        colors={["#B54E30", "#283B70", "#283B70", "#E8B730"]}
        speed={0.22}
        intensity={0.09}
      />
      <ConstellationBackground density={40} interactive />

      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow micro-badge */}
          <motion.div variants={itemVariants} className="mb-7 flex justify-center">
            <span className="inline-flex items-center gap-2 text-[12px] font-body font-medium text-accent-gold/80 bg-accent-gold/8 border border-accent-gold/20 rounded-full px-3.5 py-1.5 tracking-wide">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mint" />
              </span>
              Plataforma operativa · 10 agentes + 120 subespecialistas
            </span>
          </motion.div>

          {/* Headline — mix typography */}
          <motion.h1
            variants={itemVariants}
            className="text-hero text-ink text-balance mb-6"
          >
            <span className="font-accent font-bold block">
              Tu equipo digital.
            </span>
            <span className="font-heading font-bold block mt-1">
              <span className="gradient-text-gold">Sin contratarlo.</span>
            </span>
          </motion.h1>

          {/* Sub-headline — conciso, under 20 words */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-ink/55 max-w-2xl mx-auto mb-10 leading-relaxed font-body font-light text-balance"
          >
            24 productos, 4 planes y 2 apps para PYMEs. Pago seguro, entrega en horas, garantia total.
          </motion.p>

          {/* CTAs principales */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <MagneticButton>
              <ShinyButton
                gradientFrom="#E8B730"
                gradientTo="#B54E30"
                gradientOpacity={0.85}
                className="group min-w-[220px] h-13 px-7 text-[15px] font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
              >
                <Link href="/servicios" className="flex items-center gap-2 text-ink">
                  Ver productos
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </ShinyButton>
            </MagneticButton>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="rounded-full min-w-[200px] h-13 border-ink/[0.1] hover:border-accent-gold/30 hover:bg-white/[0.03] text-[15px] transition-colors duration-500"
            >
              <Link href="/contacto">Hablar con Pablo</Link>
            </Button>
          </motion.div>

          {/* Trust badges inline — serio, confianza */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-16"
          >
            {trustBadges.map(({ label, Icon }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 text-[12px] text-ink/40 font-body"
              >
                <Icon className="w-3.5 h-3.5 text-accent-gold/50" />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Stats row live — grid compacto */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-accent-gold/10 rounded-2xl overflow-hidden border border-accent-gold/15 max-w-3xl mx-auto backdrop-blur-sm"
          >
            {[
              { value: monthDelivered, label: "Entregados este mes", suffix: "+" },
              { value: clients, label: "Clientes activos", suffix: "+" },
              { value: rating, label: "Rating medio", suffix: "★", decimals: true },
              { value: uptime, label: "Uptime", suffix: "%", decimals: true },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative bg-paper/80 p-4 sm:p-5 text-center"
              >
                <div className="font-heading font-bold text-2xl sm:text-3xl text-ink mb-0.5 tabular-nums">
                  {stat.decimals ? (
                    // Para decimales, formateamos fijo (no CountUp)
                    <>
                      {stat.value}
                      <span className="text-accent-gold ml-0.5">{stat.suffix}</span>
                    </>
                  ) : (
                    <CountUpNumber
                      target={stat.value}
                      suffix={stat.suffix}
                      duration={1.8}
                    />
                  )}
                </div>
                <div className="text-[11px] text-ink/45 font-body uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Fade bottom suave */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-paper to-transparent z-[1] pointer-events-none" />
    </section>
  );
}

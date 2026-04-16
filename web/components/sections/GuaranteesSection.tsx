"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Shield, Clock, RefreshCw, Lock, Eye, HeadphonesIcon } from "lucide-react";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

const guarantees = [
  {
    icon: Shield,
    title: "Garantia de satisfaccion",
    description: "Si no estas satisfecho, revisamos el trabajo sin coste extra. Tu aprobacion final es lo unico que importa.",
    accent: "#D4A853",
  },
  {
    icon: Clock,
    title: "Entrega en plazo garantizado",
    description: "Cada proyecto tiene un deadline cerrado antes de empezar. Si nos retrasamos, te compensamos.",
    accent: "#06B6D4",
  },
  {
    icon: RefreshCw,
    title: "Revisiones ilimitadas incluidas",
    description: "Hasta que el resultado sea exactamente lo que necesitas. Sin costes ocultos ni sorpresas.",
    accent: "#7C3AED",
  },
  {
    icon: Lock,
    title: "Datos 100% protegidos",
    description: "Servidores europeos (Supabase EU), cifrado en transito y reposo, conforme al RGPD.",
    accent: "#4ECDC4",
  },
  {
    icon: Eye,
    title: "Supervision humana completa",
    description: "Cada entregable pasa por revision humana. La IA asiste, los humanos deciden.",
    accent: "#FF6B9D",
  },
  {
    icon: HeadphonesIcon,
    title: "Soporte en menos de 2 horas",
    description: "Respuesta garantizada en horario laboral. Un humano real, no un bot, se encarga de ti.",
    accent: "#D4A853",
  },
];

export default function GuaranteesSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="section-padding relative bg-[#0A0A0A]">
      <div className="px-6">
        <GoldenDivider variant="laurel" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-olympus-radial pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.2em]">
            Nuestro compromiso
          </p>
          <h2 className="font-accent font-bold text-section text-pacame-white mb-4 text-balance">
            Garantias que{" "}
            <span className="gradient-text-gold">puedes tocar</span>
          </h2>
          <p className="text-lg text-pacame-white/40 font-body max-w-2xl mx-auto">
            No hablamos de promesas vacias. Cada garantia esta respaldada por procesos reales y compromiso contractual.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {guarantees.map((item, i) => {
            const Icon = item.icon;
            return (
              <CardTilt key={item.title} tiltMaxAngle={8} scale={1.02}>
              <CardTiltContent>
              <motion.div
                className="group relative rounded-2xl p-7 bg-dark-card border border-white/[0.06] hover:border-olympus-gold/15 transition-all duration-500 card-golden-shine"
                initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.accent}40, transparent)` }}
                />

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: `${item.accent}10` }}
                >
                  <Icon className="w-6 h-6" style={{ color: item.accent }} />
                </div>

                <h3 className="font-heading font-bold text-lg text-pacame-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-pacame-white/45 font-body leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
              </CardTiltContent>
              </CardTilt>
            );
          })}
        </div>
      </div>
    </section>
  );
}

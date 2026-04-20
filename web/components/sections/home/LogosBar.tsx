"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Store,
  UtensilsCrossed,
  Stethoscope,
  Briefcase,
  Dumbbell,
  GraduationCap,
  Wrench,
  Scissors,
} from "lucide-react";

// Sectores tipicos de clientes PACAME (placeholders de logos reales)
// NOTA: reemplazar por logos reales cuando Pablo los suba
const sectors = [
  { label: "Retail", Icon: Store },
  { label: "Restauracion", Icon: UtensilsCrossed },
  { label: "Clinicas", Icon: Stethoscope },
  { label: "Consultoria", Icon: Briefcase },
  { label: "Fitness", Icon: Dumbbell },
  { label: "Formacion", Icon: GraduationCap },
  { label: "Servicios", Icon: Wrench },
  { label: "Belleza", Icon: Scissors },
];

export default function LogosBar() {
  const reduced = useReducedMotion();

  return (
    <section className="relative py-16 bg-paper">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-gold/15 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.p
          className="text-center text-[11px] font-body font-medium text-ink/35 uppercase tracking-[0.24em] mb-10"
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
        >
          Usado por PYMEs en toda Espana y LATAM
        </motion.p>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.05]">
          {sectors.map((s, i) => (
            <motion.div
              key={s.label}
              className="bg-paper flex flex-col items-center justify-center gap-2 py-6 text-ink/25 hover:text-ink/55 hover:bg-white/[0.02] transition-all duration-500 group"
              initial={reduced ? {} : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <s.Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
              <span className="text-[10px] font-body tracking-wider uppercase">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-gold/10 to-transparent" />
    </section>
  );
}

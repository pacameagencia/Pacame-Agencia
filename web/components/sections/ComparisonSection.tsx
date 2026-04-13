"use client";

import { Check, X, Minus } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

type CellValue = "yes" | "no" | "partial" | string;

interface ComparisonRow {
  feature: string;
  agency: CellValue;
  freelancer: CellValue;
  diy: CellValue;
  pacame: CellValue;
}

const rows: ComparisonRow[] = [
  { feature: "Precio web corporativa", agency: "5.000-15.000 EUR", freelancer: "1.000-3.000 EUR", diy: "150-400 EUR/ano", pacame: "800-1.500 EUR" },
  { feature: "Plazo de entrega", agency: "4-8 semanas", freelancer: "2-4 semanas", diy: "DIY (tu tiempo)", pacame: "5-7 dias" },
  { feature: "Equipo multidisciplinar", agency: "yes", freelancer: "no", diy: "no", pacame: "yes" },
  { feature: "Estrategia incluida", agency: "partial", freelancer: "no", diy: "no", pacame: "yes" },
  { feature: "SEO profesional", agency: "partial", freelancer: "partial", diy: "no", pacame: "yes" },
  { feature: "Copywriting incluido", agency: "partial", freelancer: "no", diy: "no", pacame: "yes" },
  { feature: "Diseno personalizado", agency: "yes", freelancer: "partial", diy: "no", pacame: "yes" },
  { feature: "Codigo propio (sin cuotas)", agency: "yes", freelancer: "partial", diy: "no", pacame: "yes" },
  { feature: "Disponibilidad ampliada", agency: "no", freelancer: "no", diy: "yes", pacame: "yes" },
  { feature: "Supervision humana", agency: "yes", freelancer: "yes", diy: "no", pacame: "yes" },
  { feature: "Garantia de satisfaccion", agency: "partial", freelancer: "no", diy: "no", pacame: "yes" },
  { feature: "Soporte post-entrega", agency: "partial", freelancer: "partial", diy: "partial", pacame: "yes" },
];

function CellContent({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === "yes") {
    return (
      <div className={`flex items-center justify-center ${highlight ? "text-lime-pulse" : "text-lime-pulse/70"}`}>
        <Check className="w-5 h-5" />
      </div>
    );
  }
  if (value === "no") {
    return (
      <div className="flex items-center justify-center text-rose-alert/60">
        <X className="w-5 h-5" />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="flex items-center justify-center text-amber-signal/60">
        <Minus className="w-5 h-5" />
      </div>
    );
  }
  return (
    <span className={`text-xs font-body ${highlight ? "text-pacame-white font-medium" : "text-pacame-white/50"}`}>
      {value}
    </span>
  );
}

const summaryCards = [
  {
    vs: "vs Agencia",
    stat: "60-80% mas barato",
    detail: "Mismo equipo multidisciplinar, sin el overhead de oficinas y reuniones internas.",
    color: "#7C3AED",
  },
  {
    vs: "vs Freelancer",
    stat: "10 especialistas por el precio de 1",
    detail: "No dependes de una sola persona. Equipo completo con proceso estructurado.",
    color: "#06B6D4",
  },
  {
    vs: "vs DIY (Wix)",
    stat: "Estrategia real, no templates",
    detail: "Web personalizada con SEO, copy y codigo propio. Sin cuotas mensuales eternas.",
    color: "#84CC16",
  },
];

export default function ComparisonSection() {
  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-electric-violet/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12">
          <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
            Comparativa
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            PACAME vs las alternativas.
            <br />
            <span className="gradient-text-vivid">Tu decides.</span>
          </h2>
          <p className="text-pacame-white/50 font-body max-w-2xl mx-auto">
            Sin humo. Los hechos comparados para que tomes la mejor decision.
          </p>
        </ScrollReveal>

        {/* Table */}
        <ScrollReveal>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden card-shine">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-4 text-sm font-heading font-semibold text-pacame-white/40 w-[200px]">
                      Criterio
                    </th>
                    <th className="p-4 text-center text-sm font-heading font-semibold text-pacame-white/40">
                      Agencia tradicional
                    </th>
                    <th className="p-4 text-center text-sm font-heading font-semibold text-pacame-white/40">
                      Freelancer
                    </th>
                    <th className="p-4 text-center text-sm font-heading font-semibold text-pacame-white/40">
                      DIY (Wix/Squarespace)
                    </th>
                    <th className="p-4 text-center text-sm font-heading font-semibold text-electric-violet relative">
                      <div className="absolute inset-0 bg-electric-violet/10" />
                      <span className="relative">PACAME</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/[0.04] ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                    >
                      <td className="p-4 text-sm font-body text-pacame-white/70">
                        {row.feature}
                      </td>
                      <td className="p-4 text-center">
                        <CellContent value={row.agency} />
                      </td>
                      <td className="p-4 text-center">
                        <CellContent value={row.freelancer} />
                      </td>
                      <td className="p-4 text-center">
                        <CellContent value={row.diy} />
                      </td>
                      <td className="p-4 text-center relative">
                        <div className="absolute inset-0 bg-electric-violet/6" />
                        <div className="relative">
                          <CellContent value={row.pacame} highlight />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom summary cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8" staggerDelay={0.1}>
          {summaryCards.map((card) => (
            <StaggerItem key={card.vs}>
              <motion.div
                className="rounded-xl p-5 border transition-all"
                style={{
                  backgroundColor: `${card.color}08`,
                  borderColor: `${card.color}20`,
                }}
                whileHover={{
                  y: -4,
                  borderColor: `${card.color}50`,
                  boxShadow: `0 0 30px ${card.color}15`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: card.color }}>
                  {card.vs}
                </div>
                <div className="font-heading font-bold text-pacame-white text-sm mb-1">
                  {card.stat}
                </div>
                <p className="text-xs text-pacame-white/50 font-body">{card.detail}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

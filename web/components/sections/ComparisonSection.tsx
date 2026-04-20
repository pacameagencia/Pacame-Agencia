"use client";

import { Check, X, Minus, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import { FancyText } from "@/components/ui/fancy-text";

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
      <div className={`flex items-center justify-center ${highlight ? "text-accent-gold" : "text-ink/25"}`}>
        <Check className="w-4 h-4" />
      </div>
    );
  }
  if (value === "no") {
    return (
      <div className="flex items-center justify-center text-ink/15">
        <X className="w-4 h-4" />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="flex items-center justify-center text-ink/20">
        <Minus className="w-4 h-4" />
      </div>
    );
  }
  return (
    <span className={`text-xs font-body ${highlight ? "text-ink font-medium" : "text-ink/40"}`}>
      {value}
    </span>
  );
}

const summaryCards = [
  {
    vs: "vs Agencia",
    stat: "60-80% mas barato",
    detail: "Mismo equipo multidisciplinar, sin overhead de oficinas y reuniones.",
    color: "#7C3AED",
  },
  {
    vs: "vs Freelancer",
    stat: "10 especialistas x1 precio",
    detail: "No dependes de una sola persona. Equipo completo con proceso estructurado.",
    color: "#06B6D4",
  },
  {
    vs: "vs DIY (Wix)",
    stat: "Estrategia real",
    detail: "Web personalizada con SEO, copy y codigo propio. Sin cuotas eternas.",
    color: "#84CC16",
  },
];

export default function ComparisonSection() {
  return (
    <section className="section-padding bg-paper relative">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="laurel" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-[13px] font-body font-medium text-accent-gold/70 mb-4 uppercase tracking-[0.2em]">
            Comparativa
          </p>
          <h2 className="font-accent font-bold text-section text-ink mb-6 text-balance">
            PACAME vs las alternativas.{" "}
            <FancyText
              className="font-accent font-bold text-section text-accent-gold/15"
              fillClassName="gradient-text-gold"
              stagger={0.06}
              duration={1}
              delay={0.2}
            >
              Tu decides.
            </FancyText>
          </h2>
        </ScrollReveal>

        {/* Table */}
        <ScrollReveal>
          <div className="rounded-2xl border border-ink/[0.06] overflow-hidden bg-paper-deep">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-ink/[0.06]">
                    <th className="text-left p-4 text-xs font-body font-medium text-ink/30 uppercase tracking-wider w-[200px]">
                      Criterio
                    </th>
                    <th className="p-4 text-center text-xs font-body font-medium text-ink/30 uppercase tracking-wider">
                      Agencia
                    </th>
                    <th className="p-4 text-center text-xs font-body font-medium text-ink/30 uppercase tracking-wider">
                      Freelancer
                    </th>
                    <th className="p-4 text-center text-xs font-body font-medium text-ink/30 uppercase tracking-wider">
                      DIY
                    </th>
                    {/* PACAME column header — golden */}
                    <th className="p-4 text-center text-xs font-body font-semibold text-accent-gold uppercase tracking-wider relative">
                      <div className="absolute inset-0 bg-accent-gold/[0.06]" />
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent" />
                      <span className="relative">PACAME</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-white/[0.03] last:border-0 group/row hover:bg-white/[0.01] transition-colors duration-300 relative"
                    >
                      {/* Golden left indicator on hover */}
                      <td className="p-4 text-sm font-body text-ink/50 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-hover/row:h-6 bg-accent-gold/50 transition-all duration-300 rounded-r" />
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
                        <div className="absolute inset-0 bg-accent-gold/[0.04]" />
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

        {/* Summary cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8" staggerDelay={0.1}>
          {summaryCards.map((card) => (
            <StaggerItem key={card.vs}>
              <CardTilt tiltMaxAngle={8} scale={1.02}>
              <CardTiltContent>
              <motion.div
                className="group rounded-2xl p-6 border border-ink/[0.06] bg-paper-deep transition-all duration-500 ease-apple hover:border-accent-gold/20 relative overflow-hidden"
                whileHover={{ y: -3 }}
              >
                {/* Hover golden glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-accent-gold/[0.04] to-transparent" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-body font-medium uppercase tracking-[0.15em]"
                      style={{ color: card.color }}
                    >
                      {card.vs}
                    </span>
                    {/* Trophy on hover */}
                    <Trophy className="w-4 h-4 text-accent-gold/0 group-hover:text-accent-gold/50 transition-all duration-500" />
                  </div>
                  <div className="font-heading font-bold text-ink text-base mb-2">
                    {card.stat}
                  </div>
                  <p className="text-sm text-ink/35 font-body leading-relaxed">{card.detail}</p>
                </div>
              </motion.div>
              </CardTiltContent>
              </CardTilt>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

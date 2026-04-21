"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  Info,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Cell value: boolean -> check/minus, string -> valor textual, number -> count
type CellValue = boolean | string | number;

interface Feature {
  label: string;
  tooltip?: string;
  values: [CellValue, CellValue, CellValue, CellValue]; // Start/Pro/Growth/Scale
}

interface FeatureGroup {
  title: string;
  features: Feature[];
}

interface Plan {
  slug: string;
  tier: string;
  price: number;
  featured: boolean;
}

// Plan headers (fallback estatico — los precios viven en DB pero aqui mostramos etiquetas)
const defaultPlans: Plan[] = [
  { slug: "start", tier: "Start", price: 29, featured: false },
  { slug: "pro", tier: "Pro", price: 149, featured: true },
  { slug: "growth", tier: "Growth", price: 399, featured: false },
  { slug: "scale", tier: "Scale", price: 999, featured: false },
];

// Fallback feature matrix — las 6 categorias agrupadas
const defaultGroups: FeatureGroup[] = [
  {
    title: "Web y dominio",
    features: [
      {
        label: "Web corporativa + hosting",
        tooltip: "Nextjs + Vercel + dominio configurado",
        values: ["1 pagina", "Hasta 5 pags", "Ilimitadas", "Ilimitadas"],
      },
      {
        label: "Landing pages adicionales",
        values: [false, 2, 5, "Ilimitadas"],
      },
      {
        label: "E-commerce Stripe-ready",
        values: [false, false, true, true],
      },
      {
        label: "Edicion mensual",
        tooltip: "Updates, cambios visuales, nuevas secciones",
        values: ["1 hora", "3 horas", "8 horas", "Ilimitado"],
      },
    ],
  },
  {
    title: "Redes sociales",
    features: [
      {
        label: "Posts RRSS / mes",
        values: [4, 12, 20, "40+"],
      },
      {
        label: "Reels + carruseles",
        values: [false, true, true, true],
      },
      {
        label: "Estrategia de contenido",
        values: [false, "Basica", "Avanzada", "Premium"],
      },
      {
        label: "Community management",
        values: [false, false, true, true],
      },
    ],
  },
  {
    title: "SEO y posicionamiento",
    features: [
      {
        label: "SEO on-page",
        values: ["Setup", true, true, true],
      },
      {
        label: "Articulos de blog / mes",
        values: [0, 2, 4, 8],
      },
      {
        label: "Link building",
        values: [false, false, true, "Premium"],
      },
      {
        label: "Auditoria tecnica",
        values: [false, "Trimestral", "Mensual", "Continua"],
      },
    ],
  },
  {
    title: "Publicidad digital (Ads)",
    features: [
      {
        label: "Meta Ads gestionados",
        values: [false, false, true, true],
      },
      {
        label: "Google Ads gestionados",
        values: [false, false, true, true],
      },
      {
        label: "Budget recomendado / mes",
        values: ["-", "-", "500-2k€", "2k+€"],
      },
      {
        label: "Reporting mensual",
        values: [false, "Basic", "Detallado", "Dashboard live"],
      },
    ],
  },
  {
    title: "Apps productizadas",
    features: [
      {
        label: "Apps incluidas",
        tooltip: "Contact Forms, Agenda Pro, etc.",
        values: [0, 1, 2, "Todas"],
      },
      {
        label: "Chatbot WhatsApp",
        values: [false, false, true, true],
      },
      {
        label: "Automatizaciones n8n",
        values: [false, false, 3, "Ilimitadas"],
      },
    ],
  },
  {
    title: "Soporte y garantias",
    features: [
      {
        label: "Tiempo de respuesta",
        values: ["48h", "24h", "12h", "2h"],
      },
      {
        label: "Acceso directo a Pablo",
        values: [false, "Email", "2h/mes", "8h/mes"],
      },
      {
        label: "Reunion mensual",
        values: [false, false, true, "Semanal"],
      },
      {
        label: "Garantia 7 dias",
        values: [true, true, true, true],
      },
    ],
  },
];

function Cell({ value, featured }: { value: CellValue; featured?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check
        className={`w-5 h-5 mx-auto ${
          featured ? "text-accent-gold" : "text-emerald-400/80"
        }`}
      />
    ) : (
      <Minus className="w-4 h-4 mx-auto text-ink/20" />
    );
  }
  return (
    <span
      className={`text-sm font-body ${
        featured ? "text-ink" : "text-ink/75"
      }`}
    >
      {value}
    </span>
  );
}

interface Props {
  plans?: Plan[];
  groups?: FeatureGroup[];
}

export default function ComparePricingTable({
  plans = defaultPlans,
  groups = defaultGroups,
}: Props) {
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <p className="text-[12px] font-body font-medium text-accent-gold/70 mb-3 uppercase tracking-[0.22em]">
          Comparativa completa
        </p>
        <h2 className="font-accent font-bold text-section text-ink mb-3 text-balance">
          Elige con{" "}
          <span className="gradient-text-gold">total claridad.</span>
        </h2>
        <p className="text-ink/55 font-body max-w-xl mx-auto">
          Cada feature, cada quota. Sin letra pequena.
        </p>
      </div>

      <div className="overflow-x-auto -mx-6 px-6 pb-2">
        <table className="w-full border-separate border-spacing-0 min-w-[720px]">
          {/* Sticky header */}
          <thead className="sticky top-0 z-20 bg-paper">
            <tr>
              <th className="text-left py-5 px-4 font-heading font-semibold text-ink/50 text-sm uppercase tracking-wider w-[26%] bg-paper border-b border-accent-gold/20">
                Features
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.slug}
                  className={`text-center py-5 px-4 bg-paper border-b border-accent-gold/20 ${
                    plan.featured ? "relative" : ""
                  }`}
                  style={plan.featured ? { width: "19%" } : { width: "18%" }}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-gold text-ink text-[10px] font-heading font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
                      <Sparkles className="w-2.5 h-2.5" />
                      POPULAR
                    </div>
                  )}
                  <div
                    className={`font-heading font-bold text-lg ${
                      plan.featured ? "text-accent-gold" : "text-ink"
                    }`}
                  >
                    {plan.tier}
                  </div>
                  <div className="font-heading font-bold text-2xl text-ink mt-1">
                    {plan.price}€
                    <span className="text-xs text-ink/50 font-body font-normal ml-0.5">
                      /mes
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <Fragment key={group.title}>
                {/* Group header */}
                <tr>
                  <td
                    colSpan={plans.length + 1}
                    className="py-5 pt-8 px-4 border-b border-white/[0.04]"
                  >
                    <span className="text-[11px] font-body font-semibold text-accent-gold uppercase tracking-[0.18em]">
                      {group.title}
                    </span>
                  </td>
                </tr>

                {group.features.map((feat, fi) => {
                  const tid = `${group.title}-${fi}`;
                  return (
                    <tr
                      key={tid}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-body text-ink/80">
                            {feat.label}
                          </span>
                          {feat.tooltip && (
                            <button
                              type="button"
                              onMouseEnter={() => setTooltipId(tid)}
                              onMouseLeave={() => setTooltipId(null)}
                              onFocus={() => setTooltipId(tid)}
                              onBlur={() => setTooltipId(null)}
                              className="relative text-ink/30 hover:text-accent-gold transition-colors"
                              aria-label={`Info: ${feat.label}`}
                            >
                              <Info className="w-3.5 h-3.5" />
                              {tooltipId === tid && (
                                <span className="absolute z-30 left-full ml-2 top-1/2 -translate-y-1/2 bg-paper-soft border border-accent-gold/20 rounded-lg px-3 py-2 text-xs text-ink/80 font-body w-56 shadow-apple whitespace-normal text-left">
                                  {feat.tooltip}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      {feat.values.map((val, idx) => (
                        <td
                          key={idx}
                          className={`py-3.5 px-4 text-center border-b border-white/[0.04] ${
                            plans[idx]?.featured
                              ? "bg-accent-gold/[0.04] border-l border-r border-accent-gold/20"
                              : ""
                          }`}
                        >
                          <Cell value={val} featured={plans[idx]?.featured} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}

            {/* Bottom row CTA */}
            <tr>
              <td className="py-6 px-4"></td>
              {plans.map((plan) => (
                <td
                  key={`cta-${plan.slug}`}
                  className={`py-6 px-4 text-center ${
                    plan.featured
                      ? "bg-accent-gold/[0.04] border-l border-r border-b border-accent-gold/20 rounded-b-xl"
                      : ""
                  }`}
                >
                  <Link
                    href="/planes"
                    className={`inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl text-xs font-heading font-semibold transition ${
                      plan.featured
                        ? "bg-accent-gold hover:bg-accent-gold/90 text-ink"
                        : "bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-ink"
                    }`}
                  >
                    Empezar
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-ink/40 font-body mt-6">
        Precios en euros, IVA incluido · Cancela cuando quieras · 7 dias de garantia
      </p>
    </div>
  );
}

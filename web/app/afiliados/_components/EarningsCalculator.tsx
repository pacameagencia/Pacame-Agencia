"use client";

import { useMemo, useState } from "react";

const PRODUCTS = [
  { key: "web", label: "Web Corporativa (800€ único)", price: 800, recurring: false },
  { key: "social", label: "Plan Redes Sociales (197€/mes)", price: 197, recurring: true },
  { key: "seo", label: "Plan SEO (297€/mes)", price: 297, recurring: true },
  { key: "pack", label: "Pack Web + Redes (193€/mes)", price: 193, recurring: true },
];

const PERCENT = 0.20;
const MONTHS = 12;

export function EarningsCalculator() {
  const [product, setProduct] = useState(PRODUCTS[2].key);
  const [perMonth, setPerMonth] = useState(3);

  const sel = PRODUCTS.find((p) => p.key === product) ?? PRODUCTS[0];

  const stats = useMemo(() => {
    const perSale = sel.price * PERCENT;
    const monthly = sel.recurring
      ? perSale * perMonth // primer mes: solo el primer cobro de cada nueva venta
      : perSale * perMonth;

    // Ingresos a 12 meses si mantienes el ritmo de `perMonth` ventas/mes:
    // - Para suscripciones: cada cohort genera perSale × min(12,N) meses;
    //   si entras 1 venta/mes durante 12 meses, suma = perSale × (12+11+…+1).
    // - Para one-time: simplemente perSale × N × 12.
    let annual = 0;
    if (sel.recurring) {
      for (let m = 1; m <= 12; m++) {
        // ventas activas en mes m: las que entraron en mes 1..m, cada una genera perSale
        annual += perSale * Math.min(m, MONTHS) * perMonth;
      }
      // simplificación: la fórmula anterior cuenta también las nuevas ventas del mes m
      // como si pagaran ese mes; lo dejo así porque corresponde al primer pago real.
    } else {
      annual = perSale * perMonth * 12;
    }

    return {
      perSale,
      monthlyFirst: monthly,
      annual,
    };
  }, [sel, perMonth]);

  return (
    <div className="grid gap-6 rounded-md border border-ink/10 bg-paper p-6 lg:grid-cols-2">
      <div className="space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Servicio que recomiendas</span>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm"
          >
            {PRODUCTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink/70">Ventas que cierras al mes</span>
            <span className="font-heading text-2xl text-terracotta-500">{perMonth}</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={perMonth}
            onChange={(e) => setPerMonth(Number(e.target.value))}
            className="mt-2 w-full accent-terracotta-500"
          />
          <div className="mt-1 flex justify-between text-xs text-ink/50">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <p className="rounded-sm bg-mustard-500/15 p-3 text-xs text-ink/80">
          Cálculo conservador: {sel.recurring ? "comisión 20 % × hasta 12 meses por venta" : "comisión 20 % única por venta"}.
        </p>
      </div>

      <div className="space-y-3 rounded-sm bg-ink/5 p-5">
        <Row label="Por venta">{stats.perSale.toFixed(0)} €{sel.recurring && "/mes"}</Row>
        <Row label="Comisión mes 1">{stats.monthlyFirst.toFixed(0)} €</Row>
        <Row big label="Total a 12 meses">{stats.annual.toFixed(0)} €</Row>
        <p className="pt-2 text-xs text-ink/60">
          Si vendes {perMonth} {sel.recurring ? "suscripciones" : "proyectos"} cada mes durante un año, esto es lo que vas a ingresar (antes de impuestos).
        </p>
      </div>
    </div>
  );
}

function Row({ label, children, big }: { label: string; children: React.ReactNode; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink/10 pb-2 last:border-0">
      <span className="text-sm text-ink/70">{label}</span>
      <span className={big ? "font-heading text-3xl text-terracotta-500" : "font-medium text-ink"}>
        {children}
      </span>
    </div>
  );
}

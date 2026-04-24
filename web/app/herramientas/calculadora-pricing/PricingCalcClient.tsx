"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Inputs {
  costeFijoMes: number;
  horasMes: number;
  margenPct: number;
  sesionesMes: number;
  duracionHoras: number;
  tarifaMercado: number;
}

export default function PricingCalcClient() {
  const [inputs, setInputs] = useState<Inputs>({
    costeFijoMes: 2000,
    horasMes: 120,
    margenPct: 40,
    sesionesMes: 40,
    duracionHoras: 1.5,
    tarifaMercado: 60,
  });

  const { tarifaHora, precioProyecto, breakEvenHoras, tarifaHoraRecomendada, comparativa } =
    useMemo(() => {
      // Tarifa base que cubre costes
      const tarifaBase = inputs.costeFijoMes / Math.max(inputs.horasMes, 1);

      // Tarifa con margen
      const tarifaHora = Math.round(tarifaBase / (1 - inputs.margenPct / 100));

      // Precio por proyecto (sesiones × duracion × tarifa)
      const horasProyecto = inputs.sesionesMes * inputs.duracionHoras;
      const precioProyecto = Math.round(horasProyecto * tarifaHora);

      // Break-even: horas facturables minimas al mes
      const breakEvenHoras = Math.ceil(inputs.costeFijoMes / Math.max(tarifaHora, 1));

      // Tarifa recomendada (aplica 15% premium si tu tarifa < mercado)
      const tarifaHoraRecomendada =
        tarifaHora < inputs.tarifaMercado * 0.85
          ? Math.round(inputs.tarifaMercado * 0.95)
          : tarifaHora;

      // Comparativa mercado
      const delta = tarifaHora - inputs.tarifaMercado;
      const pctDelta = (delta / inputs.tarifaMercado) * 100;

      return {
        tarifaHora,
        precioProyecto,
        breakEvenHoras,
        tarifaHoraRecomendada,
        comparativa: {
          delta: Math.round(delta),
          pctDelta: Math.round(pctDelta),
          status: Math.abs(pctDelta) < 10 ? "aligned" : pctDelta > 0 ? "above" : "below",
        },
      };
    }, [inputs]);

  function update<K extends keyof Inputs>(key: K, value: number) {
    setInputs((i) => ({ ...i, [key]: Math.max(0, value) }));
  }

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { key: "costeFijoMes", label: "Costes fijos mensuales (€)", desc: "Alquiler + software + impuestos", max: 20000, step: 100 },
          { key: "horasMes", label: "Horas facturables al mes", desc: "Realistamente, no 40h × 4 semanas", max: 200, step: 5 },
          { key: "margenPct", label: "Margen deseado (%)", desc: "Cuanto beneficio quieres tras costes", max: 80, step: 5 },
          { key: "tarifaMercado", label: "Tarifa mercado en tu sector (€/h)", desc: "Buscar \"freelance [tu rol] Madrid\"", max: 300, step: 5 },
          { key: "sesionesMes", label: "Sesiones/proyectos-tipo por mes", desc: "Si vendes paquetes, cuantos", max: 100, step: 1 },
          { key: "duracionHoras", label: "Duracion proyecto-tipo (horas)", desc: "Desde kick-off hasta entrega", max: 200, step: 0.5 },
        ].map((field) => (
          <div key={field.key} className="p-5 rounded-2xl bg-ink/[0.03] border border-ink/[0.06]">
            <label className="block text-[11px] font-mono uppercase tracking-[0.18em] text-ink/50 mb-2">
              {field.label}
            </label>
            <input
              type="number"
              value={inputs[field.key as keyof Inputs]}
              onChange={(e) =>
                update(field.key as keyof Inputs, parseFloat(e.target.value) || 0)
              }
              step={field.step}
              min={0}
              max={field.max}
              className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-heading font-bold text-2xl tabular-nums outline-none focus:border-accent-gold/40 transition"
            />
            <input
              type="range"
              value={inputs[field.key as keyof Inputs]}
              onChange={(e) =>
                update(field.key as keyof Inputs, parseFloat(e.target.value))
              }
              step={field.step}
              min={0}
              max={field.max}
              className="w-full mt-3 accent-accent-gold"
            />
            <div className="text-[11px] text-ink/40 mt-1.5 font-body">{field.desc}</div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-accent-gold/[0.06] border border-accent-gold/30">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-2">
            TARIFA HORA RECOMENDADA
          </div>
          <div className="font-heading font-bold text-5xl text-ink tabular-nums mb-2">
            {tarifaHoraRecomendada}
            <span className="text-accent-gold">€</span>
          </div>
          <div className="text-[12px] text-ink/60 font-body leading-relaxed">
            {tarifaHoraRecomendada > tarifaHora
              ? "Ajustada al mercado (evitas estar sub-cotizando)"
              : "Basada en tus costes + margen deseado"}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-ink/[0.04] border border-ink/[0.08]">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            PRECIO PROYECTO-TIPO
          </div>
          <div className="font-heading font-bold text-5xl text-ink tabular-nums mb-2">
            {precioProyecto.toLocaleString("es-ES")}
            <span className="text-ink/50">€</span>
          </div>
          <div className="text-[12px] text-ink/60 font-body leading-relaxed">
            {inputs.sesionesMes} sesiones × {inputs.duracionHoras}h × {tarifaHora}€/h
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-ink/[0.04] border border-ink/[0.08]">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            BREAK-EVEN
          </div>
          <div className="font-heading font-bold text-5xl text-ink tabular-nums mb-2">
            {breakEvenHoras}
            <span className="text-ink/50">h</span>
          </div>
          <div className="text-[12px] text-ink/60 font-body leading-relaxed">
            Horas/mes minimas a {tarifaHora}€ para cubrir costes
          </div>
        </div>
      </div>

      {/* Comparativa */}
      <div className="p-6 rounded-3xl border border-ink/[0.08] bg-paper-soft/30">
        <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45 mb-4">
          <span className="text-accent-gold">§ COMPARATIVA MERCADO</span>
        </div>
        <div className="flex items-center gap-4">
          {comparativa.status === "aligned" ? (
            <div className="flex items-center gap-2 text-mint">
              <TrendingUp className="w-5 h-5" />
              <span className="font-heading font-semibold">Tarifa alineada al mercado</span>
            </div>
          ) : comparativa.status === "above" ? (
            <div className="flex items-center gap-2 text-accent-gold">
              <TrendingUp className="w-5 h-5" />
              <span className="font-heading font-semibold">
                +{comparativa.delta}€ ({comparativa.pctDelta}%) sobre mercado
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-accent-burgundy">
              <TrendingDown className="w-5 h-5" />
              <span className="font-heading font-semibold">
                {comparativa.delta}€ ({comparativa.pctDelta}%) por debajo de mercado
              </span>
            </div>
          )}
        </div>
        <p className="mt-3 text-[13px] text-ink/60 font-body leading-relaxed">
          {comparativa.status === "below"
            ? "Estas cobrando menos de lo que cobra la media. Posibles causas: baja experiencia, poca exposicion marca, o necesitas subir precios."
            : comparativa.status === "above"
            ? "Cobras por encima del mercado — asegurate de justificar el premium con calidad, velocidad o resultados claros."
            : "Tu tarifa esta en linea con el mercado. Puedes experimentar +10% si tu propuesta de valor lo justifica."}
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-ink/40 font-mono flex items-start gap-2 max-w-3xl">
        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
        Calculo orientativo. El pricing final depende de tu propuesta de valor, experiencia,
        ubicacion y tipo de cliente. Pablo puede revisarlo contigo en una llamada gratis.
      </p>
    </div>
  );
}

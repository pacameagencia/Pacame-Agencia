"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Problema real",
    body: "Una PYME nos llega con un dolor concreto: no llegan reservas, la web no convierte, los leads no se cierran.",
    accent: "#B54E30",
  },
  {
    n: "02",
    title: "DIOS clasifica",
    body: "El cerebro lee la petición, identifica el agente principal y los colaboradores. Carga memorias relevantes y skills activos.",
    accent: "#283B70",
  },
  {
    n: "03",
    title: "Agentes ejecutan",
    body: "10 agentes + 346 skills + memorias previas. La 5ª PYME hostelera arranca con el conocimiento de las 4 anteriores.",
    accent: "#E8B730",
  },
  {
    n: "04",
    title: "Solución entregada",
    body: "Web + automatización + agente IA + dashboard. La PYME paga por el resultado, no por las horas que costó producirlo.",
    accent: "#6B7535",
  },
  {
    n: "05",
    title: "Aprendizaje al cerebro",
    body: "Cada éxito (y cada fallo) se convierte en memoria, sinapsis o discovery. El cerebro queda preparado para el siguiente cliente.",
    accent: "#9C3E24",
  },
];

export default function FactoriaCiclo() {
  return (
    <section id="ciclo" className="relative section-padding bg-paper overflow-hidden">
      {/* Línea de montaje conceptual */}
      <div
        className="absolute inset-x-0 top-1/2 h-0.5 bg-ink/10 -translate-y-1/2 pointer-events-none hidden lg:block"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-olive-500" aria-hidden="true">
                <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="7" cy="7" r="2" fill="currentColor" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">§ III</span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="kicker block mb-4">El ciclo cerrado</span>
            <h2
              className="font-display text-ink"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              Del problema al producto.{" "}
              <span
                className="italic font-light"
                style={{ color: "#283B70", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                Y vuelta a empezar.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <p className="font-sans text-ink-soft text-[15px] leading-relaxed">
              Cada solución entregada deja el cerebro más preparado para la siguiente. Eso es lo que diferencia a una factoría de un freelance.
            </p>
          </div>
        </div>

        {/* Pasos en horizontal scroll-reveal */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4">
          {steps.map((step, idx) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] }}
              className="relative"
            >
              {/* Conector horizontal entre pasos (desktop) */}
              {idx < steps.length - 1 && (
                <div
                  className="absolute top-12 left-full w-full h-px hidden lg:block"
                  style={{ background: `linear-gradient(90deg, ${step.accent}, transparent)` }}
                  aria-hidden="true"
                />
              )}

              <div className="relative">
                {/* Número con punto */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: step.accent, boxShadow: `0 0 0 6px ${step.accent}20` }}
                  />
                  <span
                    className="font-display tabular-nums"
                    style={{
                      fontSize: "2.5rem",
                      lineHeight: "1",
                      letterSpacing: "-0.02em",
                      fontWeight: 500,
                      color: step.accent,
                    }}
                  >
                    {step.n}
                  </span>
                </div>

                <h3
                  className="font-display text-ink mb-3"
                  style={{ fontSize: "1.25rem", lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: 500 }}
                >
                  {step.title}
                </h3>

                <p className="font-sans text-ink-soft text-[14px] leading-relaxed">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loop signal — el ciclo se cierra */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 flex items-center justify-center"
        >
          <div className="flex items-center gap-4 px-6 py-3 border-2 border-ink bg-paper" style={{ boxShadow: "4px 4px 0 #1A1813" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-terracotta-500" aria-hidden="true">
              <path
                d="M10 2 L10 4 A6 6 0 1 1 4 10 L2 10 A8 8 0 1 0 10 2 Z M14 4 L18 4 L18 8"
                fill="currentColor"
              />
            </svg>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">
              Loop infinito · Cada cliente entrena al sistema
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

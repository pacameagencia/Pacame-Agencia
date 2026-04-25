"use client";

import { motion } from "framer-motion";
import { Brain, Boxes, Package } from "lucide-react";

const capas = [
  {
    n: "03",
    icon: Package,
    label: "Capa 3 · Solución",
    title: "La entrega al cliente",
    description:
      "Web, automatizaciones, agentes IA conversacionales, dashboards. Esto es lo que ve la PYME y lo que paga. Pero no es donde nace el valor.",
    detail: "Web · n8n · Vapi · Stripe · Dashboards",
    accent: "#B54E30",
    bg: "bg-paper",
    text: "text-ink",
  },
  {
    n: "02",
    icon: Boxes,
    label: "Capa 2 · Línea de montaje",
    title: "10 agentes · 346 skills",
    description:
      "DIOS orquesta. PIXEL construye. NEXUS capta. ATLAS posiciona. PULSE conecta. NOVA marca. COPY persuade. SAGE empaqueta. LENS mide. CORE sostiene.",
    detail: "DIOS · NOVA · ATLAS · NEXUS · PIXEL · CORE · PULSE · SAGE · COPY · LENS",
    accent: "#283B70",
    bg: "bg-sand-100",
    text: "text-ink",
  },
  {
    n: "01",
    icon: Brain,
    label: "Capa 1 · Cerebro",
    title: "El motor que aprende",
    description:
      "Vault Obsidian + Supabase pgvector + sinapsis hebbianas + decay + auto-discovery. Cada cliente alimenta el conocimiento que ejecuta al siguiente.",
    detail: "1.8k nodos · 44 sinapsis · embeddings 768d · 8 endpoints",
    accent: "#E8B730",
    bg: "bg-ink",
    text: "text-paper",
  },
];

export default function FactoriaCapas() {
  return (
    <section id="capas" className="relative section-padding bg-paper">
      <div className="absolute top-0 right-0 w-72 h-72 opacity-30 pointer-events-none">
        <svg viewBox="0 0 300 300" className="w-full h-full" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) =>
            Array.from({ length: 8 }).map((_, j) => (
              <rect
                key={`${i}-${j}`}
                x={i * 38 + 4}
                y={j * 38 + 4}
                width="30"
                height="30"
                fill="none"
                stroke="#B54E30"
                strokeWidth="0.5"
                opacity={(i + j) % 2 === 0 ? 0.4 : 0.15}
              />
            ))
          )}
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-indigo-600" aria-hidden="true">
                <rect x="1" y="1" width="12" height="12" fill="currentColor" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">§ I</span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="kicker block mb-4">Las 3 capas</span>
            <h2
              className="font-display text-ink"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              No es una agencia.{" "}
              <span
                className="italic font-light"
                style={{ color: "#283B70", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                Es una infraestructura.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <p className="font-sans text-ink-soft text-[15px] leading-relaxed">
              Cada solución que sale a un cliente nace en una línea de montaje alimentada por un cerebro que no olvida.
            </p>
          </div>
        </div>

        {/* Capas — vertical stack como sándwich industrial */}
        <div className="space-y-6">
          {capas.map((capa, idx) => {
            const Icon = capa.icon;
            return (
              <motion.div
                key={capa.n}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.7, 0, 0.3, 1] }}
                className={`${capa.bg} ${capa.text} relative overflow-hidden`}
                style={{ boxShadow: "6px 6px 0 #1A1813" }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 lg:p-12 items-start">
                  {/* Numero gigante */}
                  <div className="lg:col-span-2">
                    <div
                      className="font-display tabular-nums"
                      style={{
                        fontSize: "clamp(4rem, 8vw, 7rem)",
                        lineHeight: "0.85",
                        letterSpacing: "-0.04em",
                        fontWeight: 500,
                        color: capa.accent,
                      }}
                    >
                      {capa.n}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-5 h-5" style={{ color: capa.accent }} />
                      <span
                        className="font-mono text-[11px] tracking-[0.25em] uppercase"
                        style={{ color: capa.accent }}
                      >
                        {capa.label}
                      </span>
                    </div>
                    <h3
                      className="font-display mb-4"
                      style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: 500 }}
                    >
                      {capa.title}
                    </h3>
                    <p className={`font-sans text-[16px] leading-relaxed max-w-2xl ${capa.text === "text-paper" ? "opacity-80" : "text-ink-soft"}`}>
                      {capa.description}
                    </p>
                  </div>

                  {/* Detail technical strip */}
                  <div className="lg:col-span-3 lg:border-l lg:border-current/20 lg:pl-6">
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-60 block mb-2">
                      Stack
                    </span>
                    <p className="font-mono text-[12px] leading-relaxed opacity-90 break-words">
                      {capa.detail}
                    </p>
                  </div>
                </div>

                {/* Flecha de flujo entre capas */}
                {idx < capas.length - 1 && (
                  <div className="absolute -bottom-4 left-12 z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 2 L12 22 M5 15 L12 22 L19 15"
                        fill="none"
                        stroke={capa.accent}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Cierre conceptual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-10 border-t-2 border-ink"
        >
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">Conclusión</span>
          </div>
          <div className="lg:col-span-10">
            <p
              className="font-display text-ink"
              style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: 500 }}
            >
              La 5ª PYME del sector hostelería{" "}
              <span
                className="italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                no parte de cero.
              </span>{" "}
              Parte del estado donde quedó la 4ª.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

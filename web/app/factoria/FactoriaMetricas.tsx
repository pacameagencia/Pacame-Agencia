"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Stats {
  nodes: number;
  edges: number;
  skills: number;
  subspecialists: number;
  memories: number;
  discoveries: number;
  synapses: number;
  agents: number;
  apis: number;
  lastDiscoveries: { title: string; type: string; created_at: string }[];
  timestamp: string;
}

const FALLBACK: Stats = {
  nodes: 1862,
  edges: 44,
  skills: 718,
  subspecialists: 184,
  memories: 135,
  discoveries: 47,
  synapses: 38,
  agents: 10,
  apis: 8,
  lastDiscoveries: [],
  timestamp: new Date().toISOString(),
};

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function CountUp({ to, suffix = "", duration = 1.4 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(start + (to - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return (
    <span className="tabular-nums">
      {val >= 1000 ? (val / 1000).toFixed(1) + "k" : val.toString()}
      {suffix}
    </span>
  );
}

export default function FactoriaMetricas() {
  const [stats, setStats] = useState<Stats>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/neural/factoria-stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const metrics = [
    {
      n: "M·01",
      label: "Densidad neuronal",
      value: stats.nodes,
      sub: `${stats.skills} skills · ${stats.subspecialists} subespecialistas`,
      accent: "#B54E30",
    },
    {
      n: "M·02",
      label: "Sinapsis activas",
      value: stats.synapses,
      sub: `${stats.edges} aristas en el grafo`,
      accent: "#283B70",
    },
    {
      n: "M·03",
      label: "Memorias persistentes",
      value: stats.memories,
      sub: "agent_memories · 10 agentes",
      accent: "#E8B730",
    },
    {
      n: "M·04",
      label: "Discoveries activos",
      value: stats.discoveries,
      sub: "patrones detectados",
      accent: "#6B7535",
    },
    {
      n: "M·05",
      label: "Endpoints neurales",
      value: stats.apis,
      sub: "topology · route · query · fire · decay · execute · auto-discovery · scanner",
      accent: "#9C3E24",
    },
  ];

  return (
    <section id="metricas" className="relative section-padding bg-ink overflow-hidden">
      {/* Patrón modernista de fondo */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) =>
            Array.from({ length: 20 }).map((_, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * 42 + 12}
                cy={j * 42 + 12}
                r={(i + j) % 3 === 0 ? 2 : 1}
                fill="#E8B730"
              />
            ))
          )}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 pb-10 border-b-2 border-paper/20">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mustard-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-mustard-500" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-paper/60">§ IV</span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="kicker block mb-4 text-mustard-500/80">Métricas en vivo · Cerebro PACAME</span>
            <h2
              className="font-display text-paper"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              Estado actual{" "}
              <span
                className="italic font-light"
                style={{ color: "#E8B730", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                de la factoría.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <p className="font-sans text-paper/70 text-[15px] leading-relaxed">
              Datos directos de Supabase pgvector. Cron de decay 3 am UTC, auto-discovery 5 am UTC.
              {loaded && (
                <span className="block mt-2 font-mono text-[11px] tracking-[0.15em] uppercase text-mustard-400">
                  Última actualización · {new Date(stats.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Métricas grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border-l border-t border-paper/10">
          {metrics.map((m, idx) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              className="border-r border-b border-paper/10 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-paper/50">{m.n}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: m.accent }} />
              </div>

              <div
                className="font-display text-paper mb-3"
                style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
              >
                <CountUp to={m.value} />
              </div>

              <h3 className="font-display text-paper text-[1.1rem] mb-2" style={{ fontWeight: 500 }}>
                {m.label}
              </h3>
              <p className="font-mono text-[11px] tracking-[0.05em] text-paper/55 leading-relaxed">
                {m.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Last discoveries strip */}
        {loaded && stats.lastDiscoveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 pt-8 border-t border-paper/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-mustard-500" aria-hidden="true">
                <polygon points="7,1 9,5 13,5 10,8 11,13 7,11 3,13 4,8 1,5 5,5" fill="currentColor" />
              </svg>
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-mustard-400">
                Últimos discoveries detectados
              </span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.lastDiscoveries.map((d, i) => (
                <li key={i} className="border-l-2 border-mustard-500/40 pl-4">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/50 block mb-1">
                    {d.type}
                  </span>
                  <p className="font-sans text-paper text-[14px] leading-snug">{d.title}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </section>
  );
}

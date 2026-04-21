"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Network, Zap, Brain, Activity, Sparkles, Radio } from "lucide-react";

interface AgentNode {
  agent_id: string;
  name?: string;
  role?: string;
  specialty?: string;
  status?: string;
  energy_level?: number;
  fire_count?: number;
  last_fired_at?: string | null;
  current_task?: string | null;
  tasks_today?: number;
  model_tier?: string;
  personality?: { traits?: string[]; tone?: string };
  specialization_weights?: Record<string, number>;
}

interface Synapse {
  from_agent: string;
  to_agent: string;
  synapse_type: string;
  weight: number;
  fire_count: number;
  success_count: number;
  last_fired_at: string | null;
}

interface Stats {
  neurons: number;
  synapses: number;
  activeChains: number;
  pendingStimuli: number;
  avgWeight: number;
  totalFirings: number;
}

interface Memory {
  id: string;
  agent_id: string;
  memory_type: string;
  title: string;
  importance: number;
  created_at: string;
  tags: string[];
}

interface Discovery {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  impact: string;
  confidence: number;
  status: string;
  created_at: string;
}

interface ThoughtChain {
  id: string;
  initiating_agent: string;
  goal: string;
  status: string;
  step_count: number;
  participating_agents: string[];
  started_at: string;
  ended_at: string | null;
}

interface Stimulus {
  id: string;
  target_agent: string | null;
  source: string;
  signal: string;
  intensity: number;
  processed: boolean;
  created_at: string;
}

interface TopologyResponse {
  nodes: AgentNode[];
  edges: Synapse[];
  memories: Memory[];
  discoveries: Discovery[];
  thoughtChains: ThoughtChain[];
  stimuli: Stimulus[];
  stats: Stats;
}

// ---------------------------------------------------------------------------
// Layout deterministico: DIOS al centro, el resto en circulo.
// ---------------------------------------------------------------------------
function computeLayout(nodes: AgentNode[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.36;

  const dios = nodes.find((n) => n.agent_id === "dios");
  const others = nodes.filter((n) => n.agent_id !== "dios");

  const map = new Map<string, { x: number; y: number }>();
  if (dios) map.set("dios", { x: cx, y: cy });

  others.forEach((n, i) => {
    const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
    map.set(n.agent_id, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  });

  return map;
}

const SYNAPSE_COLORS: Record<string, string> = {
  orchestrates: "#a78bfa",
  reports_to: "#60a5fa",
  delegates_to: "#34d399",
  collaborates_with: "#22d3ee",
  consults: "#fbbf24",
  reviews: "#f472b6",
  learns_from: "#c084fc",
  supervises: "#fb7185",
};

const STATUS_COLORS: Record<string, string> = {
  working: "#22d3ee",
  reviewing: "#fbbf24",
  idle: "#34d399",
  waiting: "#94a3b8",
  offline: "#475569",
};

function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NeuralPage() {
  const [data, setData] = useState<TopologyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<AgentNode | null>(null);
  const [pulse, setPulse] = useState<{ from: string; to: string; key: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/neural/topology", { cache: "no-store" });
      const j = (await r.json()) as TopologyResponse;
      setData(j);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  // Realtime: cuando una sinapsis dispara o aparece un estimulo, refrescamos
  useEffect(() => {
    const channel = supabase
      .channel("neural-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_synapses" }, (payload) => {
        const n = payload.new as { from_agent?: string; to_agent?: string } | null;
        if (n?.from_agent && n?.to_agent) {
          setPulse({ from: n.from_agent, to: n.to_agent, key: Date.now() });
        }
        refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_stimuli" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "thought_chains" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_states" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: Math.max(500, rect.height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!data) return new Map<string, { x: number; y: number }>();
    return computeLayout(data.nodes, size.w, size.h);
  }, [data, size]);

  const nodeById = useMemo(() => {
    const m = new Map<string, AgentNode>();
    (data?.nodes ?? []).forEach((n) => m.set(n.agent_id, n));
    return m;
  }, [data]);

  if (loading) {
    return (
      <div className="p-8 text-pacame-gray">
        <div className="animate-pulse">Cargando red neuronal...</div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-pacame-gray">Sin datos.</div>;
  }

  const stats = data.stats;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Network className="w-7 h-7 text-pacame-green" />
            Red Neuronal PACAME
          </h1>
          <p className="text-pacame-gray text-sm mt-1">
            {stats.neurons} neuronas · {stats.synapses} sinapsis · peso medio {stats.avgWeight.toFixed(2)} · {stats.totalFirings} disparos totales
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Stat icon={<Brain className="w-4 h-4" />} label="Neuronas" value={stats.neurons} />
          <Stat icon={<Zap className="w-4 h-4" />} label="Sinapsis" value={stats.synapses} />
          <Stat icon={<Activity className="w-4 h-4" />} label="Cadenas activas" value={stats.activeChains} accent />
          <Stat icon={<Radio className="w-4 h-4" />} label="Estimulos pendientes" value={stats.pendingStimuli} accent={stats.pendingStimuli > 0} />
        </div>
      </header>

      {/* Canvas + panel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* SVG */}
        <div
          ref={containerRef}
          className="bg-pacame-dark/50 border border-pacame-gray/20 rounded-2xl overflow-hidden relative min-h-[600px]"
        >
          <svg width={size.w} height={size.h} className="block">
            <defs>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sinapsis */}
            <g>
              {data.edges.map((e, i) => {
                const a = layout.get(e.from_agent);
                const b = layout.get(e.to_agent);
                if (!a || !b) return null;
                const color = SYNAPSE_COLORS[e.synapse_type] ?? "#64748b";
                const opacity = 0.15 + e.weight * 0.55;
                const isHighlight =
                  hovered === e.from_agent || hovered === e.to_agent ||
                  selected?.agent_id === e.from_agent || selected?.agent_id === e.to_agent;
                return (
                  <line
                    key={`${e.from_agent}-${e.to_agent}-${e.synapse_type}-${i}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={color}
                    strokeWidth={isHighlight ? 2.5 : 0.6 + e.weight * 1.6}
                    opacity={isHighlight ? 0.95 : opacity}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {/* Pulso de disparo */}
            {pulse && (() => {
              const a = layout.get(pulse.from);
              const b = layout.get(pulse.to);
              if (!a || !b) return null;
              return (
                <circle
                  key={pulse.key}
                  cx={a.x} cy={a.y} r={6} fill="#22d3ee" opacity="0.9"
                  filter="url(#glow)"
                >
                  <animate attributeName="cx" from={a.x} to={b.x} dur="0.8s" fill="freeze" />
                  <animate attributeName="cy" from={a.y} to={b.y} dur="0.8s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0" dur="0.8s" fill="freeze" />
                </circle>
              );
            })()}

            {/* Neuronas */}
            <g>
              {data.nodes.map((n) => {
                const p = layout.get(n.agent_id);
                if (!p) return null;
                const energy = (n.energy_level ?? 100) / 100;
                const baseR = n.agent_id === "dios" ? 28 : 20;
                const r = baseR * (0.7 + energy * 0.6);
                const fill = STATUS_COLORS[n.status ?? "idle"] ?? "#64748b";
                const isActive = n.status === "working";

                return (
                  <g
                    key={n.agent_id}
                    transform={`translate(${p.x}, ${p.y})`}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHovered(n.agent_id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(n)}
                  >
                    {isActive && (
                      <circle r={r + 12} fill="url(#nodeGlow)">
                        <animate attributeName="r" from={r + 8} to={r + 18} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      r={r}
                      fill={fill}
                      fillOpacity={0.18}
                      stroke={fill}
                      strokeWidth={selected?.agent_id === n.agent_id ? 3 : 2}
                      filter={hovered === n.agent_id ? "url(#glow)" : undefined}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize={n.agent_id === "dios" ? 13 : 11}
                      fontWeight="700"
                      fill="white"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {(n.name ?? n.agent_id).toUpperCase()}
                    </text>
                    <text
                      textAnchor="middle"
                      y={r + 14}
                      fontSize={9}
                      fill="#94a3b8"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {n.role ?? ""}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Leyenda sinapsis */}
          <div className="absolute bottom-3 left-3 bg-paper/70 backdrop-blur rounded-lg p-3 text-xs space-y-1">
            <div className="text-pacame-gray font-semibold mb-1">Tipo de sinapsis</div>
            {Object.entries(SYNAPSE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="inline-block w-3 h-0.5" style={{ backgroundColor: color }} />
                <span className="text-pacame-gray">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <aside className="space-y-4">
          {selected ? (
            <NeuronDetail node={selected} edges={data.edges} onClose={() => setSelected(null)} />
          ) : (
            <div className="bg-pacame-dark/50 border border-pacame-gray/20 rounded-xl p-4 text-sm text-pacame-gray">
              Toca una neurona para ver su personalidad, sinapsis y carga.
            </div>
          )}

          <Section title="Estimulos recientes" icon={<Radio className="w-4 h-4" />}>
            {data.stimuli.length === 0 && <Empty>Sin estimulos recientes.</Empty>}
            {data.stimuli.slice(0, 8).map((s) => (
              <div key={s.id} className="text-xs py-1.5 border-b border-pacame-gray/10 last:border-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-white truncate">{s.signal}</span>
                  <span className="text-pacame-gray text-[10px]">{timeAgo(s.created_at)}</span>
                </div>
                <div className="text-pacame-gray text-[10px]">
                  {s.source} → {s.target_agent ?? "broadcast"} · int {Number(s.intensity).toFixed(2)}
                  {s.processed ? " · ✓" : " · pendiente"}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Cadenas de pensamiento" icon={<Sparkles className="w-4 h-4" />}>
            {data.thoughtChains.length === 0 && <Empty>Sin cadenas activas.</Empty>}
            {data.thoughtChains.map((c) => (
              <div key={c.id} className="text-xs py-1.5 border-b border-pacame-gray/10 last:border-0">
                <div className="text-white truncate">{c.goal}</div>
                <div className="text-pacame-gray text-[10px]">
                  {c.initiating_agent} · {c.step_count} pasos · {c.status} · {timeAgo(c.started_at)}
                </div>
              </div>
            ))}
          </Section>
        </aside>
      </div>

      {/* Memorias + descubrimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Memorias mas importantes" icon={<Brain className="w-4 h-4" />}>
          {data.memories.length === 0 && <Empty>Sin memorias.</Empty>}
          {data.memories.slice(0, 10).map((m) => (
            <div key={m.id} className="text-xs py-2 border-b border-pacame-gray/10 last:border-0">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-white">{m.title}</span>
                <span className="text-pacame-green text-[10px] font-semibold">
                  {(m.importance * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-pacame-gray text-[10px]">
                {m.agent_id} · {m.memory_type} · {m.tags.join(", ")}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Descubrimientos recientes" icon={<Sparkles className="w-4 h-4" />}>
          {data.discoveries.length === 0 && <Empty>Aun ningun descubrimiento.</Empty>}
          {data.discoveries.slice(0, 10).map((d) => (
            <div key={d.id} className="text-xs py-2 border-b border-pacame-gray/10 last:border-0">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-white">{d.title}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    backgroundColor:
                      d.impact === "critical" ? "#ef4444" : d.impact === "high" ? "#f59e0b" : "#475569",
                    color: "white",
                  }}
                >
                  {d.impact}
                </span>
              </div>
              <div className="text-pacame-gray text-[10px]">
                {d.agent_id} · {d.type} · conf {(d.confidence * 100).toFixed(0)}% · {timeAgo(d.created_at)}
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

// ----- Subcomponentes -----

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${accent ? "bg-pacame-green/10 border-pacame-green/40" : "bg-pacame-dark/60 border-pacame-gray/20"}`}>
      <span className={accent ? "text-pacame-green" : "text-pacame-gray"}>{icon}</span>
      <div className="text-xs text-pacame-gray">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-pacame-dark/50 border border-pacame-gray/20 rounded-xl p-4">
      <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
        <span className="text-pacame-green">{icon}</span>
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-pacame-gray italic">{children}</div>;
}

function NeuronDetail({ node, edges, onClose }: { node: AgentNode; edges: Synapse[]; onClose: () => void }) {
  const out = edges.filter((e) => e.from_agent === node.agent_id).sort((a, b) => b.weight - a.weight);
  const inn = edges.filter((e) => e.to_agent === node.agent_id).sort((a, b) => b.weight - a.weight);
  const personality = node.personality?.traits?.join(" · ") ?? "—";

  return (
    <div className="bg-pacame-dark/80 border border-pacame-green/40 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-pacame-green text-xs font-semibold uppercase">{node.role}</div>
          <h2 className="text-white text-xl font-bold">{node.name ?? node.agent_id}</h2>
          <div className="text-pacame-gray text-xs mt-0.5">{node.specialty}</div>
        </div>
        <button
          onClick={onClose}
          className="text-pacame-gray hover:text-white text-sm"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Estado" value={node.status ?? "—"} />
        <Mini label="Energia" value={`${node.energy_level ?? 0}%`} />
        <Mini label="Disparos" value={node.fire_count ?? 0} />
      </div>

      <div className="text-xs space-y-1">
        <div><span className="text-pacame-gray">Modelo:</span> <span className="text-white">{node.model_tier}</span></div>
        <div><span className="text-pacame-gray">Personalidad:</span> <span className="text-white">{personality}</span></div>
        <div><span className="text-pacame-gray">Tono:</span> <span className="text-white">{node.personality?.tone ?? "—"}</span></div>
        {node.current_task && <div className="text-pacame-gray italic">"{node.current_task}"</div>}
      </div>

      <div className="space-y-1 text-xs">
        <div className="text-pacame-gray font-semibold">Salidas ({out.length})</div>
        {out.slice(0, 6).map((e) => (
          <div key={`${e.to_agent}-${e.synapse_type}`} className="flex justify-between text-pacame-gray">
            <span>→ {e.to_agent} <span className="text-[10px]">({e.synapse_type})</span></span>
            <span className="text-white font-mono">{e.weight.toFixed(2)}</span>
          </div>
        ))}
        <div className="text-pacame-gray font-semibold pt-1">Entradas ({inn.length})</div>
        {inn.slice(0, 6).map((e) => (
          <div key={`${e.from_agent}-${e.synapse_type}`} className="flex justify-between text-pacame-gray">
            <span>← {e.from_agent} <span className="text-[10px]">({e.synapse_type})</span></span>
            <span className="text-white font-mono">{e.weight.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-paper/40 rounded p-2">
      <div className="text-[10px] text-pacame-gray uppercase">{label}</div>
      <div className="text-white text-sm font-bold">{value}</div>
    </div>
  );
}

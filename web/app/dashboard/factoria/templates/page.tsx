"use client";

import { useEffect, useState } from "react";
import { Layers, Play, Loader2, ChevronRight, AlertCircle } from "lucide-react";

interface AvailableTemplate {
  id: string;
  sector: string;
  subverticals: string[];
  tier_default: string;
  timeline_days: { min: number; max: number };
  agents: string[];
}

interface DeploymentPhase {
  phase: string;
  days: string;
  deliverables: string[];
  agents: string[];
}

interface DeploymentPlan {
  client_summary: string;
  deployment_phases: DeploymentPhase[];
  pricing: {
    setup_eur: number;
    monthly_eur: number;
    rationale: string;
    addons: { name: string; eur: number; optional: boolean }[];
  };
  immediate_next_steps: string[];
  expected_outcomes_90_days: { metric: string; baseline: string; target: string }[];
  risks_and_mitigations: { risk: string; mitigation: string }[];
}

interface DeployResponse {
  ok: boolean;
  template_id?: string;
  client?: { business_name: string; city: string };
  plan?: DeploymentPlan;
  provider?: string;
  model?: string;
  timestamp?: string;
  error?: string;
}

const EXAMPLE_CASES = [
  {
    label: "Casa Marisol · Cádiz",
    payload: {
      business_name: "Casa Marisol",
      business_type: "restaurante",
      city: "Cádiz",
      neighborhood: "La Caleta",
      cuisine: "andaluza/marisco",
      seats_count: 48,
      current_state: "web básica 2018, sin reservas online, 4.3★ Google con 87 reseñas",
      goals: ["aumentar reservas online", "controlar reseñas Google", "ocupación fin de semana"],
      phone_whatsapp: "+34 656 555 444",
    },
  },
  {
    label: "El Trinquete · Madrid",
    payload: {
      business_name: "El Trinquete",
      business_type: "bar de tapas",
      city: "Madrid",
      neighborhood: "Lavapiés",
      cuisine: "tapas castizas",
      seats_count: 32,
      current_state: "Instagram con 1.8k seguidores, sin web, reservas solo por teléfono",
      goals: ["digitalización completa", "captar turistas internacionales"],
      language_secondary: "en",
    },
  },
  {
    label: "Café Sol · Barcelona",
    payload: {
      business_name: "Café Sol",
      business_type: "cafetería de especialidad",
      city: "Barcelona",
      neighborhood: "Gràcia",
      cuisine: "café especialidad + brunch",
      seats_count: 28,
      current_state: "web buena, IG fuerte, mucha cola fines de semana sin reservas",
      goals: ["sistema de reservas para brunch", "monetizar lista de espera"],
    },
  },
];

export default function FactoriaTemplatesPage() {
  const [templates, setTemplates] = useState<AvailableTemplate[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<DeployResponse | null>(null);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/factoria/template-deploy")
      .then((r) => r.json())
      .then((data) => setTemplates(data.available_templates ?? []));
  }, []);

  async function deployTemplate(templateId: string, payload: Record<string, unknown>, label: string) {
    setDeploying(true);
    setActiveExample(label);
    setResult(null);
    try {
      const res = await fetch("/api/factoria/template-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, client: payload }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-electric-violet" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/50">
            Plantillas sector · DIOS
          </span>
        </div>
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-2">Plantillas de entrega</h1>
        <p className="text-pacame-white/50 font-body text-sm max-w-2xl">
          Configuraciones predefinidas de la factoría por sector. Cada plantilla activa un set de agentes,
          skills, automatizaciones y copy específicos. SAGE personaliza el plan de despliegue para cada cliente.
        </p>
      </div>

      {/* Templates disponibles */}
      <section>
        <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/60 mb-4">
          Plantillas disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <article key={t.id} className="bg-dark-card border border-white/[0.06] p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-electric-violet">
                  {t.id}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 bg-olympus-gold/15 text-olympus-gold">
                  {t.tier_default}
                </span>
              </div>
              <h3 className="font-heading font-bold text-xl text-pacame-white mb-2 capitalize">
                {t.sector}
              </h3>
              <div className="text-[11px] font-mono text-pacame-white/40 mb-4">
                {t.timeline_days.min}–{t.timeline_days.max} días · {t.agents.length} agentes
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.agents.map((a) => (
                  <span
                    key={a}
                    className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border border-white/15 text-pacame-white/80"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <div className="text-[11px] font-mono text-pacame-white/40 leading-relaxed">
                Subverticals: {t.subverticals.join(" · ")}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Ejemplos de despliegue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/60">
            Pruebas de despliegue · genera plan SAGE para un cliente ficticio
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXAMPLE_CASES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => deployTemplate("hosteleria-v1", ex.payload, ex.label)}
              disabled={deploying}
              className={`group p-4 border text-left transition-all ${
                activeExample === ex.label && deploying
                  ? "border-electric-violet bg-electric-violet/5"
                  : "border-white/[0.06] hover:border-electric-violet/30"
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-pacame-white">{ex.label}</span>
                {deploying && activeExample === ex.label ? (
                  <Loader2 className="w-4 h-4 text-electric-violet animate-spin" />
                ) : (
                  <Play className="w-4 h-4 text-pacame-white/40 group-hover:text-electric-violet" />
                )}
              </div>
              <p className="text-[11px] font-mono text-pacame-white/50 leading-relaxed line-clamp-2">
                {ex.payload.current_state}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Resultado del despliegue */}
      {result && (
        <section className="space-y-6">
          <div className="border-t-2 border-electric-violet/30 pt-6">
            {result.ok && result.plan ? (
              <DeploymentPlanView plan={result.plan} client={result.client} provider={result.provider} />
            ) : (
              <div className="flex items-start gap-3 p-4 border border-rose-alert/30 bg-rose-alert/5">
                <AlertCircle className="w-5 h-5 text-rose-alert flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-heading font-bold text-rose-alert mb-1">Error en el despliegue</h3>
                  <p className="text-pacame-white/70 text-sm font-body">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function DeploymentPlanView({
  plan,
  client,
  provider,
}: {
  plan: DeploymentPlan;
  client?: { business_name: string; city: string };
  provider?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-electric-violet block mb-2">
          Plan de despliegue · {client?.business_name} · {client?.city}
        </span>
        <h2 className="font-heading font-bold text-2xl text-pacame-white mb-3">Generado por SAGE</h2>
        <p className="font-body text-pacame-white/75 leading-relaxed">{plan.client_summary}</p>
      </div>

      {/* Pricing destacado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border-2 border-electric-violet/30 p-5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-2">
            Setup inicial
          </span>
          <div className="font-heading font-bold text-3xl text-pacame-white tabular-nums">
            {plan.pricing.setup_eur.toLocaleString("es-ES")}
            <span className="text-electric-violet text-2xl"> €</span>
          </div>
        </div>
        <div className="bg-dark-card border border-white/[0.06] p-5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-2">
            Mantenimiento
          </span>
          <div className="font-heading font-bold text-3xl text-pacame-white tabular-nums">
            {plan.pricing.monthly_eur}<span className="text-olympus-gold text-2xl"> €/mes</span>
          </div>
        </div>
        <div className="bg-dark-card border border-white/[0.06] p-5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-2">
            Rationale
          </span>
          <p className="font-body text-[12px] text-pacame-white/75 leading-relaxed">
            {plan.pricing.rationale}
          </p>
        </div>
      </div>

      {/* Phases */}
      <div>
        <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/60 mb-4">
          Fases del despliegue
        </h3>
        <ol className="space-y-3">
          {plan.deployment_phases.map((phase, i) => (
            <li key={i} className="bg-dark-card border border-white/[0.06] p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-electric-violet block mb-1">
                    Fase {String(i + 1).padStart(2, "0")} · {phase.days}
                  </span>
                  <h4 className="font-heading font-bold text-pacame-white">{phase.phase}</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 max-w-[40%] justify-end">
                  {phase.agents.map((a) => (
                    <span
                      key={a}
                      className="font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 border border-white/15 text-pacame-white/70"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <ul className="space-y-1.5">
                {phase.deliverables.map((d, di) => (
                  <li key={di} className="flex items-start gap-2 text-sm font-body text-pacame-white/80 leading-snug">
                    <ChevronRight className="w-3 h-3 text-electric-violet mt-1 flex-shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {/* Outcomes + Next steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dark-card border border-white/[0.06] p-5">
          <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/60 mb-4">
            Outcomes esperados (90 días)
          </h3>
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-pacame-white/40">
                <th className="text-left pb-2">Métrica</th>
                <th className="text-left pb-2">Baseline</th>
                <th className="text-left pb-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {plan.expected_outcomes_90_days.map((o, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  <td className="py-2 text-pacame-white/85">{o.metric}</td>
                  <td className="py-2 text-pacame-white/55 font-mono text-[12px]">{o.baseline}</td>
                  <td className="py-2 text-lime-pulse font-mono text-[12px] font-bold">{o.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-dark-card border border-white/[0.06] p-5">
          <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/60 mb-4">
            Día 1 · pasos inmediatos
          </h3>
          <ol className="space-y-2">
            {plan.immediate_next_steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-body text-pacame-white/85 leading-snug">
                <span className="font-mono text-electric-violet text-[11px] tabular-nums mt-1">{String(i + 1).padStart(2, "0")}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Risks */}
      <div>
        <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/60 mb-4">
          Riesgos identificados + mitigaciones
        </h3>
        <ul className="space-y-2">
          {plan.risks_and_mitigations.map((r, i) => (
            <li key={i} className="bg-dark-card border-l-2 border-amber-signal/40 p-4">
              <p className="font-body text-pacame-white/90 text-sm font-medium mb-1.5">{r.risk}</p>
              <p className="font-body text-pacame-white/55 text-sm leading-relaxed">→ {r.mitigation}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-[10px] font-mono text-pacame-white/30 pt-4 border-t border-white/[0.04]">
        Generado vía {provider} · Persistido en client_deployments
      </div>
    </div>
  );
}

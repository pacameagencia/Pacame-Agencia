/**
 * Strategist — DIOS agente titan que piensa el plan del dia y genera proposals.
 *
 * Inputs:
 *  - channel_stats ultimos 7d (que funciona, que no)
 *  - outreach_leads stats (pipeline)
 *  - proposals aprobadas/rechazadas ultimos 30d (aprender preferencias Pablo)
 *  - active experiments
 *  - today's date + day of week (decide nicho + intensidad)
 *
 * Output:
 *  - brain_daily_plans row para hoy
 *  - N agent_proposals nuevas (pendientes de aprobacion)
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { llmChat, extractJSON } from "@/lib/llm";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";
import { NICHES, getNicheForToday } from "@/lib/outreach/niches";

interface StrategistPlan {
  summary: string;
  focus_niches: string[];
  focus_channels: string[];
  kpi_targets: {
    leads_target: number;
    emails_sent: number;
    linkedin_queued?: number;
    whatsapp_sent?: number;
  };
  proposals: Array<{
    type: string;
    title: string;
    hypothesis: string;
    action_config: Record<string, unknown>;
    expected_impact: "high" | "medium" | "low";
    confidence: number;
    effort: "trivial" | "small" | "medium" | "large";
    priority: number;
  }>;
}

export async function generateDailyPlan(): Promise<{
  planId: string;
  proposalIds: string[];
  cost: number;
}> {
  const log = getLogger({ agent: "dios" });
  const supabase = createServerSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Skip si ya hay plan hoy
  const { data: existing } = await supabase
    .from("brain_daily_plans")
    .select("id")
    .eq("plan_date", today)
    .maybeSingle();
  if (existing) {
    log.info({ planId: existing.id }, "plan already exists for today, skipping");
    return { planId: existing.id as string, proposalIds: [], cost: 0 };
  }

  // ─── Context para el LLM ─────────────────────────────
  const { data: channelStats7d } = await supabase
    .from("channel_stats")
    .select("niche_slug, channel, sent_count, replied_count, converted_count, revenue_cents")
    .gte("last_updated_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());

  const { data: recentProposals } = await supabase
    .from("agent_proposals")
    .select("proposal_type, title, status, confidence, execution_result")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: activeExperiments } = await supabase
    .from("growth_experiments")
    .select("id, name, category, hypothesis, primary_metric, current_sample_a, current_sample_b")
    .eq("status", "running");

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("status, amount_cents, created_at, service_slug")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());

  const nicheOfDay = getNicheForToday();

  const approvedProposals = (recentProposals || []).filter((p) =>
    ["approved", "auto_approved", "executed"].includes(p.status as string)
  );
  const rejectedProposals = (recentProposals || []).filter((p) => p.status === "rejected");

  // ─── Prompt ──────────────────────────────────────────
  const prompt = `Eres DIOS, el orquestador estrategico de PACAME (marketplace de servicios digitales IA-delivered para PYMEs espanolas). Hoy ${today}, genera el PLAN del dia para captacion autonoma.

## CONTEXTO SISTEMA

**Marketplace**: 24 productos (19-79 EUR entry, 29-599 EUR/mes planes). Los agentes entregan autonomo. Pablo es fundador solo.

**Nicho del dia (rotativo)**: ${nicheOfDay.label} — ${nicheOfDay.searchQuery} en ${nicheOfDay.location}
Dolores tipicos: ${nicheOfDay.painPoints.join("; ")}
Producto entry sugerido: ${nicheOfDay.entryProductSlug}

**Canales disponibles**: email (Resend, barato), whatsapp (Meta Business API), linkedin (queue manual que Pablo envia), voice (Vapi, caro pero warm), instagram_dm (limitado).

**Channel stats ultimos 7d** (niche × channel × touch → sent/replied):
${JSON.stringify(channelStats7d?.slice(0, 20) || [])}

**Experimentos activos**:
${JSON.stringify(activeExperiments || [])}

**Proposals ultimos 30d**:
- APROBADAS: ${approvedProposals.map((p) => p.title).slice(0, 10).join(" / ") || "(ninguna)"}
- RECHAZADAS por Pablo: ${rejectedProposals.map((p) => p.title).slice(0, 5).join(" / ") || "(ninguna)"}

**Orders ultimos 30d**:
- Entregados: ${(recentOrders || []).filter((o) => o.status === "delivered").length}
- En proceso: ${(recentOrders || []).filter((o) => o.status === "processing").length}
- Revenue: ${Math.round(((recentOrders || []).reduce((s, o) => s + (o.amount_cents || 0), 0) / 100))} EUR

## TU TAREA

Genera un plan del dia + 3-5 proposals INACCIONABLES. Aprende de las rechazadas (evita repetir patrones).

Devuelve JSON:
{
  "summary": "2-3 frases del plan de hoy",
  "focus_niches": ["${nicheOfDay.slug}", ...otros max 2],
  "focus_channels": ["email","whatsapp"...],
  "kpi_targets": {
    "leads_target": 5,
    "emails_sent": 15,
    "linkedin_queued": 5,
    "whatsapp_sent": 3
  },
  "proposals": [
    {
      "type": "new_niche"|"new_channel_tactic"|"copy_variant"|"product_idea"|"pricing_change"|"channel_saturation"|"outreach_time"|"lead_scoring"|"automation_idea"|"content_idea"|"other",
      "title": "corto accionable",
      "hypothesis": "Si hacemos X, esperamos Y porque Z (basado en data)",
      "action_config": {"campo1":"valor","canal":"email","nicho":"...","copy_style":"..."},
      "expected_impact": "high"|"medium"|"low",
      "confidence": 0.0-1.0,
      "effort": "trivial"|"small"|"medium"|"large",
      "priority": 1-100
    }
  ]
}

REGLAS:
- Proposals inaccionables: Pablo debe poder aprobar con 1 click y ejecutar inmediatamente.
- Mezcla tipos: no todas del mismo tipo.
- PRIORIZA proposals sobre: nichos no probados, canales underutilizados, copy based en dolor real, ideas de producto basadas en signals del mercado.
- NO proposals genericas tipo "hacer mas marketing".
- NO repitas proposals rechazadas.
- Tuteo espanol. JSON ONLY.`;

  const result = await llmChat([{ role: "user", content: prompt }], {
    tier: "reasoning",
    maxTokens: 8000, // thinking budget 5000 + 3000 output
    temperature: 0.85,
    callSite: "strategist/daily_plan",
  });

  const parsed = extractJSON<StrategistPlan>(result.content);
  if (!parsed || !parsed.summary) {
    log.error({ content: result.content.slice(0, 300) }, "strategist: invalid JSON");
    throw new Error("Strategist LLM returned invalid JSON");
  }

  // Rough cost estimate (titan tier)
  const cost = (result.tokensIn / 1000) * 0.003 + (result.tokensOut / 1000) * 0.009;

  // ─── Persist plan ────────────────────────────────────
  const { data: plan, error: planErr } = await supabase
    .from("brain_daily_plans")
    .insert({
      plan_date: today,
      generated_by: "dios",
      summary: parsed.summary.slice(0, 500),
      focus_niches: parsed.focus_niches || [nicheOfDay.slug],
      focus_channels: parsed.focus_channels || ["email"],
      kpi_targets: parsed.kpi_targets || {},
      model_used: result.model,
      cost_usd: cost,
      status: "active",
    })
    .select("id")
    .single();

  if (planErr || !plan) {
    log.error({ err: planErr }, "plan insert failed");
    throw new Error(`Plan insert failed: ${planErr?.message}`);
  }

  // ─── Persist proposals ───────────────────────────────
  const proposalIds: string[] = [];
  for (const p of parsed.proposals || []) {
    try {
      const { data: prop } = await supabase
        .from("agent_proposals")
        .insert({
          agent_id: "dios",
          proposal_type: validateProposalType(p.type),
          title: p.title.slice(0, 200),
          hypothesis: p.hypothesis.slice(0, 1000),
          action_config: p.action_config || {},
          expected_impact: p.expected_impact || "medium",
          confidence: Math.max(0, Math.min(1, p.confidence || 0.5)),
          effort_estimate: p.effort || "small",
          priority: Math.max(0, Math.min(100, p.priority || 50)),
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        })
        .select("id")
        .single();
      if (prop?.id) proposalIds.push(prop.id as string);
    } catch (err) {
      log.warn({ err, title: p.title }, "proposal insert failed");
    }
  }

  // Update plan con los IDs generados
  if (proposalIds.length > 0) {
    await supabase
      .from("brain_daily_plans")
      .update({ new_proposals: proposalIds })
      .eq("id", plan.id);
  }

  await auditLog({
    actor: { type: "system", id: "dios-strategist" },
    action: "brain.daily_plan_generated",
    resource: { type: "brain_daily_plans", id: plan.id as string },
    metadata: {
      proposals_count: proposalIds.length,
      cost_usd: cost,
      niche_of_day: nicheOfDay.slug,
    },
  });

  log.info(
    { planId: plan.id, proposalsCount: proposalIds.length, cost },
    "daily plan generated"
  );

  return { planId: plan.id as string, proposalIds, cost };
}

const VALID_PROPOSAL_TYPES = [
  "new_niche",
  "new_channel_tactic",
  "copy_variant",
  "product_idea",
  "pricing_change",
  "channel_saturation",
  "outreach_time",
  "lead_scoring",
  "automation_idea",
  "content_idea",
  "other",
];

function validateProposalType(t: string | undefined): string {
  return t && VALID_PROPOSAL_TYPES.includes(t) ? t : "other";
}

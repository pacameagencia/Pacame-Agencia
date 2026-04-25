/**
 * GET /api/neural/factoria-package
 *
 * FASE C — Pipeline auto discovery → producto empaquetable.
 *
 * Lógica:
 * 1. Lee discoveries candidatos: impact in (medium, high), confidence >= 0.7,
 *    status = 'new', creados últimos 30 días.
 * 2. Para cada candidato (max 5/run), llama a SAGE (LLM tier=titan) con prompt
 *    estructurado que devuelve JSON del producto empaquetado.
 * 3. Update del discovery: status='packaged' + metadata.packaged_product = {...}
 * 4. Devuelve resumen del run.
 *
 * Cron Vercel: 0 4 * * * (4 am UTC, entre decay 3am y auto-discovery 5am).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { llmChat } from "@/lib/llm";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PER_RUN = 5;

interface PackagedProduct {
  name: string;
  tier: "starter" | "stack" | "ready";
  price_from: number;
  price_to: number;
  monthly_subscription: number | null;
  agents: string[];
  skills_count: number;
  deliverables: string[];
  timeline_days: { min: number; max: number };
  target_sector: string;
  hook_copy: string;
  pricing_rationale: string;
}

interface CandidateDiscovery {
  id: string;
  agent_id: string | null;
  type: string;
  title: string;
  description: string | null;
  impact: string | null;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
}

const SYSTEM_PROMPT = `Eres SAGE, el agente PACAME experto en empaquetado de soluciones digitales para PYMEs en España.

Tu trabajo: convertir un "discovery" (insight, patrón, oportunidad) en un PRODUCTO EMPAQUETABLE del catálogo de la factoría PACAME.

CONTEXTO PACAME (factoría de soluciones con IA):
- 10 agentes: DIOS (orquesta), NOVA (branding), ATLAS (SEO), NEXUS (ads), PIXEL (web/frontend), CORE (backend/infra), PULSE (social), SAGE (estrategia/pricing), COPY (copy), LENS (analytics).
- 3 tiers Hormozi:
  · Starter (500–1500 €) — validar presencia, 5–10 días, agentes básicos
  · Stack (2000–5000 €) — escalar lo que funciona, 15–30 días, multi-agente
  · Ready (1500–3000 € pago único) — auditoría + roadmap, 7–14 días, DIOS/SAGE/LENS
- Pricing variable por valor entregado + suscripción mensual + ofertas Hormozi.
- Tono: directo, sin humo, números concretos, tutear.

OUTPUT REQUERIDO: SOLO un objeto JSON válido (sin markdown fences, sin comentarios) con esta estructura exacta:

{
  "name": "string corto y comercial (ej: 'Pack Reservas IA Hostelería')",
  "tier": "starter" | "stack" | "ready",
  "price_from": number en euros,
  "price_to": number en euros,
  "monthly_subscription": number o null,
  "agents": ["DIOS", "PIXEL", ...] (códigos uppercase),
  "skills_count": number entre 5 y 200,
  "deliverables": [array de 4-7 strings concretos, cada uno con verbo + objeto + métrica],
  "timeline_days": { "min": number, "max": number },
  "target_sector": "string (ej: 'hostelería', 'clínicas dentales', 'e-commerce moda')",
  "hook_copy": "una sola frase comercial en español, max 80 caracteres, directa, sin clichés",
  "pricing_rationale": "string corto explicando por qué este rango (max 200 caracteres)"
}

Reglas duras:
- NO inventar agentes. Solo los 10 listados.
- skills_count realista según tier (Starter ~24, Stack ~96, Ready ~12).
- deliverables específicos del discovery, no genéricos.
- Si el discovery es sobre un sector concreto, target_sector debe reflejarlo.
- hook_copy en español de España, sin "te ayudamos a", sin "potencia tu negocio".
- Solo JSON, nada más.`;

function buildUserPrompt(d: CandidateDiscovery): string {
  return `Discovery a empaquetar:

ID: ${d.id}
Agente origen: ${d.agent_id?.toUpperCase() ?? "—"}
Tipo: ${d.type}
Impact: ${d.impact ?? "—"}  Confidence: ${d.confidence ?? "—"}

Título:
${d.title}

Descripción:
${d.description ?? "(sin descripción)"}

Genera el JSON del producto empaquetado.`;
}

function tryParseJson(text: string): PackagedProduct | null {
  let cleaned = text.trim();
  // Strip markdown fences si vienen
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  // Si hay texto antes/después, recortar al primer y último brace.
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return null;
  cleaned = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(cleaned) as PackagedProduct;
  } catch {
    return null;
  }
}

function isValidProduct(p: unknown): p is PackagedProduct {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.tier === "string" &&
    ["starter", "stack", "ready"].includes(o.tier as string) &&
    typeof o.price_from === "number" &&
    typeof o.price_to === "number" &&
    Array.isArray(o.agents) &&
    Array.isArray(o.deliverables) &&
    typeof o.target_sector === "string" &&
    typeof o.hook_copy === "string"
  );
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Selección de candidatos
  const { data: candidates, error } = await supabase
    .from("agent_discoveries")
    .select("id, agent_id, type, title, description, impact, confidence, metadata")
    .in("impact", ["medium", "high"])
    .gte("confidence", 0.7)
    .eq("status", "new")
    .gte("created_at", thirtyDaysAgo)
    .order("confidence", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_PER_RUN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      packaged: 0,
      reason: "no candidates matched (impact medium+, confidence >= 0.7, status new, last 30d)",
    });
  }

  const results: { id: string; status: "packaged" | "failed"; product?: PackagedProduct; error?: string }[] = [];

  // 2. Empaquetar cada uno
  for (const c of candidates as CandidateDiscovery[]) {
    try {
      const llmRes = await llmChat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(c) },
        ],
        {
          tier: "titan",
          maxTokens: 1500,
          temperature: 0.4,
          agentId: "sage",
          source: "factoria-package-cron",
          metadata: { discovery_id: c.id, discovery_type: c.type },
        }
      );

      const parsed = tryParseJson(llmRes.content);
      if (!parsed || !isValidProduct(parsed)) {
        results.push({ id: c.id, status: "failed", error: "invalid JSON output from LLM" });
        continue;
      }

      // 3. Update discovery
      const newMetadata = {
        ...(c.metadata ?? {}),
        packaged_product: parsed,
        packaged_at: new Date().toISOString(),
        packaged_by: "sage",
        packaged_via: "factoria-cron",
        packaged_provider: llmRes.provider,
      };

      const { error: updateError } = await supabase
        .from("agent_discoveries")
        .update({
          status: "packaged",
          reviewed_at: new Date().toISOString(),
          metadata: newMetadata,
        })
        .eq("id", c.id);

      if (updateError) {
        results.push({ id: c.id, status: "failed", error: updateError.message });
        continue;
      }

      results.push({ id: c.id, status: "packaged", product: parsed });
    } catch (err) {
      results.push({
        id: c.id,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const packagedCount = results.filter((r) => r.status === "packaged").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    packaged: packagedCount,
    failed: failedCount,
    results,
    timestamp: new Date().toISOString(),
  });
}

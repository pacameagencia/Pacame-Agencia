import { getLogger } from "@/lib/observability/logger";

/**
 * PACAME — Auto-QA reviewer
 *
 * Revisa automaticamente un entregable antes de marcarlo como 'delivered'.
 * Usa LLM tier="standard" (Nebius) para evaluar calidad, fit al brief y ready-to-ship.
 *
 * Si score < qa_threshold (default 7) → passed=false → orquestador escala a Pablo.
 * Si score >= threshold → passed=true → se entrega al cliente.
 *
 * Coste tipico: 1-3 centimos por review.
 */

import { llmChat, extractJSON } from "@/lib/llm";
import { createServerSupabase } from "@/lib/supabase/server";
import type { GeneratedDeliverable } from "@/lib/delivery/types";

export interface QAOrder {
  id: string;
  order_number?: string | null;
  service_slug: string;
  inputs?: Record<string, unknown> | null;
}

export interface QACatalog {
  name?: string | null;
  qa_threshold?: number | null;
}

export interface QAResult {
  score: number;
  passed: boolean;
  feedback: string;
  costUsd: number;
  strengths: string[];
  concerns: string[];
  readyToDeliver: boolean;
  modelUsed: string;
}

interface QALLMResponse {
  score?: number;
  strengths?: string[];
  concerns?: string[];
  ready_to_deliver?: boolean;
  feedback?: string;
}

function summarizeDeliverables(deliverables: GeneratedDeliverable[]): string {
  return deliverables
    .map((d, idx) => {
      const lines: string[] = [`--- Deliverable #${idx + 1} (kind=${d.kind}) ---`];
      if (d.title) lines.push(`Title: ${d.title}`);
      if (d.fileUrl) lines.push(`File: ${d.fileUrl}`);
      if (d.previewUrl) lines.push(`Preview: ${d.previewUrl}`);
      if (d.payload !== undefined && d.payload !== null) {
        let payloadStr: string;
        try {
          payloadStr = typeof d.payload === "string"
            ? d.payload
            : JSON.stringify(d.payload, null, 2);
        } catch {
          payloadStr = String(d.payload);
        }
        lines.push(`Payload:\n${payloadStr.slice(0, 4000)}`);
      }
      if (d.meta && Object.keys(d.meta).length > 0) {
        try {
          lines.push(`Meta: ${JSON.stringify(d.meta).slice(0, 500)}`);
        } catch {
          /* ignore */
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

/**
 * Revisa un entregable con LLM. Persiste el resultado en `delivery_qa_checks`.
 */
export async function reviewDeliverable(
  order: QAOrder,
  deliverables: GeneratedDeliverable[],
  catalog: QACatalog | null | undefined
): Promise<QAResult> {
  const threshold = Number(catalog?.qa_threshold ?? 7);
  const serviceName = catalog?.name || order.service_slug;
  const inputsJson = (() => {
    try {
      return JSON.stringify(order.inputs ?? {}, null, 2).slice(0, 4000);
    } catch {
      return "{}";
    }
  })();
  const deliverablesDump = summarizeDeliverables(deliverables).slice(0, 8000);

  const systemPrompt =
    "Eres QA reviewer senior de PACAME, agencia digital premium. Tu trabajo es evaluar entregables antes de que salgan al cliente. " +
    "Eres exigente pero justo. Puntuas sobre 10. Devuelves SIEMPRE JSON valido, nada mas.";

  const userPrompt =
    `Evalua el siguiente entregable para el cliente.\n\n` +
    `Servicio: ${serviceName}\n` +
    `Order: ${order.order_number || order.id}\n\n` +
    `Inputs del brief (lo que pidio el cliente):\n${inputsJson}\n\n` +
    `Entregable(s) generado(s):\n${deliverablesDump}\n\n` +
    `Puntua de 0 a 10 segun:\n` +
    `(1) cumple los inputs del brief,\n` +
    `(2) calidad profesional,\n` +
    `(3) listo para entregar al cliente sin retoques.\n\n` +
    `Umbral minimo para entregar: ${threshold}/10.\n\n` +
    `Devuelve SOLO JSON (sin markdown, sin comentarios) con este schema exacto:\n` +
    `{"score": number, "strengths": [string], "concerns": [string], "ready_to_deliver": boolean, "feedback": string}`;

  let content = "";
  let modelUsed = "unknown";
  let costUsd = 0;

  try {
    const llm = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { tier: "standard", maxTokens: 600, temperature: 0.2, callSite: "delivery/qa_score" }
    );
    content = llm.content;
    modelUsed = `${llm.provider}:${llm.model}`;
    // Estimacion conservadora: ~$0.0008 per 1K tokens para tier standard Nebius
    const totalTokens = (llm.tokensIn || 0) + (llm.tokensOut || 0);
    costUsd = +(totalTokens * 0.0000008).toFixed(6);
  } catch (err) {
    getLogger().error({ err }, "[qa] llmChat fallo");
    // Si el LLM falla, no bloqueamos la entrega — aprobamos pero marcamos concern
    const fallback: QAResult = {
      score: threshold, // justo en el umbral para no bloquear
      passed: true,
      feedback: `QA automatico no disponible (LLM error: ${(err as Error).message.slice(0, 200)}). Aprobado por fallback.`,
      costUsd: 0,
      strengths: [],
      concerns: ["QA reviewer no pudo ejecutarse — revision manual recomendada"],
      readyToDeliver: true,
      modelUsed: "fallback:skip",
    };
    await persistQACheck(order.id, deliverables, fallback);
    return fallback;
  }

  const parsed = extractJSON<QALLMResponse>(content);
  const scoreRaw = Number(parsed?.score);
  const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(10, scoreRaw)) : 0;
  const readyToDeliver = Boolean(parsed?.ready_to_deliver);
  const strengths = Array.isArray(parsed?.strengths)
    ? parsed!.strengths!.filter((s): s is string => typeof s === "string").slice(0, 6)
    : [];
  const concerns = Array.isArray(parsed?.concerns)
    ? parsed!.concerns!.filter((c): c is string => typeof c === "string").slice(0, 6)
    : [];
  const feedback =
    (typeof parsed?.feedback === "string" && parsed.feedback.trim()) ||
    content.slice(0, 1000) ||
    "Sin feedback del reviewer.";

  const passed = score >= threshold && readyToDeliver;

  const result: QAResult = {
    score,
    passed,
    feedback,
    costUsd,
    strengths,
    concerns,
    readyToDeliver,
    modelUsed,
  };

  await persistQACheck(order.id, deliverables, result);
  return result;
}

async function persistQACheck(
  orderId: string,
  deliverables: GeneratedDeliverable[],
  result: QAResult
): Promise<void> {
  try {
    const supabase = createServerSupabase();
    // Resolvemos el deliverable_id por order_id (version actual) si existe
    const { data: latest } = await supabase
      .from("deliverables")
      .select("id")
      .eq("order_id", orderId)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("delivery_qa_checks").insert({
      order_id: orderId,
      deliverable_id: latest?.id || null,
      score: result.score,
      passed: result.passed,
      feedback: result.feedback,
      model_used: result.modelUsed,
      cost_usd: result.costUsd,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = deliverables.length; // keep arg for future per-deliverable granularity
  } catch (err) {
    getLogger().error({ err }, "[qa] persist delivery_qa_checks fallo");
  }
}

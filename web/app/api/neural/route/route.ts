/**
 * POST /api/neural/route
 * Nervio central PACAME: recibe un input, consulta cerebro, devuelve agente +
 * skill + contexto. No ejecuta Claude, solo orquesta.
 *
 * Body: {
 *   input: string,                 // requerido
 *   source?: 'webhook'|'cron'|'user'|'agent'|'sensor'|'system'|'external_api',
 *   channel?: string,              // 'telegram', 'whatsapp', 'email', 'api'
 *   agent_hint?: string,           // opcional, fuerza agente
 *   execute?: boolean              // si true, también invoca Claude (próximo)
 * }
 *
 * Response: { agent, skill, memories, discoveries, context, stimulus_id }
 */
import { NextResponse } from "next/server";
import { routeInput, logLlmCall } from "@/lib/neural";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const body = await req.json().catch(() => null);
    if (!body?.input || typeof body.input !== "string") {
      return NextResponse.json(
        { error: "input (string) requerido" },
        { status: 400 }
      );
    }

    const result = await routeInput({
      input: body.input,
      source: body.source,
      channel: body.channel,
      agentHint: body.agent_hint,
    });

    const latency = Date.now() - started;

    // Registrar la llamada al router (no es Claude, pero lo loggeamos
    // igual para ver el uso del nervio central)
    logLlmCall({
      callSite: "neural/route",
      provider: "ollama",
      model: "nomic-embed-text",
      tokensIn: Math.ceil(body.input.length / 4),
      latencyMs: latency,
      success: true,
      strategy: "route",
      metadata: {
        agent: result.agent,
        skill: result.skill?.label,
        memories_count: result.memories.length,
        discoveries_count: result.discoveries.length,
        source: body.source,
        channel: body.channel,
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      latency_ms: latency,
      ...result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/neural/route",
    method: "POST",
    body: {
      input: "string (required)",
      source: "webhook|cron|user|agent|sensor|system|external_api",
      channel: "telegram|whatsapp|email|api",
      agent_hint: "dios|nova|atlas|nexus|pixel|core|pulse|sage|copy|lens",
    },
    description:
      "Orquestador neural. Recibe input, busca top-k memorias y discoveries semánticamente, elige agente + skill, devuelve contexto listo para inyectar en prompt.",
  });
}

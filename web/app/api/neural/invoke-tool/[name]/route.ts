/**
 * ALL /api/neural/invoke-tool/[name]
 *
 * Wrapper genérico para invocar auto-tools de tipo `endpoint`.
 * Resuelve la tool por nombre, verifica que esté activa (no disabled / corrupted),
 * hace fetch interno a /api/auto-tools/<name> y registra telemetría.
 *
 * Devuelve la response de la tool tal cual + headers `x-tool-*` con métricas.
 *
 * El header `x-agent` (opcional) identifica el agente invocador.
 * Contrato success: la tool debe devolver JSON `{ok: boolean, ...}`.
 *   - ok===true → success
 *   - ok===false → failure (incluso si HTTP 200)
 *   - HTTP 4xx/5xx → failure
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { recordToolInvocation } from "@/lib/neural";

export const runtime = "nodejs";
export const maxDuration = 30;

async function handle(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  if (!name || !/^[a-z0-9-]+$/.test(name) || name.length > 40) {
    return NextResponse.json({ ok: false, error: "tool name inválido" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: gap } = await supabase
    .from("agent_tool_gaps")
    .select("id, status, tool_kind, tool_name, draft_path")
    .eq("tool_name", name)
    .single();

  if (!gap) {
    return NextResponse.json(
      { ok: false, error: `tool '${name}' no encontrada` },
      { status: 404 }
    );
  }

  const status = gap.status as string;
  const kind = gap.tool_kind as string;

  if (kind !== "endpoint") {
    return NextResponse.json(
      { ok: false, error: `tool '${name}' es kind='${kind}', no invocable via wrapper (solo endpoints)` },
      { status: 400 }
    );
  }

  if (status === "disabled" || status === "corrupted" || status === "rejected") {
    return NextResponse.json(
      { ok: false, error: `tool '${name}' status=${status}` },
      { status: 410 }
    );
  }

  if (!["drafted", "probation", "promoted"].includes(status)) {
    return NextResponse.json(
      { ok: false, error: `tool '${name}' no usable, status=${status}` },
      { status: 409 }
    );
  }

  // Construir URL absoluta a /api/auto-tools/<name>
  const url = new URL(request.url);
  const target = `${url.protocol}//${url.host}/api/auto-tools/${name}${url.search}`;

  const invokerAgent = request.headers.get("x-agent") || null;
  const startedAt = Date.now();
  let success = false;
  let errorMessage: string | null = null;
  let upstreamStatus = 0;
  let body: string | null = null;
  let parsedOk: boolean | null = null;

  try {
    const init: RequestInit = {
      method: request.method,
      headers: {
        "content-type": request.headers.get("content-type") || "application/json",
        "x-agent": invokerAgent || "",
      },
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.text();
    }

    const upstream = await fetch(target, {
      ...init,
      signal: AbortSignal.timeout(25_000),
    });
    upstreamStatus = upstream.status;
    body = await upstream.text();

    if (upstream.status >= 400) {
      success = false;
      errorMessage = `HTTP ${upstream.status}`;
    } else {
      // Parse contrato {ok: boolean, ...}
      try {
        const j = JSON.parse(body);
        parsedOk = typeof j?.ok === "boolean" ? j.ok : null;
        success = parsedOk === false ? false : true;
        if (parsedOk === false) errorMessage = j?.error || "ok=false";
      } catch {
        // No JSON → trata 2xx como success
        success = true;
      }
    }
  } catch (err) {
    success = false;
    errorMessage = (err as Error).message;
    upstreamStatus = 0;
  }

  const durationMs = Date.now() - startedAt;

  // Telemetría no-bloqueante
  void recordToolInvocation({
    gapId: gap.id as string,
    toolName: name,
    agent: invokerAgent,
    success,
    durationMs,
    error: errorMessage,
  });

  // Devolver response upstream tal cual + headers de métricas
  const headers: HeadersInit = {
    "content-type": "application/json",
    "x-tool-name": name,
    "x-tool-status": status,
    "x-tool-success": String(success),
    "x-tool-duration-ms": String(durationMs),
  };

  if (body) {
    return new NextResponse(body, { status: upstreamStatus || (success ? 200 : 502), headers });
  }
  return NextResponse.json(
    { ok: success, error: errorMessage, duration_ms: durationMs },
    { status: upstreamStatus || (success ? 200 : 502), headers }
  );
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;

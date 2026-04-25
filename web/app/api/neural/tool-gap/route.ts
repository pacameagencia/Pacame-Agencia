/**
 * POST /api/neural/tool-gap
 *
 * Un agente PACAME registra que necesita una tool que no existe.
 * Hace dedupe semántico (cosine ≥0.85): si ya hay un gap similar, devuelve su ID.
 * Sanitiza el intent y examples contra prompt injection.
 *
 * Body: {
 *   agent: string,           // id del agente que solicita (sage|atlas|nexus|...)
 *   intent: string,          // descripción de qué tool falta
 *   examples?: array,        // payloads/contextos de ejemplo
 *   metadata?: object
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { recordToolGap } from "@/lib/neural";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

const INJECTION_PATTERNS = [
  /ignore\s+(?:previous|all|the)/i,
  /system\s*prompt/i,
  /<\s*\|im_start\|/i,
  /\\bnew\s+instructions/i,
  /forget\s+(?:everything|all|previous)/i,
  /you\s+are\s+now/i,
];

function sanitize(text: string): { clean: string; flagged: boolean } {
  if (!text) return { clean: "", flagged: false };
  for (const pat of INJECTION_PATTERNS) {
    if (pat.test(text)) return { clean: text, flagged: true };
  }
  // Truncado defensivo
  const clean = text.slice(0, 2000);
  return { clean, flagged: false };
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  let body: {
    agent?: string;
    intent?: string;
    examples?: unknown[];
    metadata?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json inválido" }, { status: 400 });
  }

  const agent = (body.agent || "").toString().toLowerCase().trim();
  const rawIntent = (body.intent || "").toString().trim();
  if (!agent || !rawIntent || rawIntent.length < 10) {
    return NextResponse.json(
      { ok: false, error: "agent + intent (≥10 chars) requeridos" },
      { status: 400 }
    );
  }

  // Sanitización anti-prompt-injection
  const { clean: cleanIntent, flagged: intentFlagged } = sanitize(rawIntent);

  let cleanExamples: unknown[] = [];
  let examplesFlagged = false;
  if (Array.isArray(body.examples)) {
    cleanExamples = body.examples.slice(0, 10).map((ex) => {
      if (typeof ex === "string") {
        const r = sanitize(ex);
        if (r.flagged) examplesFlagged = true;
        return r.clean;
      }
      // Objetos: serializa, sanitiza, devuelve string si flagged
      try {
        const s = JSON.stringify(ex).slice(0, 2000);
        const r = sanitize(s);
        if (r.flagged) examplesFlagged = true;
        return ex;
      } catch {
        return null;
      }
    });
  }

  if (intentFlagged || examplesFlagged) {
    return NextResponse.json(
      {
        ok: false,
        error: "input flagged: posible prompt injection",
        flagged: { intent: intentFlagged, examples: examplesFlagged },
      },
      { status: 422 }
    );
  }

  const result = await recordToolGap({
    agent,
    intent: cleanIntent,
    examples: cleanExamples,
    metadata: {
      ...(body.metadata || {}),
      source: "tool-gap-endpoint",
      received_at: new Date().toISOString(),
    },
  });

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "no se pudo registrar gap (ver logs)" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    gap_id: result.gap_id,
    deduped: result.deduped,
    message: result.deduped
      ? "Gap similar ya existe; devolviendo gap_id existente"
      : "Gap registrado, será procesado por draft-tool en próximo cron",
  });
}

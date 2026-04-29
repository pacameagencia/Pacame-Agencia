/**
 * POST /api/neural/embed-bulk
 *
 * Procesa un lote de knowledge_nodes sin embedding y los embeda usando Ollama VPS.
 * Diseñado para ser invocado repetidamente (cron o manual) hasta agotar pendientes.
 *
 * Auditoria 2026-04-29: 8.591 nodos pendientes (gap 82%), 7.850 son hypothesis.
 *
 * Body (opcional):
 *   {
 *     "batch_size": 30,         // default 30
 *     "max_batches": 3,         // default 3 (para respetar timeout serverless ~60s)
 *     "node_type": "hypothesis" // default null = cualquier tipo pendiente
 *   }
 *
 * Response:
 *   {
 *     ok, processed, failed, batches_run, remaining,
 *     elapsed_ms, sample_ids: string[]
 *   }
 *
 * Auth: requiere header `x-cron-secret: ${CRON_SECRET}` o llamada interna.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { embedBatch, toPgVector } from "@/lib/embed-ollama";

export const runtime = "nodejs";
export const maxDuration = 60;

interface BulkBody {
  batch_size?: number;
  max_batches?: number;
  node_type?: string;
}

interface NodeRow {
  id: string;
  label: string;
  content?: string | null;
  description?: string | null;
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  const provided = req.headers.get("x-cron-secret") || "";
  if (cronSecret && provided !== cronSecret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: BulkBody = {};
  try {
    body = (await req.json().catch(() => ({}))) as BulkBody;
  } catch {
    body = {};
  }

  const batchSize = Math.min(Math.max(body.batch_size ?? 30, 1), 100);
  const maxBatches = Math.min(Math.max(body.max_batches ?? 3, 1), 10);
  const nodeType = body.node_type ?? null;

  const supabase = createServerSupabase();
  const started = Date.now();

  let processed = 0;
  let failed = 0;
  let batchesRun = 0;
  const sampleIds: string[] = [];

  for (let b = 0; b < maxBatches; b++) {
    let q = supabase
      .from("knowledge_nodes")
      .select("id, label, content, description")
      .is("embedding", null)
      .limit(batchSize);
    if (nodeType) q = q.eq("node_type", nodeType);

    const { data: rows, error } = (await q) as {
      data: NodeRow[] | null;
      error: { message: string } | null;
    };
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, processed, failed, batches_run: batchesRun },
        { status: 500 }
      );
    }
    if (!rows || rows.length === 0) break;

    const texts = rows.map((r) => {
      const parts = [r.label || "", r.description || "", r.content || ""];
      return parts.filter(Boolean).join(" — ").slice(0, 8000);
    });

    const vectors = await embedBatch(texts, 3);

    // Update individual (UPDATE en bulk con pgvector requiere SQL crudo; uno-a-uno es seguro)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const vec = vectors[i];
      if (!vec) {
        failed++;
        continue;
      }
      const { error: upErr } = await supabase
        .from("knowledge_nodes")
        .update({ embedding: toPgVector(vec) })
        .eq("id", row.id);
      if (upErr) {
        failed++;
      } else {
        processed++;
        if (sampleIds.length < 5) sampleIds.push(row.id);
      }
    }

    batchesRun++;
  }

  // Calcular pendientes restantes
  let remaining: number | null = null;
  {
    let countQ = supabase
      .from("knowledge_nodes")
      .select("*", { count: "exact", head: true })
      .is("embedding", null);
    if (nodeType) countQ = countQ.eq("node_type", nodeType);
    const { count } = await countQ;
    remaining = count ?? null;
  }

  return NextResponse.json({
    ok: true,
    processed,
    failed,
    batches_run: batchesRun,
    remaining,
    elapsed_ms: Date.now() - started,
    sample_ids: sampleIds,
    config: { batch_size: batchSize, max_batches: maxBatches, node_type: nodeType },
  });
}

export async function GET() {
  // Health check: cuenta pendientes por tipo
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("knowledge_nodes")
    .select("node_type, embedding")
    .is("embedding", null);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const byType: Record<string, number> = {};
  for (const row of data || []) {
    const t = (row as { node_type?: string }).node_type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    pending_total: data?.length ?? 0,
    pending_by_type: byType,
    embed_model: process.env.EMBED_MODEL || "nomic-embed-text",
    ollama_url: process.env.GEMMA_API_URL || "https://gemma.pacameagencia.com",
  });
}

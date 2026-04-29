import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { hostingerClient, hostingerRequest } from "@/lib/hostinger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generic passthrough to the Hostinger API. PACAME drives any operation —
 * domains, VPS metrics, restart, snapshots, mail, SSL — without a typed
 * wrapper per resource.
 *
 * Body:
 *   {
 *     "method": "GET" | "POST" | ...,
 *     "path": "vps/v1/virtual-machines" | "billing/v1/subscriptions" | ...,
 *     "body": { ... } (optional),
 *     "query": { ... } (optional),
 *     "backup_id": "uuid" (REQUIRED for non-GET methods)
 *   }
 *
 * SAFETY: writes (POST/PUT/DELETE/PATCH) require a `backup_id` referencing
 * a `client_backups` row created within the last 24h. Otherwise rejected
 * with 400 (regla "Backup antes de tocar prod cliente").
 *
 * Each call is recorded in agent_tasks for traceability.
 */

const bodySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  path: z.string().min(1).max(500),
  body: z.unknown().optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  backup_id: z.uuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; crid: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id, crid } = await params;
  const supabase = createServerSupabase();

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { method, path, body, query, backup_id } = parsed.data;

  // Verifica que la credencial pertenece a este cliente.
  const { data: credRow, error: credErr } = await supabase
    .from("client_credentials")
    .select("id, client_id, type")
    .eq("id", crid)
    .eq("client_id", id)
    .single();
  if (credErr || !credRow) {
    return NextResponse.json({ error: "credential not found for this client" }, { status: 404 });
  }
  if (credRow.type !== "hostinger_api") {
    return NextResponse.json({ error: `credential type=${credRow.type}, expected hostinger_api` }, { status: 400 });
  }

  // Guard: writes requieren backup reciente. GET siempre permitido.
  if (method !== "GET") {
    if (!backup_id) {
      return NextResponse.json(
        { error: "Write operations require backup_id (regla: backup antes de tocar prod cliente)" },
        { status: 400 }
      );
    }
    const { data: backup } = await supabase
      .from("client_backups")
      .select("id, client_id, status, completed_at")
      .eq("id", backup_id)
      .eq("client_id", id)
      .single();
    if (!backup || backup.status !== "completed") {
      return NextResponse.json({ error: "backup_id not found or not completed" }, { status: 400 });
    }
    const ageMs = Date.now() - new Date(backup.completed_at!).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "backup is older than 24h, create a fresh one first" }, { status: 400 });
    }
  }

  const startedAt = Date.now();
  let result: unknown = null;
  let errorMessage: string | null = null;
  let statusCode = 200;

  try {
    const client = await hostingerClient(crid);
    const response = await hostingerRequest(client, method, path, { body, query });
    result = response.data;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "unknown error";
    statusCode = 502;
  }

  // Audit log (non-blocking).
  void supabase
    .from("agent_tasks")
    .insert({
      agent: "core",
      subagent: "hostinger-passthrough",
      task_type: `hostinger:${method}:${path.split("?")[0]}`,
      client_id: id,
      input_data: { credential_id: crid, method, path, query: query || null, has_body: body !== undefined, backup_id: backup_id || null },
      output_data: errorMessage ? { error: errorMessage } : { result },
      status: errorMessage ? "failed" : "completed",
      error_message: errorMessage,
      duration_ms: Date.now() - startedAt,
      completed_at: new Date().toISOString(),
    })
    .then(() => {});

  if (errorMessage) {
    return NextResponse.json({ ok: false, error: errorMessage }, { status: statusCode });
  }
  return NextResponse.json({ ok: true, data: result });
}

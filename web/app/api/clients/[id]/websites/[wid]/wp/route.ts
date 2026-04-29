import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { wpClient, wpRequest } from "@/lib/wordpress";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generic passthrough so Pablo (via Claude Code or n8n) can drive the client's
 * WordPress from PACAME for ANY operation, not only blog publish.
 *
 * Body:
 *   {
 *     "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
 *     "path": "pages/42" | "wp/v2/pages/42" | "wc/v3/products",
 *     "body": { ... } (optional),
 *     "query": { per_page: 5, search: "anillo" } (optional)
 *   }
 *
 * Response: { ok, status, data }
 *
 * Auth: same as other internal endpoints — Bearer CRON_SECRET or pacame_auth cookie.
 * Logs: every call writes a row to agent_tasks with input/output for traceability.
 */

const bodySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  path: z.string().min(1).max(500),
  body: z.unknown().optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wid: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id, wid } = await params;
  const supabase = createServerSupabase();

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { method, path, body, query } = parsed.data;

  const { data: site, error: siteError } = await supabase
    .from("client_websites")
    .select("id, client_id, platform")
    .eq("id", wid)
    .eq("client_id", id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: "website not found for this client" }, { status: 404 });
  }
  if (site.platform !== "wordpress") {
    return NextResponse.json({ error: "passthrough only supported for wordpress" }, { status: 400 });
  }

  const startedAt = Date.now();
  let result: unknown = null;
  let errorMessage: string | null = null;
  let statusCode = 200;

  try {
    const client = await wpClient(wid);
    result = await wpRequest(client, method, path, { body, query });
    await supabase
      .from("client_websites")
      .update({ last_sync_at: new Date().toISOString(), status: "connected", last_error: null })
      .eq("id", wid);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "unknown error";
    statusCode = 502;
    await supabase
      .from("client_websites")
      .update({ status: "error", last_error: errorMessage.slice(0, 500) })
      .eq("id", wid);
  }

  // Trazabilidad: cada llamada queda registrada para que veas qué hizo PACAME.
  // No bloquea la respuesta si falla.
  void supabase
    .from("agent_tasks")
    .insert({
      agent: "core",
      subagent: "wordpress-passthrough",
      task_type: `wp:${method}:${path.split("?")[0]}`,
      client_id: id,
      input_data: { website_id: wid, method, path, query: query || null, has_body: body !== undefined },
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

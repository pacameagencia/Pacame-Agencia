import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createHmac } from "crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Pasarela al plugin MU PACAME (`pacame-connect.php`) que vive en el WP cliente.
 * Permite llamar a /wp-json/pacame/v1/* con HMAC compartido para operaciones
 * que la WP REST estándar no cubre: cachés, plugins state, logs PHP, queries
 * SQL seguras, backups via UpdraftPlus.
 *
 * Body:
 *   {
 *     "method": "GET" | "POST",
 *     "path": "cache/clear" | "system/info" | "logs/php" | "plugins" | "db/query" | "backup/run",
 *     "body": { ... },
 *     "query": { ... },
 *     "backup_id": "uuid" (REQUIRED for write/destructive ops)
 *   }
 */

const bodySchema = z.object({
  method: z.enum(["GET", "POST"]).default("GET"),
  path: z.string().min(1).max(200),           // sin /wp-json/pacame/v1/ prefix
  body: z.unknown().optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  backup_id: z.uuid().optional(),
});

const WRITE_PATHS = [
  "cache/clear",       // safe-ish, pero técnicamente borra caché
  "plugins/",          // /plugins/{slug}/state
  "backup/run",        // dispara backup, no destructivo pero lo registramos
];

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
  const { method, path, body, query, backup_id } = parsed.data;

  const { data: site, error: siteError } = await supabase
    .from("client_websites")
    .select("id, client_id, base_url, wp_api_namespace, webhook_secret, status")
    .eq("id", wid)
    .eq("client_id", id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: "website not found for this client" }, { status: 404 });
  }
  if (!site.webhook_secret) {
    return NextResponse.json(
      { error: "webhook_secret not configured. Generate one and put it in the WP plugin's wp-config.php (PACAME_WEBHOOK_SECRET)." },
      { status: 400 }
    );
  }

  // Guard: operaciones que escriben/destructivas piden backup reciente.
  // /db/query es SELECT-only en el plugin, así que NO lo metemos en write paths.
  // /plugins/{slug}/state activate|deactivate y /backup/run sí necesitan backup_id
  // por la regla "backup antes de tocar prod".
  const isDestructiveOrChangeState = WRITE_PATHS.some((p) => path === p || path.startsWith(p)) && method === "POST";
  // /cache/clear es bajo riesgo, lo eximimos del backup obligatorio (puede romper visualmente pero no hay pérdida de datos).
  const requiresBackup = isDestructiveOrChangeState && !path.startsWith("cache/clear");

  if (requiresBackup) {
    if (!backup_id) {
      return NextResponse.json(
        { error: `Operation '${path}' requires backup_id (regla: backup antes de tocar prod cliente)` },
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

  // Construir URL al endpoint custom del plugin MU.
  const cleanPath = path.replace(/^\/+/, "");
  let fullPath = `/wp-json/pacame/v1/${cleanPath}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      qs.set(k, String(v));
    }
    if (qs.toString()) fullPath += `?${qs.toString()}`;
  }
  const url = site.base_url.replace(/\/+$/, "") + fullPath;

  // HMAC: hash_hmac('sha256', timestamp + ":" + path + ":" + body, secret)
  const timestamp = String(Math.floor(Date.now() / 1000));
  const bodyStr = body !== undefined ? JSON.stringify(body) : "";
  const route = `/wp-json/pacame/v1/${cleanPath}`;
  const payload = `${timestamp}:${route}:${bodyStr}`;
  const signature = createHmac("sha256", site.webhook_secret).update(payload).digest("hex");

  const headers: Record<string, string> = {
    "X-PACAME-Timestamp": timestamp,
    "X-PACAME-Signature": signature,
    "User-Agent": "PACAME-Bot/1.0 (+https://pacameagencia.com)",
    Accept: "application/json",
  };
  let reqBody: BodyInit | undefined;
  if (body !== undefined) {
    reqBody = bodyStr;
    headers["Content-Type"] = "application/json";
  }

  const startedAt = Date.now();
  let result: unknown = null;
  let errorMessage: string | null = null;
  let statusCode = 200;

  try {
    const res = await fetch(url, { method, headers, body: reqBody });
    const text = await res.text();
    try { result = text ? JSON.parse(text) : null; } catch { result = text; }
    if (!res.ok) {
      const detail = typeof result === "string" ? result : JSON.stringify(result);
      throw new Error(`MU ${method} ${cleanPath} → ${res.status}: ${detail.slice(0, 400)}`);
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "unknown error";
    statusCode = 502;
  }

  // Audit log
  void supabase
    .from("agent_tasks")
    .insert({
      agent: "core",
      subagent: "wordpress-mu-passthrough",
      task_type: `wp-mu:${method}:${cleanPath.split("?")[0]}`,
      client_id: id,
      input_data: { website_id: wid, method, path: cleanPath, query: query || null, has_body: body !== undefined, backup_id: backup_id || null },
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

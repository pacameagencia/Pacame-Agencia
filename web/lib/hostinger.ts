import { createServerSupabase } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto-secrets";

/**
 * Hostinger API driver. Uses Bearer token from client_credentials.type='hostinger_api'.
 * Base URL verified empirically: https://developers.hostinger.com/api/{service}/v1/...
 *
 * Coverage (per docs.hostinger.com developers portal):
 *   ✓ billing/v1/subscriptions          → list active services
 *   ✓ domains/v1/portfolio              → list domains
 *   ✓ vps/v1/virtual-machines           → list VPS
 *   ✓ vps/v1/virtual-machines/{id}/...  → restart, metrics
 *   ✓ vps/v1/virtual-machines/{id}/snapshots → backups VPS
 *   ✗ DNS records CRUD                  → no expuesto, manual hPanel
 *   ✗ Backups hosting compartido        → no expuesto, manual hPanel
 *   ✗ File manager                       → no expuesto, usar SFTP
 */

const BASE_URL = "https://developers.hostinger.com/api";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

export type HostingerClient = {
  credentialId: string;
  clientId: string;
  token: string;
};

export async function hostingerClient(credentialId: string): Promise<HostingerClient> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("client_credentials")
    .select("id, client_id, type, ciphertext, iv, tag")
    .eq("id", credentialId)
    .single();

  if (error || !data) {
    throw new Error(`client_credentials ${credentialId} not found: ${error?.message || "no row"}`);
  }
  if (data.type !== "hostinger_api") {
    throw new Error(`credential ${credentialId} is type=${data.type}, expected hostinger_api`);
  }
  const token = decryptSecret({ ciphertext: data.ciphertext, iv: data.iv, tag: data.tag });
  return { credentialId, clientId: data.client_id, token };
}

/**
 * Generic passthrough to Hostinger API. PACAME can drive any endpoint without
 * a typed wrapper per resource.
 *
 * `path` is what comes after `/api/` (e.g. "billing/v1/subscriptions",
 * "domains/v1/portfolio", "vps/v1/virtual-machines/123/restart").
 *
 * Each call records last_used_at + metadata.rate_limit_remaining on the
 * credential row for audit/observability.
 */
export async function hostingerRequest(
  client: HostingerClient,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options: { body?: unknown; query?: Record<string, string | number | boolean | undefined> } = {}
): Promise<{ status: number; data: unknown; rateLimitRemaining?: string | null }> {
  const cleanPath = path.replace(/^\/+/, "").replace(/^api\//, "");
  let url = `${BASE_URL}/${cleanPath}`;

  if (options.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options.query)) {
      if (v === undefined) continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${client.token}`,
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  const rateLimitRemaining = res.headers.get("x-ratelimit-remaining") || res.headers.get("X-RateLimit-Remaining");

  // Update credential telemetry (non-blocking).
  void (async () => {
    const supabase = createServerSupabase();
    if (res.ok) {
      await supabase
        .from("client_credentials")
        .update({
          status: "active",
          last_used_at: new Date().toISOString(),
          last_error: null,
          metadata: { rate_limit_remaining: rateLimitRemaining ?? null },
        })
        .eq("id", client.credentialId);
    } else {
      const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
      await supabase
        .from("client_credentials")
        .update({
          status: res.status === 401 || res.status === 403 ? "error" : "active",
          last_used_at: new Date().toISOString(),
          last_error: `${res.status}: ${detail.slice(0, 300)}`,
        })
        .eq("id", client.credentialId);
    }
  })();

  if (!res.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`Hostinger ${method} ${cleanPath} → ${res.status}: ${detail.slice(0, 500)}`);
  }
  return { status: res.status, data: parsed, rateLimitRemaining };
}

// --- Convenience helpers (read-only por defecto, seguros para llamar siempre) ---

export async function hostingerListSubscriptions(client: HostingerClient): Promise<unknown[]> {
  const { data } = await hostingerRequest(client, "GET", "billing/v1/subscriptions");
  return Array.isArray(data) ? data : [];
}

export async function hostingerListDomains(client: HostingerClient): Promise<unknown[]> {
  const { data } = await hostingerRequest(client, "GET", "domains/v1/portfolio");
  return Array.isArray(data) ? data : [];
}

export async function hostingerListVps(client: HostingerClient): Promise<unknown[]> {
  const { data } = await hostingerRequest(client, "GET", "vps/v1/virtual-machines");
  return Array.isArray(data) ? data : [];
}

export async function hostingerGetVpsMetrics(
  client: HostingerClient,
  vmId: string,
  opts: { dateFrom?: string; dateTo?: string } = {}
): Promise<unknown> {
  return hostingerRequest(client, "GET", `vps/v1/virtual-machines/${vmId}/metrics`, {
    query: { date_from: opts.dateFrom, date_to: opts.dateTo },
  });
}

/**
 * IMPORTANT: this is a WRITE operation that reboots a production VPS.
 * Caller MUST have verified a backup exists per the "backup antes de tocar prod" rule.
 */
export async function hostingerRestartVps(client: HostingerClient, vmId: string): Promise<unknown> {
  return hostingerRequest(client, "POST", `vps/v1/virtual-machines/${vmId}/restart`);
}

/**
 * Helpers para snapshots VPS (Hostinger los llama snapshots, no backups).
 */
export async function hostingerListVpsSnapshots(client: HostingerClient, vmId: string): Promise<unknown> {
  return hostingerRequest(client, "GET", `vps/v1/virtual-machines/${vmId}/snapshots`);
}

export async function hostingerCreateVpsSnapshot(client: HostingerClient, vmId: string): Promise<unknown> {
  return hostingerRequest(client, "POST", `vps/v1/virtual-machines/${vmId}/snapshots`);
}

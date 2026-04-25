/**
 * n8n workflow activator — cierra el círculo:
 *   1. Crea las credentials n8n del cliente (Supabase + Twilio + lo que pase)
 *   2. Descarga workflows del bucket, reemplaza placeholders REPLACE_WITH_X_CRED_ID
 *      por los IDs reales de las credentials recién creadas
 *   3. PUT actualiza cada workflow ya en n8n con los credentialIds reales
 *   4. PATCH /api/v1/workflows/{id} con { active: true } para activar
 *
 * Idempotente: si una credential ya existe con el mismo name, la reusa.
 * Si un workflow ya está activo, lo deja.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { appendDeployLog } from "./log";

const BUCKET = "client-deployments";

export interface ClientCredentials {
  supabase?: { host: string; serviceRole: string };
  twilio?: { accountSid: string; authToken: string };
}

export interface ActivateResult {
  ok: boolean;
  credentials_created: { type: string; id: string; name: string }[];
  workflows_activated: { id: string; name: string }[];
  errors: { step: string; detail: string }[];
}

interface CreatedCred {
  type: string;
  id: string;
  name: string;
}

const N8N_CRED_TYPE_MAP: Record<keyof ClientCredentials, { type: string; placeholder: string; buildData: (input: Record<string, string>) => Record<string, unknown> }> = {
  supabase: {
    type: "supabaseApi",
    placeholder: "REPLACE_WITH_SUPABASE_CRED_ID",
    buildData: (i) => ({
      host: i.host,
      serviceRole: i.serviceRole,
    }),
  },
  twilio: {
    type: "twilioApi",
    placeholder: "REPLACE_WITH_TWILIO_CRED_ID",
    // n8n schema twilioApi requiere `authType` discriminator. Usamos
    // authToken (más común) por defecto. Para apiKey, pasar `apiKeySid` y
    // `apiKeySecret` en lugar de `authToken`.
    buildData: (i) => {
      if (i.apiKeySid && i.apiKeySecret) {
        return {
          authType: "apiKey",
          accountSid: i.accountSid,
          apiKeySid: i.apiKeySid,
          apiKeySecret: i.apiKeySecret,
        };
      }
      return {
        authType: "authToken",
        accountSid: i.accountSid,
        authToken: i.authToken,
      };
    },
  },
};

async function createOrFindCredential(
  baseUrl: string,
  apiKey: string,
  name: string,
  type: string,
  data: Record<string, unknown>
): Promise<{ id: string; created: boolean }> {
  // Check si ya existe
  const listResp = await fetch(`${baseUrl}/api/v1/credentials?limit=200`, {
    headers: { "X-N8N-API-KEY": apiKey },
  });
  if (listResp.ok) {
    const list = (await listResp.json()) as { data?: Array<{ id: string; name: string; type: string }> };
    const existing = list.data?.find((c) => c.name === name);
    if (existing) {
      return { id: existing.id, created: false };
    }
  }

  // Crear nueva
  const createResp = await fetch(`${baseUrl}/api/v1/credentials`, {
    method: "POST",
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, type, data }),
  });

  if (!createResp.ok) {
    const text = await createResp.text();
    throw new Error(`create credential ${name}: ${createResp.status} ${text.slice(0, 200)}`);
  }

  const created = (await createResp.json()) as { id?: string };
  if (!created.id) throw new Error(`create credential ${name}: no id returned`);
  return { id: created.id, created: true };
}

async function listClientWorkflows(
  baseUrl: string,
  apiKey: string,
  slug: string
): Promise<Array<{ id: string; name: string }>> {
  const resp = await fetch(`${baseUrl}/api/v1/workflows?limit=250`, {
    headers: { "X-N8N-API-KEY": apiKey },
  });
  if (!resp.ok) return [];
  const list = (await resp.json()) as { data?: Array<{ id: string; name: string }> };
  const prefix = `[${slug}]`;
  return (list.data ?? []).filter((w) => w.name.startsWith(prefix));
}

async function fetchWorkflowJsonFromBucket(
  slug: string,
  filename: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServerSupabase();
  const path = `${slug}/n8n/workflows/${filename}`;
  const { data: blob } = await supabase.storage.from(BUCKET).download(path);
  if (!blob) return null;
  try {
    return JSON.parse(await blob.text()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Reemplaza placeholders REPLACE_WITH_X_CRED_ID en el workflow JSON
 * con los IDs reales de las credentials recién creadas.
 */
function injectCredentialIds(
  workflow: Record<string, unknown>,
  credIdByPlaceholder: Map<string, string>
): Record<string, unknown> {
  const json = JSON.stringify(workflow);
  let replaced = json;
  for (const [placeholder, id] of credIdByPlaceholder) {
    replaced = replaced.split(placeholder).join(id);
  }
  return JSON.parse(replaced);
}

export async function activateN8nWorkflows(input: {
  deployment_id: string;
  slug: string;
  credentials: ClientCredentials;
}): Promise<ActivateResult> {
  const { deployment_id, slug, credentials } = input;
  const supabase = createServerSupabase();
  const apiKey = process.env.N8N_API_KEY;
  const baseUrl = process.env.N8N_BASE_URL || "https://n8n.pacameagencia.com";

  if (!apiKey) {
    throw new Error("N8N_API_KEY missing");
  }

  const result: ActivateResult = {
    ok: false,
    credentials_created: [],
    workflows_activated: [],
    errors: [],
  };

  await appendDeployLog(supabase, deployment_id, {
    target: "n8n",
    action: "activate-start",
    status: "in_progress",
    detail: { credential_types: Object.keys(credentials) },
  });

  // ── 1. Crear/encontrar credentials ────────────────────────────────────
  const credIdByPlaceholder = new Map<string, string>();
  const credIdsByType: Record<string, string> = {};

  for (const [credKey, credData] of Object.entries(credentials)) {
    if (!credData) continue;
    const def = N8N_CRED_TYPE_MAP[credKey as keyof ClientCredentials];
    if (!def) {
      result.errors.push({ step: `cred:${credKey}`, detail: `Tipo no soportado` });
      continue;
    }

    const credName = `pacame-${slug}-${credKey}`;
    try {
      const { id, created } = await createOrFindCredential(
        baseUrl,
        apiKey,
        credName,
        def.type,
        def.buildData(credData as Record<string, string>)
      );
      credIdByPlaceholder.set(def.placeholder, id);
      credIdsByType[def.type] = id;
      result.credentials_created.push({ type: def.type, id, name: credName });
      await appendDeployLog(supabase, deployment_id, {
        target: "n8n",
        action: `credential:${def.type}`,
        status: "ok",
        detail: { id, name: credName, mode: created ? "created" : "reused" },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      result.errors.push({ step: `cred:${def.type}`, detail });
      await appendDeployLog(supabase, deployment_id, {
        target: "n8n",
        action: `credential:${def.type}`,
        status: "error",
        detail,
      });
    }
  }

  // ── 2. Persistir credential IDs ───────────────────────────────────────
  if (Object.keys(credIdsByType).length > 0) {
    await supabase
      .from("client_deployments")
      .update({ n8n_credentials_ids: credIdsByType })
      .eq("id", deployment_id);
  }

  // ── 3. Para cada workflow: descargar, inyectar credIds, PUT, activar ──
  const clientWorkflows = await listClientWorkflows(baseUrl, apiKey, slug);
  if (clientWorkflows.length === 0) {
    result.errors.push({
      step: "list-workflows",
      detail: `No hay workflows con prefix [${slug}] en n8n. Deploy primero.`,
    });
    return result;
  }

  // Mapeo workflow.name → filename del bucket. Convención: nombre sin prefix.
  // [casa-marisol-cadiz] confirmar-reserva → 01-confirmar-reserva.json
  // Esto es heurístico; mejor sería persistir el mapping en deploy.
  const filenameMap: Record<string, string> = {
    "confirmar-reserva": "01-confirmar-reserva.json",
  };

  for (const wf of clientWorkflows) {
    // Extraer la parte del nombre tras `[slug] `
    const nameAfterPrefix = wf.name.replace(`[${slug}]`, "").trim();
    const filename = filenameMap[nameAfterPrefix];
    if (!filename) {
      result.errors.push({
        step: `workflow:${wf.name}`,
        detail: `No mapping a filename del bucket para "${nameAfterPrefix}"`,
      });
      continue;
    }

    // Descargar JSON original del bucket
    const original = await fetchWorkflowJsonFromBucket(slug, filename);
    if (!original) {
      result.errors.push({
        step: `workflow:${wf.name}`,
        detail: `No se pudo leer ${filename} del bucket`,
      });
      continue;
    }

    // Inyectar credential IDs reales
    const updated = injectCredentialIds(original, credIdByPlaceholder);

    // PUT actualizar workflow con nuevos credentialIds
    try {
      const putResp = await fetch(`${baseUrl}/api/v1/workflows/${wf.id}`, {
        method: "PUT",
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      });

      if (!putResp.ok) {
        const text = await putResp.text();
        result.errors.push({
          step: `update-workflow:${wf.id}`,
          detail: `${putResp.status}: ${text.slice(0, 200)}`,
        });
        await appendDeployLog(supabase, deployment_id, {
          target: "n8n",
          action: `update-workflow:${wf.name}`,
          status: "error",
          detail: `${putResp.status}: ${text.slice(0, 300)}`,
        });
        continue;
      }
    } catch (err) {
      result.errors.push({
        step: `update-workflow:${wf.id}`,
        detail: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    // PATCH activar
    try {
      // n8n usa endpoint dedicado /workflows/{id}/activate (no PATCH active:true)
      const actResp = await fetch(`${baseUrl}/api/v1/workflows/${wf.id}/activate`, {
        method: "POST",
        headers: { "X-N8N-API-KEY": apiKey },
      });

      if (!actResp.ok) {
        const text = await actResp.text();
        result.errors.push({
          step: `activate:${wf.id}`,
          detail: `${actResp.status}: ${text.slice(0, 200)}`,
        });
        await appendDeployLog(supabase, deployment_id, {
          target: "n8n",
          action: `activate:${wf.name}`,
          status: "error",
          detail: `${actResp.status}: ${text.slice(0, 300)}`,
        });
        continue;
      }

      result.workflows_activated.push({ id: wf.id, name: wf.name });
      await appendDeployLog(supabase, deployment_id, {
        target: "n8n",
        action: `activate:${wf.name}`,
        status: "ok",
        detail: { workflow_id: wf.id },
      });
    } catch (err) {
      result.errors.push({
        step: `activate:${wf.id}`,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── 4. Persistir activos ──────────────────────────────────────────────
  if (result.workflows_activated.length > 0) {
    await supabase
      .from("client_deployments")
      .update({
        n8n_workflows_active: result.workflows_activated.map((w) => w.id),
        n8n_activated_at: new Date().toISOString(),
      })
      .eq("id", deployment_id);
  }

  result.ok = result.errors.length === 0 && result.workflows_activated.length > 0;
  return result;
}

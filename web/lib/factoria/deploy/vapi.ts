/**
 * Vapi deployer — crea un assistant + (opcionalmente) un número de teléfono
 * para el cliente desplegado.
 *
 * Lee el archivo `vapi/assistant-config.json` que el materializador subió
 * a Supabase Storage y lo POSTea al API de Vapi.
 *
 * Required env: VAPI_API_KEY
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { appendDeployLog } from "./log";

const VAPI_BASE = "https://api.vapi.ai";
const BUCKET = "client-deployments";

export interface VapiDeployResult {
  ok: boolean;
  assistant_id?: string;
  assistant_url?: string;
  error?: string;
  skipped_reason?: string;
}

export interface DeploymentRow {
  id: string;
  slug: string;
  business_name: string;
}

async function fetchAssistantConfig(slug: string): Promise<Record<string, unknown> | null> {
  const supabase = createServerSupabase();
  const path = `${slug}/vapi/assistant-config.json`;
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !blob) return null;
  const text = await blob.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function deployToVapi(deployment: DeploymentRow): Promise<VapiDeployResult> {
  const supabase = createServerSupabase();
  const apiKey = process.env.VAPI_API_KEY;

  if (!apiKey) {
    await appendDeployLog(supabase, deployment.id, {
      target: "vapi",
      action: "deploy",
      status: "skipped",
      detail: "VAPI_API_KEY no configurada en env. Saltando deploy de Vapi.",
    });
    return { ok: false, skipped_reason: "VAPI_API_KEY missing" };
  }

  await appendDeployLog(supabase, deployment.id, {
    target: "vapi",
    action: "fetch-config",
    status: "in_progress",
  });

  const config = await fetchAssistantConfig(deployment.slug);
  if (!config) {
    await appendDeployLog(supabase, deployment.id, {
      target: "vapi",
      action: "fetch-config",
      status: "error",
      detail: `No se pudo leer ${deployment.slug}/vapi/assistant-config.json del bucket`,
    });
    return { ok: false, error: "assistant config not found in storage" };
  }

  // Idempotencia: si ya existe vapi_assistant_id, hacer PATCH en lugar de POST.
  const { data: existing } = await supabase
    .from("client_deployments")
    .select("vapi_assistant_id")
    .eq("id", deployment.id)
    .single();
  const existingId = (existing?.vapi_assistant_id as string | undefined) ?? null;

  // Verificar que el assistant existente realmente sigue en Vapi.
  let useExisting = false;
  if (existingId) {
    try {
      const checkResp = await fetch(`${VAPI_BASE}/assistant/${existingId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (checkResp.ok) useExisting = true;
    } catch {
      // Si network error, intentamos POST (crear nuevo)
    }
  }

  const action = useExisting ? "update-assistant" : "create-assistant";
  await appendDeployLog(supabase, deployment.id, {
    target: "vapi",
    action,
    status: "in_progress",
    detail: useExisting ? { reusing_id: existingId } : undefined,
  });

  let response: Response;
  try {
    response = await fetch(
      useExisting ? `${VAPI_BASE}/assistant/${existingId}` : `${VAPI_BASE}/assistant`,
      {
        method: useExisting ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await appendDeployLog(supabase, deployment.id, {
      target: "vapi",
      action,
      status: "error",
      detail: `network: ${detail}`,
    });
    return { ok: false, error: `network: ${detail}` };
  }

  if (!response.ok) {
    const text = await response.text();
    await appendDeployLog(supabase, deployment.id, {
      target: "vapi",
      action,
      status: "error",
      detail: `${response.status}: ${text.slice(0, 500)}`,
    });
    return { ok: false, error: `vapi ${response.status}: ${text.slice(0, 200)}` };
  }

  const result = (await response.json()) as { id?: string };
  const assistantId = result.id || existingId;
  if (!assistantId) {
    return { ok: false, error: "vapi response missing id" };
  }

  // Persistir en client_deployments
  await supabase
    .from("client_deployments")
    .update({
      vapi_assistant_id: assistantId,
      vapi_deployed_at: new Date().toISOString(),
    })
    .eq("id", deployment.id);

  await appendDeployLog(supabase, deployment.id, {
    target: "vapi",
    action,
    status: "ok",
    detail: { assistant_id: assistantId, mode: useExisting ? "patched" : "created" },
  });

  return {
    ok: true,
    assistant_id: assistantId,
    assistant_url: `https://dashboard.vapi.ai/assistants/${assistantId}`,
  };
}

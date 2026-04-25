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

  // Crear assistant en Vapi
  await appendDeployLog(supabase, deployment.id, {
    target: "vapi",
    action: "create-assistant",
    status: "in_progress",
  });

  let response: Response;
  try {
    response = await fetch(`${VAPI_BASE}/assistant`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await appendDeployLog(supabase, deployment.id, {
      target: "vapi",
      action: "create-assistant",
      status: "error",
      detail: `network: ${detail}`,
    });
    return { ok: false, error: `network: ${detail}` };
  }

  if (!response.ok) {
    const text = await response.text();
    await appendDeployLog(supabase, deployment.id, {
      target: "vapi",
      action: "create-assistant",
      status: "error",
      detail: `${response.status}: ${text.slice(0, 500)}`,
    });
    return { ok: false, error: `vapi ${response.status}: ${text.slice(0, 200)}` };
  }

  const created = (await response.json()) as { id?: string };
  const assistantId = created.id;
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
    action: "create-assistant",
    status: "ok",
    detail: { assistant_id: assistantId },
  });

  return {
    ok: true,
    assistant_id: assistantId,
    assistant_url: `https://dashboard.vapi.ai/assistants/${assistantId}`,
  };
}

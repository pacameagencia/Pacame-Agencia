/**
 * Vercel deployer — crea un PROJECT vacío en Vercel para el cliente,
 * preparado para conectar con el repo Git del cliente.
 *
 * Decisión arquitectónica: NO subimos archivos directamente vía Vercel API
 * porque solo tenemos archivos parciales (config + prompts), no el codebase
 * Next.js completo. Pablo conecta el repo Git desde el dashboard de Vercel
 * y los pushes futuros despliegan automáticamente.
 *
 * Lo que SÍ hacemos:
 *   1. Crear el project en Vercel con el slug del cliente
 *   2. Asignar las env vars desde el .env.example materializado
 *   3. Devolver la URL del project para que Pablo lo abra en 1 click
 *
 * Required env: VERCEL_TOKEN
 *               VERCEL_TEAM_ID (opcional, si Pablo usa team account)
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { appendDeployLog } from "./log";

const VERCEL_BASE = "https://api.vercel.com";
const BUCKET = "client-deployments";

export interface VercelDeployResult {
  ok: boolean;
  project_id?: string;
  project_name?: string;
  project_url?: string;
  env_vars_count?: number;
  error?: string;
  skipped_reason?: string;
}

export interface DeploymentRow {
  id: string;
  slug: string;
  business_name: string;
}

async function fetchEnvFile(slug: string): Promise<Record<string, string> | null> {
  const supabase = createServerSupabase();
  const path = `${slug}/.env.example`;
  const { data: blob } = await supabase.storage.from(BUCKET).download(path);
  if (!blob) return null;
  const text = await blob.text();

  const envVars: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    // Strip quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) envVars[key] = value;
  }
  return envVars;
}

async function vercelFetch(
  path: string,
  apiKey: string,
  init: RequestInit & { teamId?: string } = {}
): Promise<Response> {
  const teamId = init.teamId ?? process.env.VERCEL_TEAM_ID;
  const url = new URL(`${VERCEL_BASE}${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);

  return fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export async function deployToVercel(deployment: DeploymentRow): Promise<VercelDeployResult> {
  const supabase = createServerSupabase();
  const apiKey = process.env.VERCEL_TOKEN;

  if (!apiKey) {
    await appendDeployLog(supabase, deployment.id, {
      target: "vercel",
      action: "deploy",
      status: "skipped",
      detail: "VERCEL_TOKEN no configurada en env. Saltando deploy de Vercel.",
    });
    return { ok: false, skipped_reason: "VERCEL_TOKEN missing" };
  }

  // Vercel project name: lowercase, alphanum + hyphens, max 100 chars
  const projectName = `pacame-${deployment.slug}`.slice(0, 100);

  // 1. Crear project (si ya existe, devuelve 409 → recuperamos el existente)
  await appendDeployLog(supabase, deployment.id, {
    target: "vercel",
    action: "create-project",
    status: "in_progress",
    detail: { project_name: projectName },
  });

  let projectId: string | undefined;
  let createdNew = false;

  try {
    const createResp = await vercelFetch("/v9/projects", apiKey, {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        framework: "nextjs",
      }),
    });

    if (createResp.ok) {
      const created = (await createResp.json()) as { id?: string };
      projectId = created.id;
      createdNew = true;
    } else if (createResp.status === 409) {
      // Project ya existe → fetch
      const getResp = await vercelFetch(`/v9/projects/${projectName}`, apiKey);
      if (getResp.ok) {
        const existing = (await getResp.json()) as { id?: string };
        projectId = existing.id;
      } else {
        const text = await getResp.text();
        await appendDeployLog(supabase, deployment.id, {
          target: "vercel",
          action: "fetch-existing-project",
          status: "error",
          detail: `${getResp.status}: ${text.slice(0, 300)}`,
        });
        return { ok: false, error: `vercel get-existing ${getResp.status}` };
      }
    } else {
      const text = await createResp.text();
      await appendDeployLog(supabase, deployment.id, {
        target: "vercel",
        action: "create-project",
        status: "error",
        detail: `${createResp.status}: ${text.slice(0, 300)}`,
      });
      return { ok: false, error: `vercel create ${createResp.status}: ${text.slice(0, 200)}` };
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await appendDeployLog(supabase, deployment.id, {
      target: "vercel",
      action: "create-project",
      status: "error",
      detail: `network: ${detail}`,
    });
    return { ok: false, error: `network: ${detail}` };
  }

  if (!projectId) {
    return { ok: false, error: "no project id returned" };
  }

  await appendDeployLog(supabase, deployment.id, {
    target: "vercel",
    action: "create-project",
    status: "ok",
    detail: { project_id: projectId, created_new: createdNew, project_name: projectName },
  });

  // 2. Subir env vars al project
  const envVars = await fetchEnvFile(deployment.slug);
  let envVarsCount = 0;

  if (envVars && Object.keys(envVars).length > 0) {
    await appendDeployLog(supabase, deployment.id, {
      target: "vercel",
      action: "upload-env-vars",
      status: "in_progress",
      detail: { count: Object.keys(envVars).length },
    });

    for (const [key, value] of Object.entries(envVars)) {
      try {
        const envResp = await vercelFetch(`/v10/projects/${projectId}/env`, apiKey, {
          method: "POST",
          body: JSON.stringify({
            key,
            value,
            type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
            target: ["production", "preview", "development"],
          }),
        });
        if (envResp.ok || envResp.status === 409) {
          envVarsCount++;
        }
      } catch {
        // continue with next env var
      }
    }
  }

  // 3. Persistir
  const projectUrl = `https://vercel.com/dashboard/${projectName}`;
  await supabase
    .from("client_deployments")
    .update({
      vercel_project_id: projectId,
      vercel_url: projectUrl,
      vercel_state: "PROJECT_CREATED",
      vercel_deployed_at: new Date().toISOString(),
    })
    .eq("id", deployment.id);

  await appendDeployLog(supabase, deployment.id, {
    target: "vercel",
    action: "deploy",
    status: "ok",
    detail: {
      project_id: projectId,
      project_name: projectName,
      env_vars_uploaded: envVarsCount,
      next_step: "Pablo: conecta el repo Git desde el dashboard para auto-deploy",
    },
  });

  return {
    ok: true,
    project_id: projectId,
    project_name: projectName,
    project_url: projectUrl,
    env_vars_count: envVarsCount,
  };
}

/**
 * n8n deployer — importa los workflows JSON del cliente al servidor n8n.
 *
 * Lee `n8n/workflows/*.json` del bucket Supabase Storage y los POSTea al
 * API de n8n self-hosted en n8n.pacame.es.
 *
 * Required env: N8N_API_KEY (X-N8N-API-KEY header)
 *               N8N_BASE_URL (default: https://n8n.pacame.es)
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { appendDeployLog } from "./log";

const BUCKET = "client-deployments";
const DEFAULT_N8N_BASE = "https://n8n.pacame.es";

export interface N8nDeployResult {
  ok: boolean;
  workflow_ids?: string[];
  workflow_count?: number;
  error?: string;
  skipped_reason?: string;
  partial_errors?: string[];
}

export interface DeploymentRow {
  id: string;
  slug: string;
  business_name: string;
}

interface WorkflowFile {
  name: string;
  json: Record<string, unknown>;
}

async function listWorkflowFiles(slug: string): Promise<WorkflowFile[]> {
  const supabase = createServerSupabase();
  const prefix = `${slug}/n8n/workflows/`;

  const { data: list, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix.replace(/\/$/, ""), { limit: 50 });

  if (error || !list) return [];

  const files: WorkflowFile[] = [];
  for (const item of list) {
    if (!item.name.endsWith(".json")) continue;
    const path = `${prefix}${item.name}`;
    const { data: blob } = await supabase.storage.from(BUCKET).download(path);
    if (!blob) continue;
    const text = await blob.text();
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      files.push({ name: item.name, json });
    } catch {
      // Skip invalid JSON
    }
  }

  return files;
}

export async function deployToN8n(deployment: DeploymentRow): Promise<N8nDeployResult> {
  const supabase = createServerSupabase();
  const apiKey = process.env.N8N_API_KEY;
  const baseUrl = process.env.N8N_BASE_URL || DEFAULT_N8N_BASE;

  if (!apiKey) {
    await appendDeployLog(supabase, deployment.id, {
      target: "n8n",
      action: "deploy",
      status: "skipped",
      detail: "N8N_API_KEY no configurada en env. Saltando deploy de n8n.",
    });
    return { ok: false, skipped_reason: "N8N_API_KEY missing" };
  }

  await appendDeployLog(supabase, deployment.id, {
    target: "n8n",
    action: "list-workflows",
    status: "in_progress",
  });

  const files = await listWorkflowFiles(deployment.slug);
  if (files.length === 0) {
    await appendDeployLog(supabase, deployment.id, {
      target: "n8n",
      action: "list-workflows",
      status: "error",
      detail: `No workflows found in ${deployment.slug}/n8n/workflows/`,
    });
    return { ok: false, error: "no workflow files found in storage" };
  }

  const workflowIds: string[] = [];
  const partialErrors: string[] = [];

  for (const file of files) {
    await appendDeployLog(supabase, deployment.id, {
      target: "n8n",
      action: `import-workflow:${file.name}`,
      status: "in_progress",
    });

    try {
      const response = await fetch(`${baseUrl}/api/v1/workflows`, {
        method: "POST",
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(file.json),
      });

      if (!response.ok) {
        const text = await response.text();
        partialErrors.push(`${file.name}: ${response.status} ${text.slice(0, 200)}`);
        await appendDeployLog(supabase, deployment.id, {
          target: "n8n",
          action: `import-workflow:${file.name}`,
          status: "error",
          detail: `${response.status}: ${text.slice(0, 300)}`,
        });
        continue;
      }

      const created = (await response.json()) as { id?: string; name?: string };
      if (created.id) {
        workflowIds.push(String(created.id));
        await appendDeployLog(supabase, deployment.id, {
          target: "n8n",
          action: `import-workflow:${file.name}`,
          status: "ok",
          detail: { workflow_id: created.id, name: created.name },
        });
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      partialErrors.push(`${file.name}: ${detail}`);
      await appendDeployLog(supabase, deployment.id, {
        target: "n8n",
        action: `import-workflow:${file.name}`,
        status: "error",
        detail: `network: ${detail}`,
      });
    }
  }

  if (workflowIds.length > 0) {
    await supabase
      .from("client_deployments")
      .update({
        n8n_workflow_ids: workflowIds,
        n8n_deployed_at: new Date().toISOString(),
      })
      .eq("id", deployment.id);
  }

  return {
    ok: workflowIds.length > 0 && partialErrors.length === 0,
    workflow_ids: workflowIds,
    workflow_count: workflowIds.length,
    partial_errors: partialErrors.length > 0 ? partialErrors : undefined,
  };
}

/**
 * Vercel git connector — conecta un repo Git a un project Vercel existente.
 *
 * Una vez conectado, los pushes al branch configurado disparan deploys
 * automáticos. Es la pieza que cierra el flujo "factoría → producción real".
 *
 * Required env: VERCEL_TOKEN
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { appendDeployLog } from "./log";

const VERCEL_BASE = "https://api.vercel.com";

export interface VercelGitInput {
  deployment_id: string;
  github_repo: string; // "owner/repo"
  github_branch?: string; // default: main
  trigger_deploy?: boolean; // default: false
}

export interface VercelGitResult {
  ok: boolean;
  project_id?: string;
  github_repo?: string;
  deployment_url?: string;
  deployment_id_vercel?: string;
  error?: string;
}

async function vercelFetch(
  path: string,
  apiKey: string,
  init: RequestInit & { method?: string } = {}
): Promise<Response> {
  const teamId = process.env.VERCEL_TEAM_ID;
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

export async function connectVercelToGit(input: VercelGitInput): Promise<VercelGitResult> {
  const apiKey = process.env.VERCEL_TOKEN;
  if (!apiKey) {
    return { ok: false, error: "VERCEL_TOKEN missing" };
  }

  const supabase = createServerSupabase();
  const { data: deployment } = await supabase
    .from("client_deployments")
    .select("vercel_project_id, slug")
    .eq("id", input.deployment_id)
    .single();

  const projectId = deployment?.vercel_project_id as string | undefined;
  if (!projectId) {
    return { ok: false, error: "No vercel_project_id for this deployment. Deploy to Vercel first." };
  }

  await appendDeployLog(supabase, input.deployment_id, {
    target: "vercel",
    action: "connect-git",
    status: "in_progress",
    detail: { repo: input.github_repo, branch: input.github_branch ?? "main" },
  });

  // PATCH project para asociar gitRepository
  try {
    const patchResp = await vercelFetch(`/v9/projects/${projectId}`, apiKey, {
      method: "PATCH",
      body: JSON.stringify({
        gitRepository: {
          type: "github",
          repo: input.github_repo,
        },
      }),
    });

    if (!patchResp.ok) {
      const text = await patchResp.text();
      await appendDeployLog(supabase, input.deployment_id, {
        target: "vercel",
        action: "connect-git",
        status: "error",
        detail: `${patchResp.status}: ${text.slice(0, 300)}`,
      });
      return { ok: false, error: `vercel patch ${patchResp.status}: ${text.slice(0, 200)}` };
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `network: ${detail}` };
  }

  // Persistir
  await supabase
    .from("client_deployments")
    .update({
      vercel_git_repo: input.github_repo,
      vercel_git_connected_at: new Date().toISOString(),
    })
    .eq("id", input.deployment_id);

  await appendDeployLog(supabase, input.deployment_id, {
    target: "vercel",
    action: "connect-git",
    status: "ok",
    detail: { repo: input.github_repo },
  });

  // Opcional: trigger deploy inmediato
  let deploymentInfo: { url?: string; id?: string } = {};
  if (input.trigger_deploy) {
    try {
      const branch = input.github_branch ?? "main";
      const deployResp = await vercelFetch(`/v13/deployments`, apiKey, {
        method: "POST",
        body: JSON.stringify({
          name: `pacame-${deployment?.slug}`,
          gitSource: {
            type: "github",
            repo: input.github_repo,
            ref: branch,
          },
          target: "production",
        }),
      });
      if (deployResp.ok) {
        const d = (await deployResp.json()) as { id?: string; url?: string };
        deploymentInfo = { id: d.id, url: d.url ? `https://${d.url}` : undefined };
        await appendDeployLog(supabase, input.deployment_id, {
          target: "vercel",
          action: "trigger-deployment",
          status: "ok",
          detail: deploymentInfo,
        });
      } else {
        const text = await deployResp.text();
        await appendDeployLog(supabase, input.deployment_id, {
          target: "vercel",
          action: "trigger-deployment",
          status: "error",
          detail: `${deployResp.status}: ${text.slice(0, 300)}`,
        });
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await appendDeployLog(supabase, input.deployment_id, {
        target: "vercel",
        action: "trigger-deployment",
        status: "error",
        detail: `network: ${detail}`,
      });
    }
  }

  return {
    ok: true,
    project_id: projectId,
    github_repo: input.github_repo,
    deployment_url: deploymentInfo.url,
    deployment_id_vercel: deploymentInfo.id,
  };
}

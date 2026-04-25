/**
 * POST /api/factoria/deploy
 *
 * FASE F — Orquestador del deploy automatizado.
 * Despliega un cliente materializado a uno o varios destinos:
 *   - Vapi (recepcionista IA)
 *   - n8n (workflows)
 *   - Vercel (proyecto preparado para git)
 *
 * Request body:
 *   {
 *     deployment_id: uuid,
 *     targets?: ['vapi'|'n8n'|'vercel']    // default: ['all'] = los 3
 *   }
 *
 * Cada target se ejecuta en paralelo. Si una API key falta, ese destino
 * se reporta como `skipped` con el nombre de la env var requerida.
 *
 * Response:
 *   { ok, deployment_id, results: {vercel, vapi, n8n}, deploy_state, log }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { deployToVapi } from "@/lib/factoria/deploy/vapi";
import { deployToN8n } from "@/lib/factoria/deploy/n8n";
import { deployToVercel } from "@/lib/factoria/deploy/vercel";
import { recomputeDeployState } from "@/lib/factoria/deploy/log";

export const runtime = "nodejs";
export const maxDuration = 90;

type Target = "vapi" | "n8n" | "vercel";
const ALL_TARGETS: Target[] = ["vapi", "n8n", "vercel"];

interface DeployRequest {
  deployment_id: string;
  targets?: Target[] | "all";
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  let body: DeployRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { deployment_id } = body;
  if (!deployment_id) {
    return NextResponse.json({ error: "deployment_id required" }, { status: 400 });
  }

  const targets: Target[] =
    !body.targets || body.targets === "all"
      ? ALL_TARGETS
      : body.targets.filter((t): t is Target => ALL_TARGETS.includes(t as Target));

  if (targets.length === 0) {
    return NextResponse.json({ error: "no valid targets specified" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: deployment, error: fetchError } = await supabase
    .from("client_deployments")
    .select("id, slug, business_name, materialized_at")
    .eq("id", deployment_id)
    .single();

  if (fetchError || !deployment) {
    return NextResponse.json({ error: "deployment not found" }, { status: 404 });
  }

  if (!deployment.materialized_at || !deployment.slug) {
    return NextResponse.json(
      { error: "deployment not materialized. Call /api/factoria/materialize first." },
      { status: 400 }
    );
  }

  const row = {
    id: deployment.id as string,
    slug: deployment.slug as string,
    business_name: deployment.business_name as string,
  };

  // Ejecutar deploys en paralelo
  const tasks = targets.map((target) => {
    if (target === "vapi") return deployToVapi(row).then((r) => ({ target, result: r }));
    if (target === "n8n") return deployToN8n(row).then((r) => ({ target, result: r }));
    return deployToVercel(row).then((r) => ({ target, result: r }));
  });

  const results = await Promise.all(tasks);
  const aggregated: Record<string, unknown> = {};
  for (const { target, result } of results) {
    aggregated[target] = result;
  }

  const finalState = await recomputeDeployState(supabase, deployment.id);

  const okCount = results.filter((r) => (r.result as { ok: boolean }).ok).length;
  const skippedCount = results.filter((r) => "skipped_reason" in (r.result as object)).length;

  return NextResponse.json({
    ok: okCount > 0,
    deployment_id,
    business_name: row.business_name,
    slug: row.slug,
    targets,
    results: aggregated,
    summary: {
      ok: okCount,
      skipped: skippedCount,
      failed: targets.length - okCount - skippedCount,
    },
    deploy_state: finalState,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const deploymentId = url.searchParams.get("deployment_id");
  if (!deploymentId) {
    return NextResponse.json({ error: "deployment_id query param required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("client_deployments")
    .select(
      "id, slug, business_name, deploy_state, deploy_log, vercel_url, vercel_project_id, vercel_deployed_at, vercel_git_repo, vercel_git_connected_at, vapi_assistant_id, vapi_deployed_at, n8n_workflow_ids, n8n_deployed_at, n8n_workflows_active, n8n_activated_at, n8n_credentials_ids"
    )
    .eq("id", deploymentId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "deployment not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

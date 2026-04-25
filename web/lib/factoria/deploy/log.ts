/**
 * Append-only log de eventos de deploy a client_deployments.deploy_log.
 * Permite trackear cada paso (qué destino, qué acción, OK/error, detalle)
 * para auditoría posterior y debugging.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type DeployTarget = "vercel" | "vapi" | "n8n" | "orchestrator";
export type DeployStatus = "ok" | "error" | "skipped" | "in_progress";

export interface DeployLogEntry {
  ts: string;
  target: DeployTarget;
  action: string;
  status: DeployStatus;
  detail?: string | Record<string, unknown>;
}

export async function appendDeployLog(
  supabase: SupabaseClient,
  deploymentId: string,
  entry: Omit<DeployLogEntry, "ts">
): Promise<void> {
  const fullEntry: DeployLogEntry = { ts: new Date().toISOString(), ...entry };

  // Append atómico vía función SQL — los 3 deploys corren en paralelo y un
  // read-modify-write se pisaba entries entre sí.
  const { error } = await supabase.rpc("factoria_append_deploy_log", {
    p_deployment_id: deploymentId,
    p_entry: fullEntry,
  });

  if (error) {
    // Fallback: read-modify-write (no atómico pero mejor que perder el entry)
    const { data: row } = await supabase
      .from("client_deployments")
      .select("deploy_log")
      .eq("id", deploymentId)
      .single();
    const currentLog: DeployLogEntry[] = Array.isArray(row?.deploy_log) ? (row.deploy_log as DeployLogEntry[]) : [];
    await supabase
      .from("client_deployments")
      .update({ deploy_log: [...currentLog, fullEntry] })
      .eq("id", deploymentId);
  }
}

/**
 * Recalcula deploy_state agregando el estado de cada destino.
 * shipped si los 3 desplegados, partial si 1-2, error si hay error crítico.
 */
export async function recomputeDeployState(
  supabase: SupabaseClient,
  deploymentId: string
): Promise<string> {
  const { data: row } = await supabase
    .from("client_deployments")
    .select("vercel_deployed_at, vapi_deployed_at, n8n_deployed_at, deploy_log")
    .eq("id", deploymentId)
    .single();

  if (!row) return "not_started";

  const vercelOk = !!row.vercel_deployed_at;
  const vapiOk = !!row.vapi_deployed_at;
  const n8nOk = !!row.n8n_deployed_at;
  const okCount = [vercelOk, vapiOk, n8nOk].filter(Boolean).length;

  const log = (row.deploy_log ?? []) as DeployLogEntry[];
  const hasError = log.some((e) => e.status === "error");

  let state: string;
  if (okCount === 3) state = "shipped";
  else if (okCount > 0) state = "partial";
  else if (hasError) state = "error";
  else state = "not_started";

  await supabase
    .from("client_deployments")
    .update({ deploy_state: state })
    .eq("id", deploymentId);

  return state;
}

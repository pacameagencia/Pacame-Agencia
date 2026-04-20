// Agent Activity Logger — logs actions to Supabase for the Oficina PACAME
// Used server-side by API routes to automatically track what each agent does

import { createClient } from "@supabase/supabase-js";
import { getLogger } from "@/lib/observability/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

type ActivityType = "task_started" | "task_completed" | "insight" | "alert" | "update" | "delivery";

interface LogActivityParams {
  agentId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export async function logAgentActivity({ agentId, type, title, description, metadata }: LogActivityParams) {
  try {
    await supabase.from("agent_activities").insert({
      agent_id: agentId.toLowerCase(),
      type,
      title,
      description: description || "",
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    // Update agent state
    const statusMap: Partial<Record<ActivityType, string>> = {
      task_started: "working",
      task_completed: "idle",
      delivery: "idle",
    };

    const newStatus = statusMap[type];
    if (newStatus) {
      await supabase.from("agent_states").upsert({
        agent_id: agentId.toLowerCase(),
        status: newStatus,
        current_task: type === "task_started" ? title : null,
        last_activity: new Date().toISOString(),
      }, { onConflict: "agent_id" });
    } else {
      await supabase.from("agent_states").upsert({
        agent_id: agentId.toLowerCase(),
        last_activity: new Date().toISOString(),
      }, { onConflict: "agent_id" });
    }
  } catch (err) {
    // Non-blocking para el caller, pero SIEMPRE logeamos el error.
    getLogger({ agentId, fn: "logAgentActivity" }).warn(
      { err: err instanceof Error ? err : new Error(String(err)) },
      "agent_logger.insert_failed",
    );
  }
}

export async function updateAgentStatus(agentId: string, status: string, currentTask?: string | null) {
  try {
    await supabase.from("agent_states").upsert({
      agent_id: agentId.toLowerCase(),
      status,
      current_task: currentTask ?? null,
      last_activity: new Date().toISOString(),
    }, { onConflict: "agent_id" });
  } catch (err) {
    getLogger({ agentId, fn: "updateAgentStatus" }).warn(
      { err: err instanceof Error ? err : new Error(String(err)) },
      "agent_logger.status_upsert_failed",
    );
  }
}

export async function incrementAgentTasks(agentId: string) {
  try {
    // Get current counts
    const { data } = await supabase
      .from("agent_states")
      .select("tasks_today, tasks_completed")
      .eq("agent_id", agentId.toLowerCase())
      .single();

    if (data) {
      await supabase.from("agent_states").update({
        tasks_today: (data.tasks_today || 0) + 1,
        tasks_completed: (data.tasks_completed || 0) + 1,
      }).eq("agent_id", agentId.toLowerCase());
    }
  } catch (err) {
    getLogger({ agentId, fn: "incrementAgentTasks" }).warn(
      { err: err instanceof Error ? err : new Error(String(err)) },
      "agent_logger.increment_failed",
    );
  }
}

// =============================================
// Agent Discovery System — Autonomous learnings
// Escribe en la tabla nativa agent_discoveries (red neuronal).
// =============================================

type DiscoveryType =
  | "trend" | "service_idea" | "technique" | "competitor_insight"
  | "optimization" | "market_signal" | "content_idea" | "pattern" | "anomaly";

interface LogDiscoveryParams {
  agentId: string;
  type: DiscoveryType;
  title: string;
  description: string;
  evidence?: string;
  impact?: "low" | "medium" | "high" | "critical";
  confidence?: number;
  actionable?: boolean;
  suggestedAction?: string;
  thoughtChainId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAgentDiscovery({
  agentId,
  type,
  title,
  description,
  evidence,
  impact = "medium",
  confidence = 0.7,
  actionable = true,
  suggestedAction,
  thoughtChainId,
  metadata,
}: LogDiscoveryParams) {
  try {
    await supabase.from("agent_discoveries").insert({
      agent_id: agentId.toLowerCase(),
      type,
      title,
      description,
      evidence: evidence ?? null,
      impact,
      confidence,
      actionable,
      suggested_action: suggestedAction ?? null,
      thought_chain_id: thoughtChainId ?? null,
      metadata: metadata ?? {},
    });

    // Tambien registramos en activities para el feed
    await supabase.from("agent_activities").insert({
      agent_id: agentId.toLowerCase(),
      type: "insight",
      title,
      description,
      metadata: { discovery_type: type, impact, confidence },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    getLogger({ agentId, fn: "logAgentDiscovery" }).warn(
      { err: err instanceof Error ? err : new Error(String(err)) },
      "agent_logger.discovery_failed",
    );
  }
}

// =============================================
// Handoff entre agentes — refuerza la sinapsis correspondiente.
// =============================================

type SynapseType =
  | "collaborates_with" | "reports_to" | "delegates_to" | "consults"
  | "reviews"           | "orchestrates" | "learns_from" | "supervises";

export async function logAgentHandoff(
  fromAgent: string,
  toAgent: string,
  reason: string,
  synapseType: SynapseType = "delegates_to",
  success = true
) {
  try {
    // Refuerzo hebbiano via RPC
    await supabase.rpc("fire_synapse", {
      p_from: fromAgent.toLowerCase(),
      p_to: toAgent.toLowerCase(),
      p_type: synapseType,
      p_success: success,
    });

    // Actividad visible en el feed
    await supabase.from("agent_activities").insert({
      agent_id: fromAgent.toLowerCase(),
      type: "update",
      title: `Handoff a ${toAgent}`,
      description: reason,
      metadata: { handoff: true, target: toAgent.toLowerCase(), synapse_type: synapseType, success },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    getLogger({ fromAgent, toAgent, fn: "logAgentHandoff" }).warn(
      { err: err instanceof Error ? err : new Error(String(err)) },
      "agent_logger.handoff_failed",
    );
  }
}

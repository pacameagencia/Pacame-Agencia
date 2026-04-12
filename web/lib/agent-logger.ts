// Agent Activity Logger — logs actions to Supabase for the Oficina PACAME
// Used server-side by API routes to automatically track what each agent does

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  } catch {
    // Non-blocking — don't fail the main operation if logging fails
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
  } catch {
    // Non-blocking
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
  } catch {
    // Non-blocking
  }
}

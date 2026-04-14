import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

const supabase = createServerSupabase();

/**
 * GET — List discoveries (stored as agent_activities with type "discovery")
 * Query params: discovery_status, discovery_type, agent_id, limit
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
  const agentId = searchParams.get("agent_id");

  let query = supabase
    .from("agent_activities")
    .select("*")
    .eq("type", "insight").eq("metadata->>is_discovery", "true")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agentId) query = query.eq("agent_id", agentId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const discoveries = data || [];
  const newCount = discoveries.filter(d => {
    const meta = d.metadata as Record<string, unknown> | null;
    return !meta?.discovery_status || meta.discovery_status === "new";
  }).length;

  const implementedCount = discoveries.filter(d => {
    const meta = d.metadata as Record<string, unknown> | null;
    return meta?.discovery_status === "implemented";
  }).length;

  return NextResponse.json({
    discoveries,
    stats: { new: newCount, implemented: implementedCount, total: discoveries.length },
  });
}

/**
 * POST — Update discovery status
 * Body: { action: "update_status", id, status }
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  if (action === "update_status") {
    const { id, status } = body;
    const validStatuses = ["new", "reviewed", "implementing", "implemented", "dismissed"];
    if (!id || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "ID y status valido requeridos" }, { status: 400 });
    }

    // Get current metadata and update discovery_status within it
    const { data: current } = await supabase
      .from("agent_activities")
      .select("metadata")
      .eq("id", id)
      .single();

    const currentMeta = (current?.metadata as Record<string, unknown>) || {};

    const { error } = await supabase
      .from("agent_activities")
      .update({
        metadata: {
          ...currentMeta,
          discovery_status: status,
          reviewed_at: status !== "new" ? new Date().toISOString() : null,
        },
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Accion no reconocida" }, { status: 400 });
}

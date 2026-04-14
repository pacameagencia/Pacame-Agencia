import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

const supabase = createServerSupabase();

/**
 * GET — List all discoveries with optional filters
 * Query params: status, type, agent_id, limit
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const agentId = searchParams.get("agent_id");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  let query = supabase
    .from("agent_discoveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (agentId) query = query.eq("agent_id", agentId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats
  const { count: totalNew } = await supabase
    .from("agent_discoveries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const { count: totalImplemented } = await supabase
    .from("agent_discoveries")
    .select("id", { count: "exact", head: true })
    .eq("status", "implemented");

  return NextResponse.json({
    discoveries: data || [],
    stats: {
      new: totalNew || 0,
      implemented: totalImplemented || 0,
      total: (data || []).length,
    },
  });
}

/**
 * POST — Update discovery status or create manual discovery
 * Body: { action: "update_status", id, status } or { action: "create", ...discovery }
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

    const { error } = await supabase
      .from("agent_discoveries")
      .update({
        status,
        reviewed_at: status !== "new" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Accion no reconocida" }, { status: 400 });
}

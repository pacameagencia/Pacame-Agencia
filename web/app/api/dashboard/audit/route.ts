import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole, hasPermission } from "@/lib/security/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/audit
 *   ?actor_id=pablo
 *   &action=auth.login  (substring match via ilike)
 *   &resource_type=order
 *   &from=2026-01-01 &to=2026-04-17
 *   &limit=100 (max 500)
 *
 * RBAC: admin + permission audit_log.read.
 */
export async function GET(request: NextRequest) {
  const sessionOrResp = await requireRole(request, ["admin"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  if (!(await hasPermission(sessionOrResp, "audit_log.read"))) {
    return NextResponse.json(
      { error: "Forbidden", permission_required: "audit_log.read" },
      { status: 403 }
    );
  }

  const url = request.nextUrl;
  const actorId = url.searchParams.get("actor_id");
  const action = url.searchParams.get("action");
  const resourceType = url.searchParams.get("resource_type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limitParam = parseInt(url.searchParams.get("limit") || "100", 10);
  const limit = Math.min(500, Math.max(1, isNaN(limitParam) ? 100 : limitParam));

  const supabase = createServerSupabase();
  let query = supabase
    .from("audit_log")
    .select(
      "id, actor_type, actor_id, action, resource_type, resource_id, metadata, ip, user_agent, request_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (actorId) query = query.eq("actor_id", actorId);
  if (action) query = query.ilike("action", `%${action}%`);
  if (resourceType) query = query.eq("resource_type", resourceType);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data || [] });
}

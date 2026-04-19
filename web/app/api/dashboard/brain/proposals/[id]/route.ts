/**
 * PATCH /api/dashboard/brain/proposals/[id]
 *
 * Body: { action: 'approve' | 'reject', reason?: string }
 *
 * approve -> status='approved', approved_by='pablo', approved_at=now()
 * reject  -> status='rejected', rejected_reason=reason
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

interface Body {
  action: "approve" | "reject";
  reason?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const nowIso = new Date().toISOString();

  const patch: Record<string, unknown> = {
    updated_at: nowIso,
  };
  if (body.action === "approve") {
    patch.status = "approved";
    patch.approved_by = "pablo";
    patch.approved_at = nowIso;
  } else {
    patch.status = "rejected";
    patch.rejected_reason = body.reason || null;
    patch.rejected_at = nowIso;
  }

  const { data, error } = await supabase
    .from("agent_proposals")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await auditLog({
    actor: { type: "admin", id: "pablo" },
    action: `brain.proposal.${body.action}`,
    resource: { type: "agent_proposal", id },
    metadata: body.action === "reject" ? { reason: body.reason } : {},
    request,
  });

  return NextResponse.json({ ok: true, proposal: data });
}

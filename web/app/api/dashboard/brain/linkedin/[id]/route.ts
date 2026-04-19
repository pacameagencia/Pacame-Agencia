/**
 * PATCH /api/dashboard/brain/linkedin/[id]
 *
 * Body: { status: 'sent' | 'skipped' | 'replied', response?: string }
 *
 * - sent    -> sent_at=now(), sent_by='pablo_manual'
 * - skipped -> solo actualiza status
 * - replied -> replied_at=now(), guarda response
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

type LinkedInStatus = "sent" | "skipped" | "replied";

interface Body {
  status: LinkedInStatus;
  response?: string;
}

const ALLOWED: LinkedInStatus[] = ["sent", "skipped", "replied"];

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

  if (!ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const nowIso = new Date().toISOString();

  const patch: Record<string, unknown> = {
    status: body.status,
    updated_at: nowIso,
  };
  if (body.status === "sent") {
    patch.sent_at = nowIso;
    patch.sent_by = "pablo_manual";
  } else if (body.status === "replied") {
    patch.replied_at = nowIso;
    if (body.response) patch.response = body.response;
  }

  const { data, error } = await supabase
    .from("linkedin_queue")
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
    action: `brain.linkedin.${body.status}`,
    resource: { type: "linkedin_queue", id },
    metadata: body.response ? { response_preview: body.response.slice(0, 200) } : {},
    request,
  });

  return NextResponse.json({ ok: true, item: data });
}

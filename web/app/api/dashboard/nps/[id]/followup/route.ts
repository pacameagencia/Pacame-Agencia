import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/nps/[id]/followup
 * Pablo marca un detractor como ya contactado — desaparece de la lista de
 * detractores unaddressed en /dashboard/growth.
 *
 * Auth: internal (verifyInternalAuth).
 * Audit: registra la accion para compliance + trazabilidad.
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const log = getLogger();

  const { data, error } = await supabase
    .from("nps_surveys")
    .update({ followup_sent: true })
    .eq("id", id)
    .select("id, client_id, score, category")
    .maybeSingle();

  if (error || !data) {
    log.error({ err: error, id }, "[nps-followup] update fallo");
    return NextResponse.json(
      { error: error?.message || "not_found" },
      { status: error ? 500 : 404 }
    );
  }

  await auditLog({
    request,
    actor: { type: "admin" },
    action: "nps.followup_marked",
    resource: { type: "nps_survey", id },
    metadata: {
      client_id: data.client_id,
      score: data.score,
      category: data.category,
    },
  });

  return NextResponse.json({ ok: true, id: data.id });
}

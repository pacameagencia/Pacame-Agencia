import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";
import { generateExport } from "@/lib/gdpr/export";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/gdpr/export — solicita un nuevo export.
 * GET  /api/gdpr/export — lista los exports del cliente autenticado.
 */

export async function POST(request: NextRequest) {
  const client = await getAuthedClient(request);
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  // Evitar spam: si ya hay un export pending/processing, devolver ese
  const { data: pending } = await supabase
    .from("gdpr_export_requests")
    .select("id, status, requested_at")
    .eq("client_id", client.id)
    .in("status", ["pending", "processing"])
    .order("requested_at", { ascending: false })
    .maybeSingle();

  if (pending) {
    return NextResponse.json({
      status: pending.status,
      request_id: pending.id,
      message: "Ya tienes un export en curso",
    });
  }

  const { data: created, error } = await supabase
    .from("gdpr_export_requests")
    .insert({ client_id: client.id, status: "processing" })
    .select("id")
    .single();

  if (error || !created) {
    getLogger().error({ err: error, clientId: client.id }, "gdpr export request insert failed");
    return NextResponse.json({ error: "No se pudo crear la peticion" }, { status: 500 });
  }

  await auditLog({
    actor: { type: "client", id: client.id },
    action: "gdpr.export_requested",
    resource: { type: "gdpr_export_requests", id: created.id },
    request,
  });

  // Fire-and-forget — no bloquea la respuesta
  generateExport(client.id, created.id).catch((err) => {
    getLogger().error({ err, requestId: created.id }, "generateExport failed");
  });

  return NextResponse.json({ status: "processing", request_id: created.id });
}

export async function GET(request: NextRequest) {
  const client = await getAuthedClient(request);
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("gdpr_export_requests")
    .select("id, status, file_url, file_size_bytes, requested_at, completed_at, expires_at, error")
    .eq("client_id", client.id)
    .order("requested_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exports: data || [] });
}

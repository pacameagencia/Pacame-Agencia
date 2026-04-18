import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";

/**
 * POST /api/apps/[instanceId]/setup
 * Guarda la configuracion inicial del app_instance y la activa.
 * Requiere auth de cliente (cookie pacame_client_auth).
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ instanceId: string }> }
) {
  const client = await getAuthedClient(request);
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { instanceId } = await ctx.params;

  try {
    const body = await request.json();
    const config = (body?.config || {}) as Record<string, unknown>;

    const supabase = createServerSupabase();

    // Verify ownership + fetch app slug
    const { data: instance, error: fetchErr } = await supabase
      .from("app_instances")
      .select("id, client_id, app_slug, status")
      .eq("id", instanceId)
      .maybeSingle();

    if (fetchErr || !instance) {
      return NextResponse.json({ error: "Instance no encontrada" }, { status: 404 });
    }
    if (instance.client_id !== client.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Very lightweight validation based on pacame-contact schema
    if (instance.app_slug === "pacame-contact") {
      const required = ["business_name", "sector", "business_description"];
      for (const k of required) {
        if (!config[k] || typeof config[k] !== "string") {
          return NextResponse.json(
            { error: `Falta el campo obligatorio: ${k}` },
            { status: 400 }
          );
        }
      }
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("app_instances")
      .update({
        config,
        status: "active",
        provisioned_at: now,
        started_at: now,
        updated_at: now,
      })
      .eq("id", instanceId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Notify Pablo
    await notifyPablo(
      `App configurada: ${instance.app_slug}`,
      wrapEmailTemplate(
        `${client.email} ha configurado su instance de ${instance.app_slug}.\n\nInstance ID: ${instanceId}`,
        {
          cta: "Ver dashboard",
          ctaUrl: "https://pacameagencia.com/dashboard/clients",
        }
      )
    );

    return NextResponse.json({ ok: true, instance_id: instanceId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

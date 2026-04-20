import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { randomBytes, createHash } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/gdpr/delete — 3 acciones:
 *  - request: cliente autenticado pide deletion. Genera token + envia email confirmacion.
 *  - confirm: endpoint publico con token. Marca confirmed_at en log + clients.
 *  - cancel:  cliente autenticado cancela deletion pendiente (si no purgada).
 *
 * GET — estado de la peticion pendiente del cliente autenticado.
 */

const CONFIRMATION_TTL_HOURS = 48;

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (action === "confirm") {
    return handleConfirm(request, body);
  }

  // request / cancel requieren auth cliente
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "request") return handleRequest(request, client, body);
  if (action === "cancel") return handleCancel(request, client);

  return NextResponse.json({ error: "action invalida (request|confirm|cancel)" }, { status: 400 });
}

async function handleRequest(
  request: NextRequest,
  client: { id: string; email: string; name: string },
  body: { reason?: string } | null
) {
  const supabase = createServerSupabase();

  // Verifica si ya hay solicitud pending
  const { data: existing } = await supabase
    .from("gdpr_deletion_log")
    .select("id, confirmed_at, completed_at")
    .eq("client_id", client.id)
    .is("completed_at", null)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (existing && !existing.completed_at) {
    return NextResponse.json({
      status: existing.confirmed_at ? "confirmed" : "awaiting_confirmation",
      message: "Ya tienes una peticion de deletion activa",
    });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const reason = (body?.reason as string | undefined)?.slice(0, 500) || null;

  const { error: insertErr } = await supabase.from("gdpr_deletion_log").insert({
    client_id: client.id,
    client_email_hash: sha256Hex(client.email),
    requested_at: new Date().toISOString(),
    notes: reason,
    metadata: { token_hash: tokenHash, ttl_hours: CONFIRMATION_TTL_HOURS },
  } as unknown as Record<string, unknown>);

  if (insertErr) {
    getLogger().error({ err: insertErr, clientId: client.id }, "gdpr delete request insert failed");
    return NextResponse.json({ error: "No se pudo registrar la peticion" }, { status: 500 });
  }

  await supabase
    .from("clients")
    .update({
      deletion_requested_at: new Date().toISOString(),
      deletion_reason: reason,
    })
    .eq("id", client.id);

  await auditLog({
    actor: { type: "client", id: client.id },
    action: "gdpr.delete_requested",
    resource: { type: "clients", id: client.id },
    metadata: { reason },
    request,
  });

  // Envia email con link de confirmacion
  const origin = request.nextUrl.origin;
  const confirmUrl = `${origin}/portal/gdpr/confirm-delete?token=${token}`;

  await sendEmail({
    to: client.email,
    subject: "Confirma la eliminacion de tu cuenta PACAME",
    html: wrapEmailTemplate(
      `Hola ${client.name?.split(" ")[0] || ""},\n\n` +
        `Hemos recibido tu peticion de eliminar tu cuenta y todos tus datos.\n\n` +
        `Para confirmar este cambio irreversible, haz clic en el boton. El link es valido ${CONFIRMATION_TTL_HOURS}h.\n\n` +
        `Tras confirmar, esperaremos 30 dias (periodo de reflexion GDPR) antes de purgar los datos. Puedes cancelar en cualquier momento desde tu portal.\n\n` +
        `Si no has pedido esto, ignora este email.`,
      {
        cta: "Confirmar eliminacion",
        ctaUrl: confirmUrl,
        preheader: "Confirma la eliminacion de tu cuenta",
      }
    ),
    tags: [
      { name: "type", value: "gdpr_confirm_delete" },
      { name: "client_id", value: client.id },
    ],
  });

  notifyPablo(
    `GDPR delete solicitado — ${client.email}`,
    `${client.name || client.email} pidio deletion. Motivo: ${reason || "(sin motivo)"}. Periodo reflexion 30d.`
  ).catch(() => {});

  return NextResponse.json({ status: "awaiting_confirmation" });
}

async function handleConfirm(request: NextRequest, body: { token?: string } | null) {
  const token = body?.token;
  if (!token) return NextResponse.json({ error: "token requerido" }, { status: 400 });

  const tokenHash = sha256Hex(token);
  const supabase = createServerSupabase();

  // Busca log con este hash, <48h y no confirmado
  const { data: logs } = await supabase
    .from("gdpr_deletion_log")
    .select("id, client_id, metadata, requested_at, confirmed_at")
    .is("confirmed_at", null)
    .is("completed_at", null)
    .order("requested_at", { ascending: false })
    .limit(50);

  const match = (logs || []).find((l) => {
    const meta = (l.metadata || {}) as Record<string, unknown>;
    if (meta.token_hash !== tokenHash) return false;
    const age = Date.now() - new Date(l.requested_at as string).getTime();
    return age < CONFIRMATION_TTL_HOURS * 60 * 60 * 1000;
  });

  if (!match) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await supabase
    .from("gdpr_deletion_log")
    .update({ confirmed_at: now })
    .eq("id", match.id);

  await supabase
    .from("clients")
    .update({ deletion_confirmed_at: now })
    .eq("id", match.client_id);

  await auditLog({
    actor: { type: "client", id: match.client_id as string },
    action: "gdpr.delete_confirmed",
    resource: { type: "clients", id: match.client_id as string },
    request,
  });

  return NextResponse.json({
    status: "confirmed",
    message: "Tu peticion esta confirmada. Los datos se eliminaran en 30 dias.",
  });
}

async function handleCancel(
  request: NextRequest,
  client: { id: string; email: string }
) {
  const supabase = createServerSupabase();

  await supabase
    .from("clients")
    .update({
      deletion_requested_at: null,
      deletion_confirmed_at: null,
      deletion_reason: null,
    })
    .eq("id", client.id);

  // Marca el log activo como cancelado (via notes)
  await supabase
    .from("gdpr_deletion_log")
    .update({
      completed_at: new Date().toISOString(),
      notes: "Cancelado por el cliente antes de purga",
    })
    .eq("client_id", client.id)
    .is("completed_at", null);

  await auditLog({
    actor: { type: "client", id: client.id },
    action: "gdpr.delete_canceled",
    resource: { type: "clients", id: client.id },
    request,
  });

  return NextResponse.json({ status: "canceled" });
}

export async function GET(request: NextRequest) {
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const { data: current } = await supabase
    .from("clients")
    .select("deletion_requested_at, deletion_confirmed_at, deletion_completed_at, deletion_reason")
    .eq("id", client.id)
    .maybeSingle();

  return NextResponse.json({ status: current || null });
}

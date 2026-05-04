/**
 * GET    /api/clients/[id]/credentials/[credId]   → descifra y devuelve el secret en plano
 * DELETE /api/clients/[id]/credentials/[credId]   → elimina credencial
 *
 * Cada acceso de descifrado deja audit log en client_credentials.last_used_at + tabla
 * agent_activities (si existe). Aislamiento estricto: el credId DEBE pertenecer al
 * client_id de la URL — si no, 404 (sin pistas).
 *
 * Auth: requerido vía verifyInternalAuth (header x-cron-secret o session admin).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { decryptSecret, isCryptoConfigured } from "@/lib/crypto-secrets";

export const runtime = "nodejs";
export const maxDuration = 30;

interface CredRow {
  id: string;
  client_id: string;
  type: string;
  label: string | null;
  ciphertext: string;
  iv: string;
  tag: string;
  metadata: Record<string, unknown> | null;
  status: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; credId: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  if (!isCryptoConfigured()) {
    return NextResponse.json({ error: "WP_SECRET_KEY env var not configured" }, { status: 500 });
  }

  const { id, credId } = await params;
  const supabase = createServerSupabase();

  // Aislamiento estricto: doble filtro por client_id + id
  const { data, error } = (await supabase
    .from("client_credentials")
    .select("id, client_id, type, label, ciphertext, iv, tag, metadata, status")
    .eq("client_id", id)
    .eq("id", credId)
    .maybeSingle()) as { data: CredRow | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "credential not found" }, { status: 404 });
  }

  let plaintext: string;
  try {
    plaintext = decryptSecret({ ciphertext: data.ciphertext, iv: data.iv, tag: data.tag });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Marcar credencial como rota para diagnóstico
    await supabase
      .from("client_credentials")
      .update({ status: "decrypt_error", last_error: msg.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("id", credId);
    return NextResponse.json({ error: "decrypt failed" }, { status: 500 });
  }

  // Audit log: marca acceso
  await supabase
    .from("client_credentials")
    .update({ last_used_at: new Date().toISOString(), status: data.status === "pending" ? "active" : data.status })
    .eq("id", credId);

  return NextResponse.json({
    id: data.id,
    client_id: data.client_id,
    type: data.type,
    label: data.label,
    secret: plaintext,
    metadata: data.metadata || {},
    status: data.status,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; credId: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id, credId } = await params;
  const supabase = createServerSupabase();

  const { error, count } = await supabase
    .from("client_credentials")
    .delete({ count: "exact" })
    .eq("client_id", id)
    .eq("id", credId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "credential not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: credId });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { encryptSecret, isCryptoConfigured } from "@/lib/crypto-secrets";

export const runtime = "nodejs";
export const maxDuration = 30;

const createSchema = z.object({
  type: z.enum(["hostinger_api", "sftp", "ssh", "mysql", "cpanel", "plesk", "generic_api"]),
  label: z.string().max(120).optional(),
  secret: z.string().min(4).max(8000),       // Bearer token, password, o llave privada serializada
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("client_credentials")
    .select("id, client_id, type, label, metadata, status, last_used_at, last_error, created_at, updated_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credentials: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createServerSupabase();

  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  if (!isCryptoConfigured()) {
    return NextResponse.json({ error: "WP_SECRET_KEY env var not configured" }, { status: 500 });
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .single();
  if (clientError || !client) {
    return NextResponse.json({ error: "client not found" }, { status: 404 });
  }

  const enc = encryptSecret(parsed.data.secret);
  const { data, error } = await supabase
    .from("client_credentials")
    .insert({
      client_id: id,
      type: parsed.data.type,
      label: parsed.data.label || null,
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      tag: enc.tag,
      metadata: parsed.data.metadata || {},
      status: "pending",
    })
    .select("id, type, label, metadata, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credential: data }, { status: 201 });
}

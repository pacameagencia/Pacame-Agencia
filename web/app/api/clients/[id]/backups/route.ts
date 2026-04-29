import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/clients/[id]/backups       → lista backups recientes (cualquier source).
 * POST /api/clients/[id]/backups      → registra un backup (manual o triggered).
 *
 * Este endpoint NO ejecuta el backup en sí — solo lo registra. La generación
 * real depende del source:
 *   - 'manual_pablo' → Pablo lo hace en hPanel y registra aquí (status=completed).
 *   - 'updraftplus'  → endpoint /backup/run del plugin MU lo dispara y registra.
 *   - 'hostinger'    → snapshot VPS via API (Pago premium).
 */

const createSchema = z.object({
  website_id: z.uuid().optional(),
  source: z.enum(["updraftplus", "hostinger", "sftp_dump", "manual_pablo"]).default("manual_pablo"),
  scope: z.enum(["full", "wp-content", "db", "files", "config"]).default("full"),
  status: z.enum(["pending", "running", "completed", "failed"]).default("pending"),
  storage_url: z.string().url().optional(),
  size_bytes: z.number().optional(),
  triggered_by: z.string().max(80).optional(),
  notes: z.string().max(1000).optional(),
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
    .from("client_backups")
    .select("*")
    .eq("client_id", id)
    .order("started_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ backups: data ?? [] });
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

  const row: Record<string, unknown> = {
    client_id: id,
    website_id: parsed.data.website_id || null,
    source: parsed.data.source,
    scope: parsed.data.scope,
    status: parsed.data.status,
    storage_url: parsed.data.storage_url || null,
    size_bytes: parsed.data.size_bytes ?? null,
    triggered_by: parsed.data.triggered_by || "pablo",
    notes: parsed.data.notes || null,
    metadata: parsed.data.metadata || {},
  };
  if (parsed.data.status === "completed") {
    row.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("client_backups")
    .insert(row)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ backup: data }, { status: 201 });
}

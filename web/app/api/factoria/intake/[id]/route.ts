/**
 * GET /api/factoria/intake/[id] — endpoint PÚBLICO read-only para que la
 * página /factoria pueda mostrar el BrandBrief al cliente sin auth interno.
 *
 * Solo expone los campos visibles para el cliente (sin metadata interna).
 * El bypass de RLS es server-side via SUPABASE_SERVICE_ROLE_KEY pero el
 * endpoint NO requiere verifyInternalAuth porque el `brief_id` es UUID
 * impredecible (capability-based access).
 */

import { NextRequest, NextResponse } from "next/server";
import { cacheGetById } from "@/lib/factoria/intake-cache";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const row = await cacheGetById(id);
  if (!row) {
    return NextResponse.json({ error: "brief not found or expired" }, { status: 404 });
  }

  // Comprobar caducidad
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "brief expired", expired_at: row.expires_at }, { status: 410 });
  }

  return NextResponse.json({
    ok: true,
    brief_id: row.id,
    brief: row.brief_json,
    expires_at: row.expires_at,
  });
}

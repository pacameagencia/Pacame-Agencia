/**
 * GET /api/neural/factoria-products
 *
 * Lista los discoveries con status='packaged' (productos empaquetados por SAGE
 * en el cron de FASE C). Devuelve el catálogo de candidatos a publicar.
 */

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("agent_discoveries")
    .select("id, agent_id, type, title, description, impact, confidence, created_at, reviewed_at, metadata")
    .eq("status", "packaged")
    .order("reviewed_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products = (data ?? []).map((d) => ({
    discovery_id: d.id,
    discovery_title: d.title,
    discovery_type: d.type,
    discovery_agent: d.agent_id,
    impact: d.impact,
    confidence: d.confidence,
    created_at: d.created_at,
    packaged_at: d.reviewed_at,
    product: (d.metadata as Record<string, unknown> | null)?.packaged_product ?? null,
    provider: (d.metadata as Record<string, unknown> | null)?.packaged_provider ?? null,
  }));

  return NextResponse.json({
    count: products.length,
    products,
    timestamp: new Date().toISOString(),
  });
}

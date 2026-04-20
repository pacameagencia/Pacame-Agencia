import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/games — lista games (admin)
 * POST /api/admin/games — crea game row (sin build aun)
 */

export async function GET(request: NextRequest) {
  const auth = verifyInternalAuth(request);
  if (auth) return auth;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("games_catalog")
    .select(
      "id, slug, title, engine, is_active, is_featured, play_count, created_at, loader_url, data_url, framework_url, wasm_url"
    )
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    getLogger().error({ err: error }, "[admin/games] list fallo");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const games = (data || []).map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    engine: g.engine,
    is_active: g.is_active,
    is_featured: g.is_featured,
    play_count: g.play_count,
    created_at: g.created_at,
    has_build: !!(g.loader_url && g.data_url && g.framework_url && g.wasm_url),
  }));

  return NextResponse.json({ ok: true, games });
}

export async function POST(request: NextRequest) {
  const auth = verifyInternalAuth(request);
  if (auth) return auth;

  let body: {
    slug?: string;
    title?: string;
    description?: string;
    engine?: string;
    aspect_ratio?: string;
    tags?: string[];
    is_featured?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.slug || !body.title) {
    return NextResponse.json({ error: "slug + title requeridos" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("games_catalog")
    .insert({
      slug: body.slug,
      title: body.title,
      description: body.description || null,
      engine: body.engine || "unity",
      aspect_ratio: body.aspect_ratio || "16:9",
      tags: body.tags || [],
      is_featured: !!body.is_featured,
      is_active: false, // start disabled — activa cuando el build suba
    })
    .select("id, slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, game: data });
}

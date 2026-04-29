import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { encryptSecret, isCryptoConfigured } from "@/lib/crypto-secrets";

export const runtime = "nodejs";
export const maxDuration = 30;

const createSchema = z.object({
  platform: z.enum(["wordpress", "shopify", "webflow", "custom"]).default("wordpress"),
  base_url: z.string().url(),
  label: z.string().max(100).optional(),
  wp_user: z.string().min(1).max(120).optional(),
  wp_app_password: z.string().min(8).max(200).optional(),
  wp_api_namespace: z.string().max(40).optional(),
  seo_plugin: z.enum(["yoast", "rankmath", "none"]).optional(),
  woocommerce_enabled: z.boolean().optional(),
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
    .from("client_websites")
    .select("id, client_id, platform, base_url, label, wp_user, wp_api_namespace, seo_plugin, woocommerce_enabled, status, last_sync_at, last_publish_at, last_error, metadata, created_at, updated_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ websites: data ?? [] });
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
  const input = parsed.data;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .single();
  if (clientError || !client) {
    return NextResponse.json({ error: "client not found" }, { status: 404 });
  }

  const row: Record<string, unknown> = {
    client_id: id,
    platform: input.platform,
    base_url: input.base_url.replace(/\/+$/, ""),
    label: input.label || null,
    wp_user: input.wp_user || null,
    wp_api_namespace: input.wp_api_namespace || "wp/v2",
    seo_plugin: input.seo_plugin || "none",
    woocommerce_enabled: input.woocommerce_enabled || false,
    status: "pending",
  };

  if (input.platform === "wordpress" && input.wp_app_password) {
    if (!isCryptoConfigured()) {
      return NextResponse.json({ error: "WP_SECRET_KEY env var not configured. Cannot store credentials securely." }, { status: 500 });
    }
    if (!input.wp_user) {
      return NextResponse.json({ error: "wp_user is required when wp_app_password is provided" }, { status: 400 });
    }
    const enc = encryptSecret(input.wp_app_password);
    row.wp_app_password_ciphertext = enc.ciphertext;
    row.wp_app_password_iv = enc.iv;
    row.wp_app_password_tag = enc.tag;
  }

  const { data, error } = await supabase
    .from("client_websites")
    .insert(row)
    .select("id, platform, base_url, label, wp_user, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ website: data }, { status: 201 });
}

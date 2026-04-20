import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role key.
 * Use this in API routes and server actions — it bypasses RLS.
 * NEVER import this in client components.
 *
 * Lazy singleton + build-time tolerant: never throws at import time so that
 * Next.js page-data collection doesn't fail when env vars are missing.
 */
let cachedClient: SupabaseClient | null = null;

export function createServerSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role key.
 * Use this in API routes and server actions — it bypasses RLS.
 * NEVER import this in client components.
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Fallback to anon key if service role not configured yet
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error("Supabase URL and key must be configured");
    }
    return createClient(url, anonKey);
  }

  return createClient(url, serviceKey);
}

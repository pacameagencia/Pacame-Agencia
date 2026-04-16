import { createClient } from "@supabase/supabase-js";

/**
 * Public Supabase client for browser / client components.
 * Uses placeholder values when env vars are missing so imports never throw
 * during build. Real requests fail at call time if env is not set.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

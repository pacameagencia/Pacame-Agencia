import { NextRequest } from "next/server";
import { createServerSupabase } from "./supabase/server";

const COOKIE_NAME = "pacame_client_auth";

export interface AuthedClient {
  id: string;
  email: string;
  name: string;
}

/**
 * Resolve the authenticated client from the request cookie.
 * Returns null if not authed or session expired.
 */
export async function getAuthedClient(request: NextRequest): Promise<AuthedClient | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, email, name, auth_token_expires")
    .eq("auth_token", token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.auth_token_expires && new Date(data.auth_token_expires) < new Date()) {
    return null;
  }

  return {
    id: data.id as string,
    email: data.email as string,
    name: data.name as string,
  };
}

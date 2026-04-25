import type { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const CLIENT_AUTH_COOKIE = "pacame_client_auth";

export type AuthedUser = { id: string; email: string };

/**
 * Resolves the authenticated PACAME-client user from the request cookie.
 * Apps that use a different auth scheme can replace this single function.
 */
export async function getAuthedUser(request: NextRequest | Request): Promise<AuthedUser | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookieMatch = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${CLIENT_AUTH_COOKIE}=`));
  if (!cookieMatch) return null;

  const token = decodeURIComponent(cookieMatch.split("=").slice(1).join("="));
  if (!token) return null;

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id, email, auth_token_expires")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle<{ id: string; email: string; auth_token_expires: string }>();

  if (!data) return null;
  return { id: data.id, email: data.email };
}

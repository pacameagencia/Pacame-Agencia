import type { NextRequest } from "next/server";
import { getReferralsAdapter, type AuthedUser } from "./adapters";

export type { AuthedUser };

/**
 * Resolves the authenticated user from the request via the active adapter.
 * Default adapter targets PACAME `clients` table; apps inject their own.
 */
export async function getAuthedUser(request: NextRequest | Request): Promise<AuthedUser | null> {
  return getReferralsAdapter().getAuthedUser(request);
}

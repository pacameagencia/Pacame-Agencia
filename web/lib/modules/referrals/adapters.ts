/**
 * Pluggable adapters so the module is reusable in any Next.js + Stripe + Supabase app.
 *
 * Override these by setting them at boot time:
 *   import { setReferralsAdapter } from "@/lib/modules/referrals";
 *   setReferralsAdapter({ getAuthedUser: myAuthLookup });
 *
 * Default adapter resolves the PACAME `clients` table via the `pacame_client_auth`
 * cookie. Apps that use Supabase Auth, NextAuth, Clerk, etc. should swap it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { readAffiliateSessionFromRequest } from "./affiliate-auth";

export type AuthedUser = {
  id: string;
  email: string;
  /** When true, this user authenticated via the standalone affiliate cookie
   * — the `id` is the `aff_affiliates.id`, NOT a clients.id. */
  affiliateOnly?: boolean;
};

export type ReferralsAdapter = {
  /**
   * Returns the authenticated user from the request, or null.
   * Used by /api/referrals/me and /api/referrals/affiliates.
   */
  getAuthedUser: (request: Request) => Promise<AuthedUser | null>;
  /**
   * Supabase client used to read/write all aff_* tables.
   * Must use the service role on the server.
   */
  getSupabase: () => SupabaseClient;
  /**
   * Resolve the user id of a Stripe Checkout/Subscription event so we can
   * link the conversion. Default: lookup `clients` by stripe_customer_id;
   * apps with their own user table replace this.
   */
  resolveUserIdFromStripe: (params: {
    stripeCustomerId: string | null;
    customerEmail: string | null;
    sessionMetadata: Record<string, string>;
  }) => Promise<string | null>;
};

const DEFAULT_ADAPTER: ReferralsAdapter = {
  getAuthedUser: defaultGetAuthedUser,
  getSupabase: () => createServerSupabase(),
  resolveUserIdFromStripe: defaultResolveUserIdFromStripe,
};

let activeAdapter: ReferralsAdapter = DEFAULT_ADAPTER;

export function setReferralsAdapter(overrides: Partial<ReferralsAdapter>): void {
  activeAdapter = { ...activeAdapter, ...overrides };
}

export function getReferralsAdapter(): ReferralsAdapter {
  return activeAdapter;
}

const PACAME_CLIENT_COOKIE = "pacame_client_auth";

async function defaultGetAuthedUser(request: Request): Promise<AuthedUser | null> {
  // 1. Standalone affiliate cookie (signup público)
  const affSession = readAffiliateSessionFromRequest(request);
  if (affSession) {
    return { id: affSession.affiliate_id, email: affSession.email, affiliateOnly: true };
  }

  // 2. PACAME client cookie
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookieMatch = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${PACAME_CLIENT_COOKIE}=`));
  if (!cookieMatch) return null;

  const token = decodeURIComponent(cookieMatch.split("=").slice(1).join("="));
  if (!token) return null;

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id, email")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle<{ id: string; email: string }>();

  return data ? { id: data.id, email: data.email } : null;
}

async function defaultResolveUserIdFromStripe(params: {
  stripeCustomerId: string | null;
  customerEmail: string | null;
  sessionMetadata: Record<string, string>;
}): Promise<string | null> {
  const { stripeCustomerId, customerEmail, sessionMetadata } = params;

  // 1. metadata.client_id beats everything (set by PACAME checkout flow)
  if (sessionMetadata.client_id) return sessionMetadata.client_id;

  const supabase = createServerSupabase();

  // 2. Match by stripe customer id stored in onboarding_data
  if (stripeCustomerId) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("onboarding_data->>stripe_customer_id", stripeCustomerId)
      .maybeSingle<{ id: string }>();
    if (data) return data.id;
  }

  // 3. Fallback: match by email
  if (customerEmail) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("email", customerEmail.trim().toLowerCase())
      .maybeSingle<{ id: string }>();
    if (data) return data.id;
  }

  return null;
}

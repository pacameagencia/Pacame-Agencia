import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  attachReferralToCheckoutSession,
  readRefCookieFromRequest,
} from "@/lib/modules/referrals";
import type { CheckoutSessionInput } from "@/lib/modules/referrals";

/**
 * Standalone wrapper for apps without their own checkout endpoint.
 * Accepts a Stripe Checkout Session params object, attaches the referral
 * cookie if present, and creates the session.
 */
export async function POST(request: NextRequest) {
  let body: CheckoutSessionInput;
  try {
    body = (await request.json()) as CheckoutSessionInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !body.line_items) {
    return NextResponse.json({ error: "missing_line_items" }, { status: 400 });
  }

  const refCookie = readRefCookieFromRequest(request);
  const params = attachReferralToCheckoutSession(body, refCookie);

  try {
    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "stripe_error" },
      { status: 500 },
    );
  }
}

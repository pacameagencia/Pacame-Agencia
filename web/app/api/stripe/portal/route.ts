import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getAuthedClient } from "@/lib/client-auth";

export async function POST(request: NextRequest) {
  // Allow either internal auth OR a logged-in portal client
  const portalClient = await getAuthedClient(request);
  if (!portalClient) {
    const authError = verifyInternalAuth(request);
    if (authError) return authError;
  }

  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const customer_email =
      (body as { customer_email?: string }).customer_email || portalClient?.email;

    if (!customer_email) {
      return NextResponse.json({ error: "Email del cliente requerido" }, { status: 400 });
    }

    // Find customer by email
    const customers = await stripe.customers.list({ email: customer_email, limit: 1 });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado en Stripe" }, { status: 404 });
    }

    const returnUrl = portalClient
      ? `${request.nextUrl.origin}/portal/subscription`
      : `${request.nextUrl.origin}/dashboard/payments`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear portal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

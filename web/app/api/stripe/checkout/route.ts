import { NextRequest, NextResponse } from "next/server";
import { stripe, PACAME_PRODUCTS, type ProductKey } from "@/lib/stripe";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  attachReferralToCheckoutSession,
  readRefCookieFromRequest,
} from "@/lib/modules/referrals";

const supabase = createServerSupabase();

export async function POST(request: NextRequest) {
  // Parse body defensively — malformed JSON should return 400, not 500.
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 });
  }

  // Public checkout from proposal pages or website "Buy Now" buttons.
  // Any other caller must present the dashboard HMAC cookie or CRON_SECRET.
  const isProposalCheckout = !!body.proposal_id;
  const isPublicCheckout = body.source === "public";

  if (!isProposalCheckout && !isPublicCheckout) {
    const authError = verifyInternalAuth(request);
    if (authError) return authError;
  }

  try {
    const {
      product,
      client_name,
      client_email,
      client_id,
      lead_id,
      proposal_id,
      amount,
      description,
      recurring,
      coupon,
      success_url: customSuccessUrl,
      cancel_url: customCancelUrl,
      services,
    } = body as {
      product: ProductKey | string;
      client_name: string;
      client_email: string;
      client_id?: string;
      lead_id?: string;
      proposal_id?: string;
      amount: number;
      description?: string;
      recurring?: boolean;
      coupon?: string;
      success_url?: string;
      cancel_url?: string;
      services?: string;
    };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Cantidad invalida" }, { status: 400 });
    }

    // For proposal checkouts, fetch lead email if not provided
    let email = client_email;
    let name = client_name;
    let leadId = lead_id;

    if (isProposalCheckout && !email) {
      const { data: proposal } = await supabase
        .from("proposals")
        .select("lead_id, leads(name, email)")
        .eq("id", proposal_id)
        .single();

      if (proposal) {
        const lead = Array.isArray(proposal.leads) ? proposal.leads[0] : proposal.leads;
        email = (lead as Record<string, string> | null)?.email || "";
        name = name || (lead as Record<string, string> | null)?.name || "";
        leadId = leadId || (proposal.lead_id as string) || "";
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Email del cliente requerido" }, { status: 400 });
    }

    const productInfo = PACAME_PRODUCTS[product as ProductKey] as Record<string, unknown> | undefined;
    const productName = (productInfo?.name as string) || description || "Servicio PACAME";
    const productDesc = (productInfo?.description as string) || description || "Servicio profesional de PACAME Agencia";
    const isRecurring = recurring ?? (productInfo?.recurring as boolean) ?? false;
    const amountCents = Math.round(amount * 100);

    // Build line item with dynamic price
    const lineItem: {
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description: string;
          images?: string[];
        };
        unit_amount: number;
        recurring?: { interval: "month" };
      };
      quantity: number;
    } = {
      price_data: {
        currency: "eur",
        product_data: {
          name: productName,
          description: productDesc,
          images: ["https://pacameagencia.com/opengraph-image"],
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    };

    if (isRecurring) {
      lineItem.price_data.recurring = { interval: "month" };
    }

    const origin = request.nextUrl.origin;
    const defaultSuccessUrl = isProposalCheckout
      ? `${origin}/propuesta/${proposal_id}?paid=true`
      : `${origin}/dashboard/payments?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = isProposalCheckout
      ? `${origin}/propuesta/${proposal_id}`
      : `${origin}/dashboard/payments?cancelled=true`;

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: isRecurring ? "subscription" : "payment",
      line_items: [lineItem],
      customer_email: email,
      metadata: {
        client_id: client_id || "",
        client_name: name || "",
        client_email: email,
        lead_id: leadId || "",
        proposal_id: proposal_id || "",
        product: product || "custom",
        services: services || "",
        pacame_source: isProposalCheckout ? "proposal" : isPublicCheckout ? "website" : "dashboard",
      },
      success_url: customSuccessUrl || defaultSuccessUrl,
      cancel_url: customCancelUrl || defaultCancelUrl,
      locale: "es",
    };

    // Discounts: auto-apply coupon if provided, otherwise allow manual promo codes
    if (coupon) {
      sessionParams.discounts = [{ coupon }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    // For one-time payments, create invoice for records
    if (!isRecurring) {
      sessionParams.invoice_creation = { enabled: true };
    }

    // Attach affiliate referral (if cookie present) — must run after metadata is finalised
    const refCookie = readRefCookieFromRequest(request);
    const finalParams = attachReferralToCheckoutSession(sessionParams, refCookie);

    const session = await stripe.checkout.sessions.create(finalParams);

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear sesion de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

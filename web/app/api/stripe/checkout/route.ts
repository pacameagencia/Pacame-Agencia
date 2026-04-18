import { NextRequest, NextResponse } from "next/server";
import { stripe, PACAME_PRODUCTS, type ProductKey } from "@/lib/stripe";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkoutLimiter, getClientIp } from "@/lib/security/rate-limit";

const supabase = createServerSupabase();

export async function POST(request: NextRequest) {
  // Rate limit: 20/min por IP — proteccion contra abuso de checkout.
  const ip = getClientIp(request);
  const rl = await checkoutLimiter.limit(ip);
  if (!rl.success) {
    const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests", retry_after: retrySec },
      { status: 429, headers: { "Retry-After": String(retrySec) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validacion minima del body (union flexible, no rompe callers legacy).
  const hasSomething =
    body && typeof body === "object" &&
    (body.product || body.service_slug || body.plan_slug || body.app_slug ||
     body.proposal_id || body.amount);
  if (!hasSomething) {
    return NextResponse.json(
      { error: "Falta product/service_slug/plan_slug/app_slug/proposal_id" },
      { status: 400 }
    );
  }

  // Public checkout from proposal pages, marketplace, website "Buy Now", plans or apps
  const isProposalCheckout = !!body.proposal_id;
  const isMarketplaceCheckout = !!body.service_slug;
  const isPlanCheckout = !!body.plan_slug;
  const isAppCheckout = !!body.app_slug;
  const isPublicCheckout =
    body.source === "public" || isMarketplaceCheckout || isPlanCheckout || isAppCheckout;

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
      amount: providedAmount,
      description,
      recurring,
      coupon,
      success_url: customSuccessUrl,
      cancel_url: customCancelUrl,
      services,
      service_slug,
      plan_slug,
      app_slug,
      billing_interval: rawBillingInterval,
    } = body as {
      product?: ProductKey | string;
      client_name?: string;
      client_email?: string;
      client_id?: string;
      lead_id?: string;
      proposal_id?: string;
      amount?: number;
      description?: string;
      recurring?: boolean;
      coupon?: string;
      success_url?: string;
      cancel_url?: string;
      services?: string;
      service_slug?: string;
      plan_slug?: string;
      app_slug?: string;
      billing_interval?: "month" | "year";
    };

    const billingInterval: "month" | "year" =
      rawBillingInterval === "year" ? "year" : "month";

    // Marketplace path: resolve product from service_catalog
    let marketplaceCatalogId: string | undefined;
    let marketplaceName: string | undefined;
    let marketplaceDesc: string | undefined;
    let resolvedAmount: number | undefined = providedAmount;
    let planId: string | undefined;
    let appId: string | undefined;
    let forceRecurring = false;

    // Plan subscription path: resolve from subscription_plans
    if (isPlanCheckout && plan_slug) {
      const { data: plan, error: planErr } = await supabase
        .from("subscription_plans")
        .select(
          "id, slug, name, tagline, price_monthly_cents, price_yearly_cents, is_active"
        )
        .eq("slug", plan_slug)
        .eq("is_active", true)
        .maybeSingle();

      if (planErr || !plan) {
        return NextResponse.json(
          { error: "Plan no encontrado" },
          { status: 404 }
        );
      }

      planId = plan.id as string;
      marketplaceName = plan.name as string;
      marketplaceDesc = (plan.tagline as string) || marketplaceName;
      const priceCents =
        billingInterval === "year"
          ? ((plan.price_yearly_cents as number | null) ??
             ((plan.price_monthly_cents as number) * 12))
          : (plan.price_monthly_cents as number);
      resolvedAmount = priceCents / 100;
      forceRecurring = true;
    }

    // App subscription path: resolve from apps_catalog
    if (isAppCheckout && app_slug) {
      const { data: app, error: appErr } = await supabase
        .from("apps_catalog")
        .select(
          "id, slug, name, tagline, price_monthly_cents, price_yearly_cents, is_active"
        )
        .eq("slug", app_slug)
        .eq("is_active", true)
        .maybeSingle();

      if (appErr || !app) {
        return NextResponse.json(
          { error: "App no encontrada" },
          { status: 404 }
        );
      }

      appId = app.id as string;
      marketplaceName = app.name as string;
      marketplaceDesc = (app.tagline as string) || marketplaceName;
      const priceCents =
        billingInterval === "year"
          ? ((app.price_yearly_cents as number | null) ??
             ((app.price_monthly_cents as number) * 12))
          : (app.price_monthly_cents as number);
      resolvedAmount = priceCents / 100;
      forceRecurring = true;
    }

    if (isMarketplaceCheckout && service_slug) {
      const { data: svc, error: svcError } = await supabase
        .from("service_catalog")
        .select("id, slug, name, tagline, description, price_cents, is_active")
        .eq("slug", service_slug)
        .eq("is_active", true)
        .maybeSingle();

      if (svcError || !svc) {
        return NextResponse.json(
          { error: "Producto marketplace no encontrado" },
          { status: 404 }
        );
      }

      marketplaceCatalogId = svc.id as string;
      marketplaceName = svc.name as string;
      marketplaceDesc = (svc.tagline as string) || (svc.description as string) || marketplaceName;
      // Trusted price from DB (ignore client-provided amount)
      resolvedAmount = (svc.price_cents as number) / 100;
    }

    const amount = resolvedAmount;

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

    // Marketplace: email is optional here; Stripe Checkout will collect it if absent.
    if (!email && !isMarketplaceCheckout) {
      return NextResponse.json({ error: "Email del cliente requerido" }, { status: 400 });
    }

    const productInfo = product
      ? (PACAME_PRODUCTS[product as ProductKey] as Record<string, unknown> | undefined)
      : undefined;
    const productName =
      marketplaceName || (productInfo?.name as string) || description || "Servicio PACAME";
    const productDesc =
      marketplaceDesc ||
      (productInfo?.description as string) ||
      description ||
      "Servicio profesional de PACAME Agencia";
    // Marketplace entry-tier = one-time. Plans/apps = recurring.
    const isRecurring = forceRecurring
      ? true
      : isMarketplaceCheckout
        ? false
        : recurring ?? (productInfo?.recurring as boolean) ?? false;
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
        recurring?: { interval: "month" | "year" };
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
      lineItem.price_data.recurring = { interval: billingInterval };
    }

    const origin = request.nextUrl.origin;
    const defaultSuccessUrl = isPlanCheckout
      ? `${origin}/portal/subscription-welcome?session_id={CHECKOUT_SESSION_ID}`
      : isAppCheckout
        ? `${origin}/portal/app-welcome?session_id={CHECKOUT_SESSION_ID}&app=${app_slug}`
        : isMarketplaceCheckout
          ? `${origin}/portal/order-redirect?session_id={CHECKOUT_SESSION_ID}`
          : isProposalCheckout
            ? `${origin}/propuesta/${proposal_id}?paid=true`
            : `${origin}/dashboard/payments?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = isPlanCheckout
      ? `${origin}/planes?cancelled=true`
      : isAppCheckout
        ? `${origin}/apps/${app_slug}?cancelled=true`
        : isMarketplaceCheckout
          ? `${origin}/servicios/${service_slug}?cancelled=true`
          : isProposalCheckout
            ? `${origin}/propuesta/${proposal_id}`
            : `${origin}/dashboard/payments?cancelled=true`;

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: isRecurring ? "subscription" : "payment",
      line_items: [lineItem],
      ...(email ? { customer_email: email } : {}),
      metadata: {
        client_id: client_id || "",
        client_name: name || "",
        client_email: email || "",
        lead_id: leadId || "",
        proposal_id: proposal_id || "",
        product: product || plan_slug || app_slug || service_slug || "custom",
        services: services || "",
        service_slug: service_slug || "",
        service_catalog_id: marketplaceCatalogId || "",
        plan_slug: plan_slug || "",
        plan_id: planId || "",
        app_slug: app_slug || "",
        app_id: appId || "",
        billing_interval: billingInterval,
        pacame_source: isPlanCheckout
          ? "subscription"
          : isAppCheckout
            ? "app"
            : isMarketplaceCheckout
              ? "marketplace"
              : isProposalCheckout
                ? "proposal"
                : isPublicCheckout
                  ? "website"
                  : "dashboard",
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

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear sesion de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

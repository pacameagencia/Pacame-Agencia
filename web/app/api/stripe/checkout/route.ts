import { NextRequest, NextResponse } from "next/server";
import { stripe, PACAME_PRODUCTS, type ProductKey } from "@/lib/stripe";
import { verifyInternalAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      product,
      client_name,
      client_email,
      client_id,
      amount,
      description,
      recurring,
    } = body as {
      product: ProductKey | string;
      client_name: string;
      client_email: string;
      client_id?: string;
      amount: number; // en EUR (ej: 300)
      description?: string;
      recurring?: boolean;
    };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Cantidad invalida" }, { status: 400 });
    }
    if (!client_email) {
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
        product_data: { name: string; description: string };
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
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    };

    if (isRecurring) {
      lineItem.price_data.recurring = { interval: "month" };
    }

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      payment_method_types: ["card"],
      mode: isRecurring ? "subscription" : "payment",
      line_items: [lineItem],
      customer_email: client_email,
      metadata: {
        client_id: client_id || "",
        client_name: client_name || "",
        product: product || "custom",
        pacame_source: "dashboard",
      },
      success_url: `${request.nextUrl.origin}/dashboard/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/dashboard/payments?cancelled=true`,
      locale: "es",
    };

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

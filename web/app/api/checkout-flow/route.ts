import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";

interface CheckoutBody {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  company_website?: string;
  company_sector?: string;
  project_description?: string;
  project_objectives?: string;
  timeline?: string;
  service_slug: string;
  service_name: string;
  service_price: number;
  recurring: boolean;
}

interface PartialProgressBody {
  step: number;
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  company_website?: string;
  company_sector?: string;
  project_description?: string;
  project_objectives?: string;
  timeline?: string;
  service_slug?: string;
}

/**
 * POST /api/checkout-flow
 * Creates a lead, saves checkout session, creates Stripe Checkout Session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;

    const {
      name,
      email,
      phone,
      company_name,
      company_website,
      company_sector,
      project_description,
      project_objectives,
      timeline,
      service_slug,
      service_name,
      service_price,
      recurring,
    } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nombre y email son obligatorios" },
        { status: 400 }
      );
    }

    if (!service_slug?.trim() || !service_name?.trim()) {
      return NextResponse.json(
        { error: "Servicio no especificado" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();
    const origin = req.headers.get("origin") || "https://pacameagencia.com";

    // 1. Create or update lead
    let leadId: string | null = null;
    try {
      const { data: lead } = await supabase
        .from("leads")
        .upsert(
          {
            email,
            name,
            phone: phone || null,
            company_name: company_name || null,
            company_website: company_website || null,
            company_sector: company_sector || null,
            project_description: project_description || null,
            project_objectives: project_objectives || null,
            timeline: timeline || null,
            source: "checkout",
            service_interested: service_slug,
            status: "checkout_started",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();

      leadId = lead?.id ?? null;
    } catch {
      // If leads table doesn't exist yet, continue without it
      console.warn("[checkout-flow] Could not save lead — table may not exist");
    }

    // 2. Save checkout session record
    let dbRecordId: string | null = null;
    try {
      const { data: dbRecord } = await supabase
        .from("checkout_sessions")
        .insert({
          email,
          name,
          phone: phone || null,
          company_name: company_name || null,
          company_sector: company_sector || null,
          project_description: project_description || null,
          project_objectives: project_objectives || null,
          timeline: timeline || null,
          service_slug,
          service_name,
          service_price,
          recurring,
          lead_id: leadId,
          status: "completed",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      dbRecordId = dbRecord?.id ?? null;
    } catch {
      // If table doesn't exist yet, continue — Stripe session is the priority
      console.warn(
        "[checkout-flow] Could not save checkout session — table may not exist"
      );
    }

    // 3. Create Stripe Checkout Session
    const amount = service_price;

    const priceData: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
      recurring?: { interval: "month" };
    } = {
      currency: "eur",
      product_data: { name: service_name },
      unit_amount: amount,
    };

    if (recurring) {
      priceData.recurring = { interval: "month" };
    }

    const session = await stripe.checkout.sessions.create({
      mode: recurring ? "subscription" : "payment",
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/servicios`,
      metadata: {
        client_name: name,
        client_email: email,
        product: service_slug,
        lead_id: leadId ?? "",
        services: service_slug,
        checkout_session_id: dbRecordId ?? "",
      },
      payment_method_types: ["card"],
      allow_promotion_codes: true,
    });

    // 4. Update checkout session with Stripe session ID
    if (dbRecordId) {
      try {
        await supabase
          .from("checkout_sessions")
          .update({ stripe_session_id: session.id })
          .eq("id", dbRecordId);
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      url: session.url,
      checkout_session_id: dbRecordId,
    });
  } catch (err) {
    console.error("[checkout-flow] Error:", err);
    const message =
      err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/checkout-flow
 * Saves partial checkout progress (step updates).
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as PartialProgressBody;

    const { step, email, name, service_slug, ...rest } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email requerido para guardar progreso" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Upsert partial progress
    try {
      await supabase.from("checkout_sessions").upsert(
        {
          email,
          name: name || null,
          phone: rest.phone || null,
          company_name: rest.company_name || null,
          company_sector: rest.company_sector || null,
          project_description: rest.project_description || null,
          project_objectives: rest.project_objectives || null,
          timeline: rest.timeline || null,
          service_slug: service_slug || null,
          status: `step_${step}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    } catch {
      console.warn(
        "[checkout-flow] Could not save partial progress — table may not exist"
      );
    }

    return NextResponse.json({ ok: true, step });
  } catch (err) {
    console.error("[checkout-flow] PATCH error:", err);
    const message =
      err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

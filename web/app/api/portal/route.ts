import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Client Portal API
 *
 * Magic link auth: client enters email → receives link with token → accesses portal
 * Token stored in onboarding_data JSONB (no DDL migration needed)
 */

async function findClientByToken(token: string) {
  // Token stored in onboarding_data->portal_token
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, business_name, email, plan, status, monthly_fee, created_at, onboarding_data")
    .limit(100);

  if (!clients) return null;

  for (const client of clients) {
    const od = (client.onboarding_data || {}) as Record<string, unknown>;
    if (od.portal_token === token) {
      // Check expiry
      const expires = od.portal_token_expires as string | undefined;
      if (expires && new Date(expires) < new Date()) return null;
      return client;
    }
  }
  return null;
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // --- Request magic link ---
  if (action === "request_access") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    // Find client by email
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, email, onboarding_data")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!client) {
      // Don't reveal if email exists or not — always show success
      return NextResponse.json({ ok: true });
    }

    // Generate token (valid 24h) — stored in onboarding_data JSONB
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const existingData = (client.onboarding_data || {}) as Record<string, unknown>;

    await supabase.from("clients").update({
      onboarding_data: {
        ...existingData,
        portal_token: token,
        portal_token_expires: expiresAt,
      },
    }).eq("id", client.id);

    // Send magic link email
    const portalUrl = `https://app.pacameagencia.com/portal?token=${token}`;

    await sendEmail({
      to: client.email,
      subject: `${client.name}, accede a tu portal PACAME`,
      html: wrapEmailTemplate(
        `Hola ${client.name.split(" ")[0]},\n\n` +
        `Usa este enlace para acceder a tu portal de cliente en PACAME. ` +
        `Aqui puedes ver el estado de tu proyecto, contenido pendiente de aprobar y tu historial de pagos.\n\n` +
        `El enlace es valido durante 24 horas. Si no has solicitado este acceso, ignora este email.`,
        {
          cta: "Acceder a mi portal",
          ctaUrl: portalUrl,
          preheader: "Tu enlace de acceso al portal PACAME",
        }
      ),
      tags: [
        { name: "type", value: "portal_access" },
        { name: "client_id", value: client.id },
      ],
    });

    return NextResponse.json({ ok: true });
  }

  // --- Verify token ---
  if (action === "verify_token") {
    const { token } = body;
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });

    const client = await findClientByToken(token);
    if (!client) {
      return NextResponse.json({ error: "Enlace invalido o expirado" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      client: {
        id: client.id,
        name: client.name,
        business_name: client.business_name,
        email: client.email,
        plan: client.plan,
        status: client.status,
      },
    });
  }

  // --- Get project data ---
  if (action === "get_project") {
    const { token } = body;
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });

    const client = await findClientByToken(token);
    if (!client) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    // Fetch project data in parallel
    const [contentRes, proposalsRes, paymentsRes, callsRes] = await Promise.all([
      // Content created for this client
      supabase
        .from("content")
        .select("id, title, type, status, platform, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(20),
      // Proposals
      supabase
        .from("proposals")
        .select("id, sage_analysis, services_proposed, total_onetime, total_monthly, status, created_at")
        .eq("lead_id", client.id) // Note: might need to link via lead_id
        .order("created_at", { ascending: false })
        .limit(5),
      // Payment history (from finances)
      supabase
        .from("finances")
        .select("id, description, amount, type, date, created_at")
        .eq("client_id", client.id)
        .eq("type", "income")
        .order("date", { ascending: false })
        .limit(10),
      // Calls
      supabase
        .from("voice_calls")
        .select("id, purpose, summary, sentiment, duration_seconds, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Content stats
    const content = contentRes.data || [];
    const totalContent = content.length;
    const publishedContent = content.filter((c) => c.status === "published").length;
    const pendingContent = content.filter((c) => c.status === "pending_review").length;

    return NextResponse.json({
      ok: true,
      client: {
        name: client.name,
        business_name: client.business_name,
        plan: client.plan,
        status: client.status,
        monthly_fee: client.monthly_fee,
        member_since: client.created_at,
      },
      content: {
        items: content,
        stats: { total: totalContent, published: publishedContent, pending: pendingContent },
      },
      proposals: proposalsRes.data || [],
      payments: paymentsRes.data || [],
      calls: callsRes.data || [],
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

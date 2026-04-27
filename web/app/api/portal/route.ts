import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import crypto from "crypto";
import { z } from "zod/v4";
import { getLogger } from "@/lib/observability/logger";

const requestAccessSchema = z.object({
  action: z.literal("request_access"),
  email: z.email("Email no valido"),
});

const verifyTokenSchema = z.object({
  action: z.literal("verify_token"),
  token: z.string().min(1, "Token requerido").max(200),
});

const getProjectSchema = z.object({
  action: z.literal("get_project"),
  token: z.string().min(1, "Token requerido").max(200),
});

const portalSchema = z.discriminatedUnion("action", [requestAccessSchema, verifyTokenSchema, getProjectSchema]);

const supabase = createServerSupabase();

/**
 * Client Portal API
 *
 * Magic link auth: client enters email → receives link with token → accesses portal
 * Token stored in onboarding_data JSONB (no DDL migration needed)
 */

async function findClientByToken(token: string) {
  // JSONB query: onboarding_data->>portal_token = token (indexed, no full scan)
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, business_name, email, plan, status, monthly_fee, created_at, onboarding_data")
    .filter("onboarding_data->>portal_token", "eq", token)
    .limit(1);

  const client = clients?.[0];
  if (!client) return null;

  // Check expiry
  const od = (client.onboarding_data || {}) as Record<string, unknown>;
  const expires = od.portal_token_expires as string | undefined;
  if (expires && new Date(expires) < new Date()) return null;

  return client;
}
export async function POST(request: NextRequest) {
  const parsed = portalSchema.safeParse(await request.json());

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos invalidos";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { action } = parsed.data;

  // --- Request magic link ---
  if (action === "request_access") {
    const { email } = parsed.data;

    // Find client by email (use limit(1) instead of single() to avoid crash on 0/multiple)
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, onboarding_data")
      .eq("email", email.toLowerCase().trim())
      .limit(1);

    const client = clients?.[0];
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
    const portalUrl = `https://pacameagencia.com/portal?token=${token}`;

    await sendEmail({
      to: client.email,
      subject: `${client.name || "Cliente"}, accede a tu portal PACAME`,
      html: wrapEmailTemplate(
        `Hola ${client.name?.split(" ")[0] || client.name || "cliente"},\n\n` +
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
    const { token } = parsed.data;

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
    const { token } = parsed.data;

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

// --- Cookie-based auth helper for GET/PATCH ---
async function getAuthClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pacame_client_auth")?.value;
  if (!token) return null;
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .single();
  return data;
}

/**
 * GET /api/portal?action=...
 * Actions: get_dashboard, get_milestones, get_payments, get_settings
 */
export async function GET(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // --- Dashboard ---
  if (action === "get_dashboard") {
    const [milestonesRes, unreadRes, filesRes, paymentsRes, activityRes] = await Promise.all([
      supabase
        .from("project_milestones")
        .select("id, title, description, status, due_date, completed_at, sort_order")
        .eq("client_id", client.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("client_messages")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("read", false)
        .neq("sender", "client"),
      supabase
        .from("client_files")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id),
      supabase
        .from("finances")
        .select("amount")
        .eq("client_id", client.id)
        .eq("type", "income"),
      // Recent activity: combine milestones and messages
      supabase
        .from("client_messages")
        .select("id, sender, message, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const milestones = milestonesRes.data ?? [];
    const totalPayments = (paymentsRes.data ?? []).reduce(
      (sum: number, p: { amount: number }) => sum + Number(p.amount),
      0
    );

    // Build activity from recent messages
    const recentActivity = (activityRes.data ?? []).map(
      (msg: { id: string; sender: string; message: string; created_at: string }) => ({
        id: msg.id,
        type: msg.sender === "client" ? "message_sent" : "message_received",
        description:
          msg.sender === "client"
            ? `Enviaste: "${msg.message.slice(0, 80)}${msg.message.length > 80 ? "..." : ""}"`
            : `${msg.sender === "team" ? "Equipo PACAME" : msg.sender.replace("agent:", "")}: "${msg.message.slice(0, 80)}${msg.message.length > 80 ? "..." : ""}"`,
        created_at: msg.created_at,
      })
    );

    return NextResponse.json({
      client: {
        name: client.name,
        business_name: client.business_name,
        plan: client.plan,
        status: client.status,
        monthly_fee: client.monthly_fee,
        member_since: client.created_at,
      },
      milestones,
      unreadMessages: unreadRes.count ?? 0,
      recentActivity,
      filesCount: filesRes.count ?? 0,
      paymentsTotal: totalPayments,
    });
  }

  // --- Milestones ---
  if (action === "get_milestones") {
    const { data: milestones, error } = await supabase
      .from("project_milestones")
      .select("id, title, description, status, due_date, completed_at, sort_order")
      .eq("client_id", client.id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Error al cargar hitos" }, { status: 500 });
    }

    return NextResponse.json({ milestones: milestones ?? [] });
  }

  // --- Payments ---
  if (action === "get_payments") {
    const { data: payments, error } = await supabase
      .from("finances")
      .select("id, description, amount, date, type")
      .eq("client_id", client.id)
      .eq("type", "income")
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Error al cargar pagos" }, { status: 500 });
    }

    const paymentsList = (payments ?? []).map(
      (p: { id: string; description: string; amount: number; date: string; type: string }) => ({
        ...p,
        status: "completed" as const,
      })
    );

    const totalSpent = paymentsList.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);

    return NextResponse.json({
      payments: paymentsList,
      totalSpent,
      paymentsCount: paymentsList.length,
    });
  }

  // --- Settings ---
  if (action === "get_settings") {
    const { data: settings } = await supabase
      .from("client_brand_settings")
      .select("*")
      .eq("client_id", client.id)
      .single();

    return NextResponse.json({
      settings: settings ?? {
        logo_url: null,
        primary_color: "#B54E30",
        secondary_color: "#283B70",
        font_heading: "Space Grotesk",
        font_body: "Inter",
        company_tagline: "",
      },
    });
  }

  return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
}

/**
 * PATCH /api/portal
 * Actions: update_brand_settings, complete_onboarding
 */
export async function PATCH(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action as string;

    if (action === "update_brand_settings") {
      const updateData: Record<string, unknown> = {};

      if (typeof body.logo_url === "string") updateData.logo_url = body.logo_url;
      if (typeof body.primary_color === "string") updateData.primary_color = body.primary_color;
      if (typeof body.secondary_color === "string") updateData.secondary_color = body.secondary_color;
      if (typeof body.font_heading === "string") updateData.font_heading = body.font_heading;
      if (typeof body.font_body === "string") updateData.font_body = body.font_body;
      if (typeof body.company_tagline === "string") updateData.company_tagline = body.company_tagline;

      // Upsert: insert if not exists, update if exists
      const { data: existing } = await supabase
        .from("client_brand_settings")
        .select("client_id")
        .eq("client_id", client.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("client_brand_settings")
          .update(updateData)
          .eq("client_id", client.id);

        if (error) {
          getLogger().error({ err: error }, "Update brand settings error");
          return NextResponse.json({ error: "Error al guardar ajustes" }, { status: 500 });
        }
      } else {
        const { error } = await supabase
          .from("client_brand_settings")
          .insert({ client_id: client.id, ...updateData });

        if (error) {
          getLogger().error({ err: error }, "Insert brand settings error");
          return NextResponse.json({ error: "Error al crear ajustes" }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "complete_onboarding") {
      const existingData = (client.onboarding_data ?? {}) as Record<string, unknown>;

      const { error } = await supabase
        .from("clients")
        .update({
          onboarding_data: {
            ...existingData,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          },
        })
        .eq("id", client.id);

      if (error) {
        getLogger().error({ err: error }, "Complete onboarding error");
        return NextResponse.json({ error: "Error al completar onboarding" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (err) {
    getLogger().error({ err }, "PATCH portal error");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

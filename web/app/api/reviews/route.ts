// TODO: Add auth for moderation actions (moderate, request, list — but NOT submit, which stays public)
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";

const supabase = createServerSupabase();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // --- Submit a review ---
  if (action === "submit") {
    const { client_id, name, role, rating, text, service, city } = body;
    if (!name || !rating || !text) {
      return NextResponse.json({ error: "name, rating, and text required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("reviews").insert({
      client_id: client_id || null,
      name,
      role: role || "",
      rating: Math.min(5, Math.max(1, rating)),
      text,
      service: service || "",
      city: city || "",
      status: "pending",
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify Pablo
    await supabase.from("notifications").insert({
      type: "new_review",
      priority: rating >= 4 ? "normal" : "high",
      title: `Nueva resena de ${name}`,
      message: `${rating}/5 estrellas: "${text.slice(0, 100)}..."`,
      data: { review_id: data.id, rating, client_id },
    });

    logAgentActivity({
      agentId: "sage",
      type: "update",
      title: `Nueva resena: ${name}`,
      description: `${rating}/5 - ${service || "General"}. Pendiente de aprobacion.`,
    });

    return NextResponse.json({ ok: true, review_id: data.id });
  }

  // --- Get published reviews ---
  if (action === "list") {
    const limit = body.limit || 10;
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("status", "published")
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({ reviews: data || [] });
  }

  // --- Approve/reject review ---
  if (action === "moderate") {
    const { review_id, decision } = body;
    if (!review_id || !decision) {
      return NextResponse.json({ error: "review_id and decision required" }, { status: 400 });
    }

    const { error } = await supabase.from("reviews").update({
      status: decision === "approve" ? "published" : "rejected",
      published_at: decision === "approve" ? new Date().toISOString() : null,
    }).eq("id", review_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- Request review from client (sends email) ---
  if (action === "request") {
    const { client_id } = body;
    if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    const { data: client } = await supabase
      .from("clients")
      .select("name, email, business_name")
      .eq("id", client_id)
      .single();

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // Store as notification (email integration via Resend later)
    await supabase.from("notifications").insert({
      type: "review_request",
      priority: "normal",
      title: `Solicitar resena: ${client.name}`,
      message: `Enviar email a ${client.email} pidiendo resena de su experiencia con PACAME.`,
      data: {
        client_id,
        to_email: client.email,
        to_name: client.name,
        review_url: `https://pacameagencia.com/review?client=${client_id}`,
      },
    });

    logAgentActivity({
      agentId: "sage",
      type: "update",
      title: `Resena solicitada: ${client.name}`,
      description: `Email de solicitud de resena preparado para ${client.email}.`,
    });

    return NextResponse.json({ ok: true, client_name: client.name });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

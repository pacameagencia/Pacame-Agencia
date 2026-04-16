import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { notifyHotLead } from "@/lib/telegram";

interface LeadMagnetBody {
  slug: string;
  name: string;
  email: string;
  website: string;
}

function isValidBody(body: unknown): body is LeadMagnetBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.slug === "string" &&
    b.slug.length > 0 &&
    typeof b.name === "string" &&
    b.name.length > 0 &&
    typeof b.email === "string" &&
    b.email.includes("@") &&
    typeof b.website === "string" &&
    b.website.length > 0
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!isValidBody(body)) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: slug, name, email, website" },
        { status: 400 }
      );
    }

    const { slug, name, email, website } = body;
    const supabase = createServerSupabase();

    // 1. Create lead in leads table
    const { error: leadError } = await supabase.from("leads").insert({
      name,
      email,
      source: `lead_magnet:${slug}`,
      problem: `Solicita auditoria web para: ${website}`,
      score: 3,
      status: "new",
    });

    if (leadError) {
      console.error("[LeadMagnets] Error creating lead:", leadError);
      // Continue even if lead creation fails (might be duplicate)
    }

    // 2. Increment downloads in lead_magnets table (if the table exists)
    const { error: incrementError } = await supabase.rpc(
      "increment_lead_magnet_downloads",
      { magnet_slug: slug }
    );

    if (incrementError) {
      // Table or function might not exist yet — log but don't fail
      console.warn("[LeadMagnets] Could not increment downloads:", incrementError.message);
    }

    // 3. Send confirmation email
    const emailHtml = wrapEmailTemplate(
      `Hola ${name},\n\nHemos recibido tu solicitud de auditoria web gratuita para ${website}.\n\nNuestro equipo de agentes IA va a analizar tu web en detalle. En las proximas 24 horas recibiras un informe completo con:\n\n- Analisis de velocidad y rendimiento\n- Revision SEO con errores y oportunidades\n- Evaluacion de experiencia de usuario\n- Analisis de conversion\n- Plan de mejora priorizado\n\nSi tienes alguna duda mientras tanto, respondenos a este email o escribenos por WhatsApp al +34 722 669 381.\n\nUn saludo,\nEl equipo PACAME`,
      {
        preheader: "Tu auditoria web gratuita esta en camino",
        cta: "Conoce nuestros servicios",
        ctaUrl: "https://pacameagencia.com/servicios",
      }
    );

    await sendEmail({
      to: email,
      subject: "Tu auditoria web gratuita esta en camino — PACAME",
      html: emailHtml,
      tags: [
        { name: "type", value: "lead_magnet" },
        { name: "slug", value: slug },
      ],
    });

    // 4. Notify Pablo via Telegram
    await notifyHotLead({
      name,
      score: 3,
      problem: `Auditoria web: ${website}`,
      source: `lead_magnet:${slug}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[LeadMagnets] Unhandled error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

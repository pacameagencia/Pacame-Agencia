import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";

/**
 * Cron endpoint for abandoned checkout recovery.
 * GET /api/checkout-flow/recover
 * Requires Authorization: Bearer {CRON_SECRET}
 *
 * Finds checkout sessions that were started 1-7 days ago
 * and never completed, then sends a recovery email.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabase();

    // Timestamps: 1 hour ago → 7 days ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Find abandoned checkout sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("checkout_sessions")
      .select("id, email, name, service_slug, created_at")
      .neq("status", "completed")
      .lt("created_at", oneHourAgo)
      .gt("created_at", sevenDaysAgo);

    if (sessionsError) {
      console.error(
        "[CheckoutRecover] Error querying sessions:",
        sessionsError
      );
      return NextResponse.json(
        { error: "Error querying sessions", details: sessionsError.message },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No abandoned sessions found" });
    }

    let sentCount = 0;

    for (const session of sessions) {
      // Check if already in abandoned_checkouts
      const { data: existing } = await supabase
        .from("abandoned_checkouts")
        .select("id")
        .eq("checkout_session_id", session.id)
        .limit(1);

      if (existing && existing.length > 0) {
        continue; // Already processed
      }

      // Create abandoned_checkout record
      const { error: insertError } = await supabase
        .from("abandoned_checkouts")
        .insert({
          checkout_session_id: session.id,
          email: session.email,
          name: session.name,
          service_slug: session.service_slug,
          recovered: false,
        });

      if (insertError) {
        console.warn(
          "[CheckoutRecover] Error inserting abandoned checkout:",
          insertError.message
        );
        continue;
      }

      // Send recovery email
      if (session.email) {
        const recoveryUrl = `https://pacameagencia.com/servicios`;
        const emailBody = `Hola ${session.name || ""},\n\nVimos que empezaste a contratar un servicio con nosotros pero no completaste el proceso.\n\nEntendemos que a veces hace falta pensarlo. Si te quedo alguna duda, estamos aqui para resolverla.\n\nPuedes retomar donde lo dejaste en cualquier momento. Y recuerda: todos nuestros servicios incluyen garantia de devolucion de 15 dias.\n\nSi prefieres hablar directamente, escribenos por WhatsApp al +34 722 669 381.\n\nUn saludo,\nEl equipo PACAME`;

        const emailHtml = wrapEmailTemplate(emailBody, {
          preheader: "Dejaste algo pendiente...",
          cta: "Retomar mi pedido",
          ctaUrl: recoveryUrl,
        });

        const sent = await sendEmail({
          to: session.email,
          subject: "Dejaste algo pendiente... — PACAME",
          html: emailHtml,
          tags: [
            { name: "type", value: "abandoned_checkout" },
            { name: "session_id", value: session.id },
          ],
        });

        if (sent) {
          sentCount++;

          // Mark email sent timestamp
          await supabase
            .from("abandoned_checkouts")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("checkout_session_id", session.id);
        }
      }
    }

    return NextResponse.json({
      sent: sentCount,
      total_abandoned: sessions.length,
      message: `Recovery emails sent: ${sentCount}`,
    });
  } catch (err) {
    console.error("[CheckoutRecover] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Centralized email sending endpoint.
 * Actions:
 *  - send: Send a single email
 *  - send_pending: Process unsent notifications of type nurture_email/followup/proposal
 *  - notify_pablo: Send alert email to Pablo
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // --- Send a single email ---
  if (action === "send") {
    const { to, subject, body: emailBody, cta, cta_url } = body;
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "to, subject, body required" }, { status: 400 });
    }

    const html = wrapEmailTemplate(emailBody, { cta, ctaUrl: cta_url });
    const emailId = await sendEmail({ to, subject, html });

    if (!emailId) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email_id: emailId });
  }

  // --- Process pending email notifications and actually send them ---
  if (action === "send_pending") {
    const emailTypes = ["nurture_email", "followup_needed", "proposal_ready"];

    const { data: pending } = await supabase
      .from("notifications")
      .select("*")
      .in("type", emailTypes)
      .eq("sent", false)
      .order("created_at", { ascending: true })
      .limit(20);

    if (!pending?.length) {
      return NextResponse.json({ sent: 0, message: "No pending emails" });
    }

    let sent = 0;
    let failed = 0;

    for (const notif of pending) {
      const data = notif.data as Record<string, unknown> || {};
      const toEmail = data.to_email as string;
      const subject = data.subject as string || notif.title;

      if (!toEmail) {
        // No email address — mark as sent to avoid retry loop
        await supabase.from("notifications").update({ sent: true, sent_at: new Date().toISOString() }).eq("id", notif.id);
        continue;
      }

      const cta = data.cta as string || undefined;
      const html = wrapEmailTemplate(notif.message, {
        cta,
        ctaUrl: "https://pacameagencia.com/contacto",
        preheader: subject,
      });

      const emailId = await sendEmail({
        to: toEmail,
        subject,
        html,
        tags: [
          { name: "type", value: notif.type },
          ...(data.lead_id ? [{ name: "lead_id", value: String(data.lead_id) }] : []),
        ],
      });

      if (emailId) {
        await supabase.from("notifications").update({
          sent: true,
          sent_at: new Date().toISOString(),
          sent_via: "resend",
          data: { ...data, resend_email_id: emailId },
        }).eq("id", notif.id);
        sent++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, total: pending.length });
  }

  // --- Send alert to Pablo ---
  if (action === "notify_pablo") {
    const { subject, message } = body;
    if (!subject || !message) {
      return NextResponse.json({ error: "subject and message required" }, { status: 400 });
    }

    const emailId = await notifyPablo(subject, wrapEmailTemplate(message));
    return NextResponse.json({ ok: !!emailId, email_id: emailId });
  }

  return NextResponse.json({ error: "Invalid action. Use: send, send_pending, notify_pablo" }, { status: 400 });
}

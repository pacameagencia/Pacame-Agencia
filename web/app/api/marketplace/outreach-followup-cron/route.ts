import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { composeFollowupEmail } from "@/lib/outreach/engine";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://pacameagencia.com";

/**
 * GET /api/marketplace/outreach-followup-cron
 *
 * Corre cada dia 14:00 UTC.
 *
 * Touch 2 (dia 3): leads con primer email enviado hace 3 dias sin reply.
 * Touch 3 (dia 7): leads con touch 2 enviado hace 4 dias sin reply. Es el ULTIMO.
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const dryRun = process.env.OUTREACH_DRY_RUN !== "false";
  const log = getLogger();
  const supabase = createServerSupabase();
  const results = { touch2_sent: 0, touch3_sent: 0, skipped: 0, errors: 0 };

  // Touch 2: leads con touch 1 enviado entre 72-96h atras, sin reply
  const t2Lower = new Date(Date.now() - 96 * 3600 * 1000).toISOString();
  const t2Upper = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

  const { data: touch2Candidates } = await supabase
    .from("outreach_touches")
    .select("lead_id, campaign_id, sent_at, outreach_leads!inner(status, email, business_name)")
    .eq("touch_number", 1)
    .is("replied_at", null)
    .gte("sent_at", t2Lower)
    .lte("sent_at", t2Upper)
    .limit(50);

  for (const t of touch2Candidates || []) {
    const lead = (t as unknown as { outreach_leads: { status: string; email: string; business_name: string } }).outreach_leads;
    if (!lead || lead.status === "unsubscribed" || lead.status === "replied" || lead.status === "interested" || lead.status === "converted" || !lead.email) {
      results.skipped++;
      continue;
    }
    // Skip if touch 2 already exists for this lead
    const { data: existing } = await supabase
      .from("outreach_touches")
      .select("id")
      .eq("lead_id", t.lead_id)
      .eq("touch_number", 2)
      .maybeSingle();
    if (existing) continue;

    try {
      const composed = await composeFollowupEmail(t.lead_id as string, 2);
      if (!composed) {
        results.skipped++;
        continue;
      }

      let resendId: string | null = null;
      if (!dryRun) {
        resendId = await sendEmail({
          to: composed.email,
          subject: composed.subject,
          html: wrapEmailTemplate(composed.body, {
            preheader: composed.subject,
          }),
          tags: [
            { name: "type", value: "outreach" },
            { name: "touch", value: "2" },
          ],
        });
      }

      await supabase.from("outreach_touches").insert({
        lead_id: t.lead_id,
        campaign_id: t.campaign_id,
        touch_number: 2,
        channel: "email",
        direction: "outbound",
        subject: composed.subject,
        body: composed.body,
        resend_email_id: resendId,
        sent_at: resendId ? new Date().toISOString() : null,
        metadata: { dry_run: dryRun },
      });

      if (resendId || dryRun) results.touch2_sent++;
    } catch (err) {
      log.error({ err, leadId: t.lead_id }, "touch2 failed");
      results.errors++;
    }
  }

  // Touch 3: leads con touch 2 enviado entre 72-96h atras, sin reply (dia 7 desde touch1)
  const t3Lower = new Date(Date.now() - 96 * 3600 * 1000).toISOString();
  const t3Upper = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

  const { data: touch3Candidates } = await supabase
    .from("outreach_touches")
    .select("lead_id, campaign_id, sent_at, outreach_leads!inner(status, email, business_name)")
    .eq("touch_number", 2)
    .is("replied_at", null)
    .gte("sent_at", t3Lower)
    .lte("sent_at", t3Upper)
    .limit(50);

  for (const t of touch3Candidates || []) {
    const lead = (t as unknown as { outreach_leads: { status: string; email: string; business_name: string } }).outreach_leads;
    if (!lead || ["unsubscribed", "replied", "interested", "converted"].includes(lead.status) || !lead.email) {
      results.skipped++;
      continue;
    }
    const { data: existing } = await supabase
      .from("outreach_touches")
      .select("id")
      .eq("lead_id", t.lead_id)
      .eq("touch_number", 3)
      .maybeSingle();
    if (existing) continue;

    try {
      const composed = await composeFollowupEmail(t.lead_id as string, 3);
      if (!composed) {
        results.skipped++;
        continue;
      }

      let resendId: string | null = null;
      if (!dryRun) {
        resendId = await sendEmail({
          to: composed.email,
          subject: composed.subject,
          html: wrapEmailTemplate(composed.body, {
            preheader: composed.subject,
          }),
          tags: [
            { name: "type", value: "outreach" },
            { name: "touch", value: "3" },
          ],
        });
      }

      await supabase.from("outreach_touches").insert({
        lead_id: t.lead_id,
        campaign_id: t.campaign_id,
        touch_number: 3,
        channel: "email",
        direction: "outbound",
        subject: composed.subject,
        body: composed.body,
        resend_email_id: resendId,
        sent_at: resendId ? new Date().toISOString() : null,
        metadata: { dry_run: dryRun, last_touch: true },
      });

      if (resendId || dryRun) results.touch3_sent++;
    } catch (err) {
      log.error({ err, leadId: t.lead_id }, "touch3 failed");
      results.errors++;
    }
  }

  await auditLog({
    actor: { type: "system", id: "outreach-followup-cron" },
    action: "outreach.followup_cron",
    metadata: { ...results, dry_run: dryRun },
  });

  log.info({ ...results, dryRun }, "outreach-followup-cron complete");
  return NextResponse.json({ ok: true, dry_run: dryRun, ...results });
}

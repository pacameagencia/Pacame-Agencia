import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { stripe } from "@/lib/stripe";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";
import { notifyPablo } from "@/lib/resend";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/gdpr/purge-cron
 * Cron diario (03:00 UTC). Purga datos de clientes con:
 *   - deletion_confirmed_at < now() - 30 days
 *   - deletion_completed_at IS NULL
 *
 * MODO DRY-RUN por defecto si GDPR_PURGE_DRY_RUN=true. Cambiar a false tras 7 dias de validacion.
 *
 * Orden de borrado (hijos primero, padre anonimizado al final):
 *   1. Stripe subs cancel
 *   2. deliverables, order_events, delivery_revisions (via cascade de orders)
 *   3. orders
 *   4. client_messages, client_files, project_milestones, client_brand_settings
 *   5. subscriptions, app_instances (+ app_messages, app_leads cascade)
 *   6. conversations, finances, notifications
 *   7. clients: anonimizar (name='[deleted]', email=null, phone=null, ...)
 */

const TABLES_CHILD_OF_CLIENT = [
  "client_messages",
  "client_files",
  "project_milestones",
  "client_brand_settings",
  "subscriptions",
  "app_instances",
  "conversations",
  "finances",
  "notifications",
];

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const dryRun =
    process.env.GDPR_PURGE_DRY_RUN === "false" ? false : true;
  const log = getLogger();
  const supabase = createServerSupabase();

  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: candidates, error: qErr } = await supabase
    .from("clients")
    .select("id, email, stripe_customer_id:onboarding_data, name")
    .not("deletion_confirmed_at", "is", null)
    .lt("deletion_confirmed_at", cutoff)
    .is("deletion_completed_at", null)
    .limit(20);

  if (qErr) {
    log.error({ err: qErr }, "gdpr purge-cron query failed");
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const processed: Array<{ client_id: string; rows_deleted: Record<string, number>; stripe_canceled: string[]; error?: string }> = [];

  for (const c of candidates || []) {
    const clientId = c.id as string;
    const email = c.email as string | null;
    const rowsDeleted: Record<string, number> = {};
    const stripeCanceled: string[] = [];
    let errorMsg: string | undefined;

    try {
      // 1. Cancel Stripe subs
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("client_id", clientId)
        .in("status", ["active", "trialing", "past_due"]);

      for (const s of subs || []) {
        const subId = s.stripe_subscription_id as string | null;
        if (!subId) continue;
        if (!dryRun) {
          try {
            await stripe.subscriptions.cancel(subId);
            stripeCanceled.push(subId);
          } catch (e) {
            log.warn({ err: e, subId }, "stripe cancel failed (subscription may already be canceled)");
          }
        } else {
          stripeCanceled.push(`${subId} (dry-run)`);
        }
      }

      // 2. Orders → cascade borra deliverables, events, revisions
      const { count: orderCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId);
      rowsDeleted.orders = orderCount || 0;

      if (!dryRun && (orderCount || 0) > 0) {
        await supabase.from("orders").delete().eq("client_id", clientId);
      }

      // 3-5. Child tables
      for (const t of TABLES_CHILD_OF_CLIENT) {
        const { count } = await supabase
          .from(t)
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId);
        rowsDeleted[t] = count || 0;
        if (!dryRun && (count || 0) > 0) {
          await supabase.from(t).delete().eq("client_id", clientId);
        }
      }

      // 6. Anonimizar cliente (no borrar fila — mantiene FK audit_log y gdpr_deletion_log)
      if (!dryRun) {
        await supabase
          .from("clients")
          .update({
            name: "[deleted]",
            email: null,
            phone: null,
            business_name: null,
            business_type: null,
            password_hash: null,
            auth_token: null,
            auth_token_expires: null,
            avatar_url: null,
            onboarding_data: {},
            notes: "[purged]",
            testimonial_text: null,
            testimonial_photo_url: null,
            show_in_testimonials: false,
            deletion_completed_at: new Date().toISOString(),
          })
          .eq("id", clientId);
      }

      // 7. Log
      await supabase.from("gdpr_deletion_log").insert({
        client_id: clientId,
        client_email_hash: email ? sha256Hex(email) : null,
        requested_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        completed_at: dryRun ? null : new Date().toISOString(),
        rows_deleted: rowsDeleted,
        stripe_subscriptions_canceled: stripeCanceled,
        dry_run: dryRun,
        notes: dryRun ? "DRY RUN — would delete" : "Purge ejecutada",
      });

      await auditLog({
        actor: { type: "system", id: "gdpr-purge-cron" },
        action: dryRun ? "gdpr.purge_dry_run" : "gdpr.purge_executed",
        resource: { type: "clients", id: clientId },
        metadata: { rowsDeleted, stripeCanceled },
        request,
      });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
      log.error({ err: e, clientId }, "gdpr purge iteration failed");
    }

    processed.push({ client_id: clientId, rows_deleted: rowsDeleted, stripe_canceled: stripeCanceled, error: errorMsg });
  }

  if (processed.length > 0 && !dryRun) {
    notifyPablo(
      `GDPR purge: ${processed.length} clientes purgados`,
      `Purga ejecutada en ${processed.length} clientes. Ver audit_log y gdpr_deletion_log.`
    ).catch(() => {});
  }

  return NextResponse.json({
    dry_run: dryRun,
    cutoff,
    processed_count: processed.length,
    processed,
  });
}

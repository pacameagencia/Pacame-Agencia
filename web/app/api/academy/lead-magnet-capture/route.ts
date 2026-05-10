/**
 * POST /api/academy/lead-magnet-capture — Captura email para descargar lead magnet Dark Academy.
 *
 * Body:
 *   {
 *     email: string,
 *     lead_magnet_slug: string,    // 'mapa-stack-ia-2026', 'three-pass-review-checklist', etc.
 *     firstname?: string,
 *     source_utm?: string,         // 'feed_ig', 'noticias', 'newsletter', etc.
 *     locale?: 'es' | 'pt' | 'en'  // default 'es'
 *   }
 *
 * Response 200: { ok: true, capture_id, status: 'captured' | 'already_exists', user_id }
 *
 * Notas:
 *   - Idempotente por (email, lead_magnet_slug): si ya hay captura, no re-envía email.
 *   - Crea o reutiliza academy_users (upsert por email) con source = `leadmagnet_{moduleId}`.
 *   - Envía email de entrega inmediato vía Dark Room mailer (NO PACAME).
 *   - NO requiere auth: endpoint público.
 *
 * Bloqueadores aún pendientes (SPRINT-B-BLOCKERS.md):
 *   - Dominio darkroomcreative.cloud verificado en Resend (SPF+DKIM+DMARC).
 *   - Asset PDF subido a bucket Supabase Storage 'academy-public'.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendDarkRoomEmail, generateUnsubscribeToken } from "@/lib/darkroom/academy-mailer";
import { renderLeadMagnetDeliveryEmail } from "@/lib/darkroom/academy-email-templates";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 15;

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const LOCALES = new Set(["es", "pt", "en"]);

interface CaptureInput {
  email?: string;
  lead_magnet_slug?: string;
  firstname?: string;
  source_utm?: string;
  locale?: string;
}

interface LeadMagnetRow {
  id: string;
  module_id: string | null;
  slug: string;
  title: string;
  description: string;
  asset_url: string;
  published: boolean;
}

interface AcademyUserRow {
  id: string;
  email: string;
  unsubscribe_token: string | null;
}

interface ModuleRow {
  id: string;
  title: string;
  position: number;
}

export async function POST(request: NextRequest) {
  const log = getLogger();

  let body: CaptureInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  const magnetSlug = (body.lead_magnet_slug ?? "").trim();
  if (!magnetSlug) {
    return NextResponse.json({ error: "lead_magnet_slug required" }, { status: 400 });
  }

  const locale = LOCALES.has(body.locale ?? "") ? body.locale! : "es";
  const firstname = body.firstname?.trim().slice(0, 80) || null;
  const sourceUtm = body.source_utm?.trim().slice(0, 80) || null;

  const supabase = createServerSupabase();

  // 1. Resolver lead magnet por slug · debe estar published.
  const { data: magnetData, error: magnetErr } = await supabase
    .from("academy_lead_magnets")
    .select("id, module_id, slug, title, description, asset_url, published")
    .eq("slug", magnetSlug)
    .maybeSingle();

  if (magnetErr) {
    log.error({ err: magnetErr, magnetSlug }, "[academy-capture] magnet lookup failed");
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  const magnet = magnetData as LeadMagnetRow | null;
  if (!magnet || !magnet.published) {
    return NextResponse.json(
      { error: "lead magnet not found or not published" },
      { status: 404 }
    );
  }

  // 2. Upsert academy_users por email.
  //    Si existe: reutilizamos id + unsubscribe_token.
  //    Si no: creamos con source derivada del módulo del magnet.
  const sourceTag = magnet.module_id
    ? `leadmagnet_${magnet.module_id.toLowerCase()}`
    : "leadmagnet_unknown";

  const { data: existingUserData } = await supabase
    .from("academy_users")
    .select("id, email, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  let user: AcademyUserRow | null = existingUserData as AcademyUserRow | null;

  if (!user) {
    const newToken = generateUnsubscribeToken();
    const { data: created, error: createErr } = await supabase
      .from("academy_users")
      .insert({
        email,
        locale,
        display_name: firstname,
        source: sourceTag,
        unsubscribe_token: newToken,
      })
      .select("id, email, unsubscribe_token")
      .single();

    if (createErr || !created) {
      log.error({ err: createErr, email }, "[academy-capture] user insert failed");
      return NextResponse.json(
        { error: `user create failed: ${createErr?.message ?? "unknown"}` },
        { status: 500 }
      );
    }
    user = created as AcademyUserRow;
  } else if (!user.unsubscribe_token) {
    // Backfill token si por alguna razón no lo tenía.
    const newToken = generateUnsubscribeToken();
    await supabase
      .from("academy_users")
      .update({ unsubscribe_token: newToken })
      .eq("id", user.id);
    user = { ...user, unsubscribe_token: newToken };
  }

  // 3. Idempotencia · ¿ya capturó este magnet?
  const { data: existingCapture } = await supabase
    .from("academy_lead_captures")
    .select("id, status")
    .eq("email", email)
    .eq("lead_magnet_id", magnet.id)
    .maybeSingle();

  if (existingCapture) {
    return NextResponse.json({
      ok: true,
      capture_id: (existingCapture as { id: string }).id,
      status: "already_exists",
      user_id: user.id,
    });
  }

  // 4. Insert nueva captura.
  const meta: Record<string, unknown> = {};
  if (firstname) meta.firstname = firstname;

  const { data: capData, error: capErr } = await supabase
    .from("academy_lead_captures")
    .insert({
      email,
      lead_magnet_id: magnet.id,
      user_id: user.id,
      source_utm: sourceUtm,
      status: "captured",
      meta,
    })
    .select("id")
    .single();

  if (capErr || !capData) {
    log.error({ err: capErr, email, magnetSlug }, "[academy-capture] capture insert failed");
    return NextResponse.json(
      { error: `capture insert failed: ${capErr?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const captureId = (capData as { id: string }).id;

  // 5. Resolver módulo siguiente para CTA del email.
  let nextModuleTitle = "el próximo módulo de la academia";
  if (magnet.module_id) {
    const { data: currentMod } = await supabase
      .from("academy_modules")
      .select("position")
      .eq("id", magnet.module_id)
      .maybeSingle();

    const currentPosition = (currentMod as ModuleRow | null)?.position;
    if (currentPosition !== undefined) {
      const { data: nextMod } = await supabase
        .from("academy_modules")
        .select("id, title, position")
        .eq("position", currentPosition + 1)
        .maybeSingle();
      const next = nextMod as ModuleRow | null;
      if (next) {
        nextModuleTitle = `${next.id} · ${next.title}`;
      } else {
        // Último módulo: invita a empezar la academia (M1).
        nextModuleTitle = "el inicio de la academia";
      }
    }
  }

  // 6. URL firmada Supabase Storage (1h vigencia) para descarga del asset.
  //    Si falla (bucket no existe / asset_url mal formado / error storage), fallback
  //    seguro a la propia capture page · NUNCA construir URL pública desde
  //    `magnet.asset_url` (riesgo open redirect si admin editara el campo).
  let downloadUrl = `https://darkroomcreative.cloud/academia/lead-magnet/${magnet.slug}`;
  try {
    const [bucket, ...rest] = magnet.asset_url.split("/");
    const objectPath = rest.join("/");
    if (bucket && objectPath) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 3600);
      if (!signErr && signed?.signedUrl) {
        downloadUrl = signed.signedUrl;
      }
    }
  } catch (storageErr) {
    log.warn({ err: storageErr }, "[academy-capture] signed URL fallback to capture page");
  }

  // 7. Enviar email de entrega vía Dark Room mailer (NO PACAME).
  try {
    const rendered = renderLeadMagnetDeliveryEmail({
      firstname,
      magnetTitle: magnet.title,
      magnetDescription: magnet.description,
      magnetDownloadUrl: downloadUrl,
      nextModuleTitle,
      unsubscribeToken: user.unsubscribe_token,
    });

    const messageId = await sendDarkRoomEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: [
        { name: "type", value: "academy_lead_magnet" },
        { name: "magnet_slug", value: magnetSlug },
        { name: "module_id", value: magnet.module_id ?? "unknown" },
      ],
      unsubscribeToken: user.unsubscribe_token,
    });

    if (messageId) {
      await supabase
        .from("academy_lead_captures")
        .update({ status: "delivered", delivered_at: new Date().toISOString() })
        .eq("id", captureId);

      // Increment captured_count en el magnet (best-effort, no bloqueante).
      await supabase.rpc("increment_lead_magnet_count", { magnet_id_in: magnet.id }).then(
        () => {},
        () => {
          // RPC opcional · si no existe ignoramos. Sprint posterior creará la función.
        }
      );
    } else {
      log.warn(
        { captureId, email, magnetSlug },
        "[academy-capture] delivery email returned null"
      );
    }
  } catch (emailErr) {
    log.error(
      { err: emailErr, captureId, email, magnetSlug },
      "[academy-capture] delivery email exception"
    );
    // No rollback · capture queda registrado y cron de retry puede reintentar.
  }

  return NextResponse.json({
    ok: true,
    capture_id: captureId,
    status: "captured",
    user_id: user.id,
  });
}

/** Health check */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "academy-lead-magnet-capture",
    method: "POST",
  });
}

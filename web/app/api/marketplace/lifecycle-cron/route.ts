import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { getLogger } from "@/lib/observability/logger";
import { randomBytes } from "node:crypto";
import { pickVariant, type Variant } from "@/lib/lifecycle/variant-picker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/marketplace/lifecycle-cron
 *
 * Cron diario (11:00) que envia emails lifecycle idempotentes:
 *
 *  - welcome_d0  : al crear client (dia del signup)
 *  - tips_d2     : D+2 desde client.created_at
 *  - nps_d7      : D+7 desde primer delivered order (crea nps_surveys token)
 *  - upsell_d14  : D+14 desde client.created_at (cross-sell guardias a upsell-cron dedicado)
 *  - review_d30  : D+30 desde client.created_at (pide review Google/Trustpilot)
 *
 * Idempotencia via UNIQUE(client_id, email_type) en lifecycle_emails_sent.
 * Cada iteracion procesa maximo 30 clientes por tipo para evitar timeouts.
 */

type EmailType = "welcome_d0" | "tips_d2" | "nps_d7" | "upsell_d14" | "review_d30";

interface ClientRow {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
}

interface OrderRowMin {
  id: string;
  client_id: string | null;
  service_slug: string | null;
  delivered_at: string | null;
}

const BASE_URL = "https://pacameagencia.com";

function firstName(name: string | null, email: string | null): string {
  const fn = (name || "").split(" ")[0]?.trim();
  if (fn) return fn;
  return email ? email.split("@")[0] : "hola";
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

function buildEmail(
  type: EmailType,
  client: ClientRow,
  opts: { npsToken?: string; lastOrderSlug?: string | null } = {}
): { subject: string; body: string; cta?: string; ctaUrl?: string; preheader: string } {
  const name = firstName(client.name, client.email);
  const slug = opts.lastOrderSlug?.replace(/-/g, " ") || "tu proyecto";

  switch (type) {
    case "welcome_d0":
      return {
        subject: `${name}, ya estas dentro de PACAME`,
        preheader: "Tu equipo digital en modo ON. Lo que puedes pedir hoy mismo.",
        body:
          `Hola ${name},\n\n` +
          `Bienvenid@ a PACAME. Desde hoy tienes un equipo digital completo — 10 agentes IA + supervision humana — listo para resolver cualquier cosa que necesites.\n\n` +
          `Para que empieces rapido:\n\n` +
          `1. Entra al dashboard y mira lo que ya tienes disponible.\n` +
          `2. Si tienes una web que mejorar, pide una auditoria gratis aqui abajo.\n` +
          `3. Si no sabes por donde empezar, escribenos y te proponemos 3 cosas concretas.\n\n` +
          `La filosofia: resolver tu problema digital en dias, no en meses. Cobramos por resultado, no por hora.\n\n` +
          `Cualquier cosa, aqui estoy.\n\n` +
          `Pablo Calleja\nFundador PACAME`,
        cta: "Pide tu auditoria gratis",
        ctaUrl: `${BASE_URL}/auditoria?utm_source=lifecycle&utm_campaign=welcome_d0`,
      };

    case "tips_d2":
      return {
        subject: `${name}, 3 cosas que podemos resolver esta semana`,
        preheader: "Ideas concretas para mover la aguja en 7 dias.",
        body:
          `Hola ${name},\n\n` +
          `Llevas un par de dias con nosotros. Para que no te quedes pensando ‘¿y ahora que?’, te dejo 3 cosas que la gente pide cuando entra:\n\n` +
          `1. **Landing 1 pagina (79€)** — hero + CTA + seccion de credibilidad. Lista en 48h.\n` +
          `2. **Auditoria SEO (gratis)** — te decimos en 10 minutos donde estas perdiendo trafico.\n` +
          `3. **Pack 4 posts social (39€)** — un mes de contenido publicable hoy.\n\n` +
          `Si te encaja alguna, responde con un ‘sí’ y lo arrancamos. Si tienes algo distinto en mente, cuéntamelo y vemos.\n\n` +
          `Pablo + equipo PACAME`,
        cta: "Ver marketplace completo",
        ctaUrl: `${BASE_URL}/servicios?utm_source=lifecycle&utm_campaign=tips_d2`,
      };

    case "nps_d7": {
      const token = opts.npsToken || "error";
      return {
        subject: `${name}, ¿como ha ido tu ${slug}?`,
        preheader: "30 segundos — nos ayudas a mejorar.",
        body:
          `Hola ${name},\n\n` +
          `Hace una semana que entregamos tu ${slug}. Nos gustaria saber como ha ido.\n\n` +
          `Solo es 1 click + comentario opcional. Nos sirve para ver que hacemos bien y que podemos mejorar — sin el, lo unico que tenemos son suposiciones.\n\n` +
          `Gracias de antemano.\n\nPablo Calleja`,
        cta: "Responder encuesta (30s)",
        ctaUrl: `${BASE_URL}/nps/${token}`,
      };
    }

    case "upsell_d14":
      return {
        subject: `${name}, siguiente paso tras tus primeras 2 semanas`,
        preheader: "Lo que suele funcionar despues de un primer entregable.",
        body:
          `Hola ${name},\n\n` +
          `Ya tienes 2 semanas con PACAME. El patron que vemos con clientes en tu mismo momento:\n\n` +
          `— Los que cerraron un entregable puntual y pasan a **suscripcion mensual Pro** (99€/mes) multiplican resultados por 3-4x en los siguientes 60 dias.\n` +
          `— El motivo es simple: consistencia. 4 acciones/mes > 1 accion aislada.\n\n` +
          `Te dejo un 15% el primer mes con el codigo **LIFE15** (valido 7 dias).\n\n` +
          `Si te interesa probarlo o quieres que te cuente que incluye el plan, solo responde.\n\n` +
          `Pablo + equipo PACAME`,
        cta: "Ver planes mensuales",
        ctaUrl: `${BASE_URL}/planes?code=LIFE15&utm_source=lifecycle&utm_campaign=upsell_d14`,
      };

    case "review_d30":
      return {
        subject: `${name}, ¿30 segundos para dejarnos una review?`,
        preheader: "Si te ha gustado, ayudanos a que mas gente lo sepa.",
        body:
          `Hola ${name},\n\n` +
          `Hoy hace un mes que estas con nosotros. Si todo ha ido bien (esperamos que si), una review publica nos cambia la vida.\n\n` +
          `Los clientes nuevos se fian mas de lo que dice otro cliente que de lo que digamos nosotros. Asi que si tienes 30 segundos:\n\n` +
          `1. **Google** — el que mas nos ayuda para SEO local.\n` +
          `2. **LinkedIn** — si estas activo ahi.\n\n` +
          `Si hay algo que podemos hacer mejor, tambien queremos escucharlo — respondeme a este email directamente.\n\n` +
          `Gracias por confiar, ${name}.\n\nPablo Calleja`,
        cta: "Dejar review Google",
        ctaUrl: `${BASE_URL}/review?utm_source=lifecycle&utm_campaign=review_d30`,
      };
  }
}

/**
 * Para un cliente + tipo, calcula si toca enviar.
 * Retorna { shouldSend, reason, extra } — extra incluye npsToken o lastOrderSlug.
 */
async function evaluate(
  supabase: ReturnType<typeof createServerSupabase>,
  client: ClientRow,
  type: EmailType
): Promise<{ shouldSend: boolean; reason: string; extra?: { npsToken?: string; lastOrderSlug?: string | null; orderId?: string } }> {
  const createdMs = new Date(client.created_at).getTime();
  const now = Date.now();
  const ageDays = Math.floor((now - createdMs) / (24 * 60 * 60 * 1000));

  switch (type) {
    case "welcome_d0":
      if (ageDays !== 0) return { shouldSend: false, reason: `age=${ageDays}` };
      return { shouldSend: true, reason: "d0" };

    case "tips_d2":
      if (ageDays < 2 || ageDays > 4) return { shouldSend: false, reason: `age=${ageDays} out of [2,4]` };
      return { shouldSend: true, reason: "d2" };

    case "nps_d7": {
      // Busca primer delivered order >= 7 dias
      const sevenAgo = daysAgo(7);
      const { data } = await supabase
        .from("orders")
        .select("id, service_slug, delivered_at")
        .eq("client_id", client.id)
        .eq("status", "delivered")
        .lt("delivered_at", sevenAgo)
        .order("delivered_at", { ascending: true })
        .limit(1);
      const order = (data || [])[0] as OrderRowMin | undefined;
      if (!order) return { shouldSend: false, reason: "no delivered order D+7" };
      const token = `nps_${randomBytes(12).toString("hex")}`;
      return {
        shouldSend: true,
        reason: "delivered_d7",
        extra: { npsToken: token, lastOrderSlug: order.service_slug, orderId: order.id },
      };
    }

    case "upsell_d14":
      if (ageDays < 14 || ageDays > 18) return { shouldSend: false, reason: `age=${ageDays}` };
      return { shouldSend: true, reason: "d14" };

    case "review_d30":
      if (ageDays < 30 || ageDays > 35) return { shouldSend: false, reason: `age=${ageDays}` };
      return { shouldSend: true, reason: "d30" };
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const log = getLogger();
  const supabase = createServerSupabase();
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const onlyType = url.searchParams.get("type") as EmailType | null;

  const types: EmailType[] = onlyType
    ? [onlyType]
    : ["welcome_d0", "tips_d2", "nps_d7", "upsell_d14", "review_d30"];

  // Ventana maxima de candidatos: clientes creados en los ultimos 40 dias
  const fortyAgo = daysAgo(40);
  const { data: clientsRaw, error: cErr } = await supabase
    .from("clients")
    .select("id, name, email, created_at")
    .gt("created_at", fortyAgo)
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (cErr) {
    log.error({ err: cErr }, "[lifecycle-cron] clients query fallo");
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }

  const clients = (clientsRaw || []) as ClientRow[];

  // Load active variants una vez por ciclo — agrupar por email_type
  const { data: variantsRaw } = await supabase
    .from("lifecycle_variants")
    .select("email_type, variant_key, subject, preheader, weight, is_active")
    .eq("is_active", true);
  const variantsByType = new Map<EmailType, Variant[]>();
  for (const v of (variantsRaw || []) as (Variant & { email_type: EmailType })[]) {
    const arr = variantsByType.get(v.email_type) || [];
    arr.push(v);
    variantsByType.set(v.email_type, arr);
  }

  const summary: Record<EmailType, { candidates: number; sent: number; skipped: number }> = {
    welcome_d0: { candidates: 0, sent: 0, skipped: 0 },
    tips_d2: { candidates: 0, sent: 0, skipped: 0 },
    nps_d7: { candidates: 0, sent: 0, skipped: 0 },
    upsell_d14: { candidates: 0, sent: 0, skipped: 0 },
    review_d30: { candidates: 0, sent: 0, skipped: 0 },
  };

  for (const type of types) {
    // Lookup los que ya recibieron este tipo (idempotencia)
    const clientIds = clients.map((c) => c.id);
    if (!clientIds.length) continue;

    const { data: already } = await supabase
      .from("lifecycle_emails_sent")
      .select("client_id")
      .eq("email_type", type)
      .in("client_id", clientIds);
    const sentSet = new Set((already || []).map((r) => r.client_id as string));

    const pending = clients.filter((c) => !sentSet.has(c.id));
    let processed = 0;

    for (const client of pending) {
      if (processed >= 30) break; // cap por tipo/ciclo
      const evaluation = await evaluate(supabase, client, type);
      if (!evaluation.shouldSend) {
        summary[type].skipped++;
        continue;
      }
      summary[type].candidates++;
      if (dryRun) {
        log.info(
          { clientId: client.id, type, reason: evaluation.reason },
          "[lifecycle-cron] DRY would send"
        );
        continue;
      }

      const email = buildEmail(type, client, evaluation.extra);
      if (!client.email) continue;

      // A/B variant: si hay variants activas para este tipo, override subject/preheader
      const variants = variantsByType.get(type) || [];
      const picked = variants.length > 0 ? pickVariant(variants, client.id, type) : null;
      const subjectToSend = picked?.subject || email.subject;
      const preheaderToSend = picked?.preheader || email.preheader;
      const variantKey = picked?.variant_key || null;

      const html = wrapEmailTemplate(email.body, {
        cta: email.cta,
        ctaUrl: email.ctaUrl,
        preheader: preheaderToSend,
      });

      try {
        const resendId = await sendEmail({
          to: client.email,
          subject: subjectToSend,
          html,
          tags: [
            { name: "type", value: "lifecycle" },
            { name: "lifecycle_type", value: type },
            { name: "client_id", value: client.id },
            ...(variantKey ? [{ name: "variant", value: variantKey }] : []),
          ],
        });

        // Insert idempotencia (UNIQUE client_id+type -> si falla por conflict, descartamos)
        const { error: insErr } = await supabase.from("lifecycle_emails_sent").insert({
          client_id: client.id,
          email_type: type,
          trigger_event: evaluation.reason,
          resend_email_id: resendId,
          variant_key: variantKey,
        });
        if (insErr && !/duplicate|unique/i.test(insErr.message)) {
          log.error({ err: insErr, clientId: client.id, type }, "[lifecycle-cron] insert fallo");
        }

        // Si es NPS, registra el token tambien en nps_surveys
        if (type === "nps_d7" && evaluation.extra?.npsToken) {
          await supabase.from("nps_surveys").insert({
            token: evaluation.extra.npsToken,
            client_id: client.id,
            client_email_snapshot: client.email,
            context: {
              source: "lifecycle_d7",
              order_id: evaluation.extra.orderId || null,
              order_slug: evaluation.extra.lastOrderSlug || null,
            },
          });
        }

        summary[type].sent++;
        processed++;
      } catch (err) {
        log.error({ err, clientId: client.id, type }, "[lifecycle-cron] send fallo");
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    clients_window: clients.length,
    summary,
  });
}

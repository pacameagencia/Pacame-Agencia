/**
 * Drip emails de PACAME GPT.
 *
 * Eventos:
 *   trial_day_12 — al 12º día desde signup, si user sigue trialing.
 *                  Mensaje: "Te quedan 2 días. ¿Te está sirviendo?"
 *   trial_day_14 — el día que vence el trial (o el siguiente).
 *                  Mensaje: "Trial terminado. Pasa a Premium o sigues gratis."
 *
 * Cada envío inserta en pacame_gpt_drip_log para no duplicar (PK user+kind).
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";

export type DripKind = "trial_day_12" | "trial_day_14";

export interface DripCandidate {
  user_id: string;
  email: string;
  full_name: string | null;
  trial_ends_at: string;
  status: string;
}

export interface DripResult {
  scanned: number;
  sent: number;
  skipped_already_sent: number;
  failed: number;
}

/**
 * Encuentra users PACAME GPT que están a 2 días de fin de trial (kind=trial_day_12)
 * o cuyo trial ya venció pero aún no recibieron el email_day_14.
 */
async function findCandidates(kind: DripKind): Promise<DripCandidate[]> {
  const supabase = createServerSupabase();
  const now = Date.now();
  const day = 24 * 3600 * 1000;

  // Ventana objetivo
  let lo: number;
  let hi: number;
  let expectedStatus: string[];
  if (kind === "trial_day_12") {
    // trial_ends_at en (now + 1d, now + 3d) — barre el día 12 y 13
    lo = now + 1 * day;
    hi = now + 3 * day;
    expectedStatus = ["trialing"];
  } else {
    // trial_day_14: trial vencido en las últimas 36h
    lo = now - 36 * 3600 * 1000;
    hi = now + 1 * day;
    expectedStatus = ["trialing", "past_due", "canceled"];
  }

  const { data, error } = await supabase
    .from("pacame_product_subscriptions")
    .select(`
      user_id, status, trial_ends_at,
      pacame_product_users!inner(email, full_name)
    `)
    .eq("product_id", "pacame-gpt")
    .in("status", expectedStatus)
    .gte("trial_ends_at", new Date(lo).toISOString())
    .lte("trial_ends_at", new Date(hi).toISOString())
    .limit(200);

  if (error || !data) return [];

  return data
    .map((r: any) => ({
      user_id: r.user_id,
      email: r.pacame_product_users?.email || "",
      full_name: r.pacame_product_users?.full_name || null,
      trial_ends_at: r.trial_ends_at,
      status: r.status,
    }))
    .filter((c) => !!c.email);
}

async function alreadySent(userId: string, kind: DripKind): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("pacame_gpt_drip_log")
    .select("user_id")
    .eq("user_id", userId)
    .eq("drip_kind", kind)
    .maybeSingle();
  return !!data;
}

async function recordSent(userId: string, kind: DripKind): Promise<void> {
  // En carrera: si ya existe (otro cron paralelo), el conflict UNIQUE manda
  // un error que ignoramos — el `await` ya captura el rejection si lo hay.
  try {
    const supabase = createServerSupabase();
    await supabase
      .from("pacame_gpt_drip_log")
      .insert({ user_id: userId, drip_kind: kind });
  } catch {
    // ignore
  }
}

export async function runDrip(kind: DripKind): Promise<DripResult> {
  const candidates = await findCandidates(kind);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of candidates) {
    if (await alreadySent(c.user_id, kind)) {
      skipped++;
      continue;
    }
    try {
      const id = await sendEmail({
        to: c.email,
        subject: subjectFor(kind, c),
        html: htmlFor(kind, c),
        text: textFor(kind, c),
        tags: [
          { name: "product", value: "pacame-gpt" },
          { name: "kind", value: kind },
        ],
      });
      if (!id) throw new Error("resend_returned_null");
      await recordSent(c.user_id, kind);
      sent++;
    } catch {
      failed++;
    }
  }
  return { scanned: candidates.length, sent, skipped_already_sent: skipped, failed };
}

function firstName(full: string | null, email: string): string {
  return (full?.split(" ")[0] || email.split("@")[0]).trim();
}

function subjectFor(kind: DripKind, c: DripCandidate): string {
  const name = firstName(c.full_name, c.email);
  if (kind === "trial_day_12") {
    return `${name}, te quedan 2 días con Lucía 🙌`;
  }
  return `Tu trial de Lucía ha terminado. ¿Sigues con nosotros?`;
}

function textFor(kind: DripKind, c: DripCandidate): string {
  const name = firstName(c.full_name, c.email);
  if (kind === "trial_day_12") {
    return `Hola ${name},

Te quedan 2 días de trial gratis ilimitado con Lucía. Después puedes:
- Pasar a Premium (9,90€/mes con factura española) → ilimitado
- Seguir gratis → 20 mensajes al día

¿Te ha servido? Cualquier feedback me llega contestando este email — Pablo lo lee.

Volver a Lucía: https://pacameagencia.com/pacame-gpt
Pasar a Premium: https://pacameagencia.com/pacame-gpt/cuenta`;
  }
  return `Hola ${name},

Tu trial de Lucía ha terminado. A partir de ahora:
- Sigues con la versión gratis: 20 mensajes al día
- O te pasas a Premium por 9,90€/mes con factura española

Si quieres seguir ilimitado, en 1 minuto te quedas suscrito:
https://pacameagencia.com/pacame-gpt/cuenta

Si prefieres seguir gratis, no tienes que hacer nada.

Gracias por probar Lucía 👋`;
}

function htmlFor(kind: DripKind, c: DripCandidate): string {
  const name = firstName(c.full_name, c.email);
  const ctaHref =
    kind === "trial_day_12"
      ? "https://pacameagencia.com/pacame-gpt"
      : "https://pacameagencia.com/pacame-gpt/cuenta";
  const ctaLabel = kind === "trial_day_12" ? "Volver a Lucía" : "Pasar a Premium";
  const lead =
    kind === "trial_day_12"
      ? "Te quedan 2 días de trial ilimitado. Después puedes seguir gratis con 20 mensajes/día o pasarte a Premium (9,90€/mes con factura)."
      : "Tu trial ha terminado. A partir de hoy, 20 mensajes/día gratis. Si quieres seguir ilimitado, te suscribes en 1 minuto.";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="background:#f4efe3;color:#1a1813;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid #e8e3d0;margin-bottom:18px;">
      <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#b54e30,#e8b730);color:#f4efe3;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-family:Georgia,serif;font-size:19px;">L</div>
      <div>
        <div style="font-weight:600;font-size:16px;font-family:Georgia,serif;">Hola ${escapeHtml(name)} 👋</div>
        <div style="color:#6e6858;font-size:12px;">Lucía · PACAME GPT</div>
      </div>
    </div>
    <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">${escapeHtml(lead)}</p>
    <p style="font-size:14px;color:#3a362c;line-height:1.55;margin:0 0 22px;">
      ${kind === "trial_day_12"
        ? "Si te ha servido, contestar a este email vale — leo todo. Y si quieres seguir ilimitado sin pelearte con tarjetas extranjeras ni inglés a medias, Premium son 9,90€/mes con factura española deducible."
        : "Si quieres seguir ilimitado: 9,90€/mes, factura ES, te das de baja cuando quieras. Si prefieres gratis, no tienes que hacer nada — sigues con 20/día sin caducidad."}
    </p>
    <div style="text-align:center;margin:24px 0 6px;">
      <a href="${ctaHref}" style="background:#1a1813;color:#f4efe3;padding:14px 26px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
        ${escapeHtml(ctaLabel)} →
      </a>
    </div>
    <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e8e3d0;color:#6e6858;font-size:12px;text-align:center;">
      PACAME GPT, hecho en España · <a href="https://pacameagencia.com/lucia" style="color:#9c3e24;">pacameagencia.com/lucia</a>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

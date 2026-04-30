/**
 * Dark Room · 5 templates de la cadencia de emails post-captura del lead magnet
 * "Stack del Creator 2026". Paleta verde ácido `#CFFF00` + bg `#0A0A0A`,
 * tono cómplice/honesto, frases cortas, números concretos.
 *
 * Especificación: `strategy/darkroom/lead-magnet-stack-creator-2026.md` §emails.
 *
 * From: `Pablo @ DarkRoom <support@darkroomcreative.cloud>` (único buzón real
 * según memoria `reference_dark_room_mailboxes`).
 */

const NOTION_URL = "https://darkroomcreative.cloud/stack-creator-2026";
const SITE_URL = "https://darkroomcreative.cloud";
const TRIAL_URL = "https://darkroomcreative.cloud/trial";
const LIFETIME_URL = "https://darkroomcreative.cloud/lifetime";
const FROM_EMAIL = "Pablo @ DarkRoom <support@darkroomcreative.cloud>";

export interface DarkRoomEmailContext {
  firstname?: string | null;
  source_utm?: string | null;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  from: string;
}

/** Paleta + estructura visual canónica Dark Room para emails. */
function wrapDarkRoom(opts: {
  preheader: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
}): string {
  const cta = opts.ctaText && opts.ctaUrl
    ? `<div style="margin:32px 0;text-align:center">
        <a href="${opts.ctaUrl}"
           style="display:inline-block;background:#CFFF00;color:#0A0A0A;padding:14px 32px;
                  border-radius:6px;text-decoration:none;font-weight:700;
                  font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;
                  font-size:15px;letter-spacing:0.3px">
          ${opts.ctaText}
        </a>
       </div>`
    : "";

  const cta2 = opts.ctaSecondaryText && opts.ctaSecondaryUrl
    ? `<div style="margin:8px 0 24px;text-align:center">
        <a href="${opts.ctaSecondaryUrl}"
           style="color:#CFFF00;text-decoration:underline;font-size:13px;
                  font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif">
          ${opts.ctaSecondaryText}
        </a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>DarkRoom</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;color:transparent">${opts.preheader}</span>
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-family:'Anton','Impact',sans-serif;font-size:28px;letter-spacing:2px;color:#CFFF00">
      DARKROOM
    </div>
    <div style="color:#666;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:4px">
      Group buy legal · 12 herramientas IA
    </div>
  </div>
  <div style="background:#141414;border:1px solid rgba(207,255,0,0.12);border-radius:8px;
              padding:32px;color:#E6E6E6;font-size:15px;line-height:1.7">
    ${opts.bodyHtml}
    ${cta}
    ${cta2}
  </div>
  <div style="text-align:center;margin-top:24px;color:#555;font-size:12px;line-height:1.6;
              font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif">
    <p style="margin:4px 0">DarkRoom · Pablo Calleja</p>
    <p style="margin:4px 0">
      <a href="${SITE_URL}" style="color:#CFFF00;text-decoration:none">darkroomcreative.cloud</a>
      &nbsp;·&nbsp;
      <a href="mailto:support@darkroomcreative.cloud" style="color:#CFFF00;text-decoration:none">support@darkroomcreative.cloud</a>
    </p>
    <p style="margin:12px 0 4px;color:#444;font-size:11px">
      ¿No quieres recibir más?
      <a href="${SITE_URL}/unsubscribe" style="color:#666">Date de baja</a>.
    </p>
  </div>
</div>
</body>
</html>`;
}

function greeting(firstname?: string | null): string {
  if (!firstname || firstname.trim().length === 0) return "Hey,";
  return `Hey ${firstname.trim()},`;
}

// ─── Email 0 · día 0 · entrega + bienvenida ─────────────────────────

export function renderEmail0(ctx: DarkRoomEmailContext): RenderedEmail {
  const subject = "Tu Stack del Creator 2026 está aquí";
  const preheader = "12 herramientas IA · lo que pago al mes · lo que ahorra";
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">${greeting(ctx.firstname)}</p>

<p style="margin:0 0 16px">
  Aquí está. <strong style="color:#CFFF00">12 herramientas IA</strong>.
  Lo que pago al mes. Lo que ahorra.
</p>

<p style="margin:0 0 8px">
  → <a href="${NOTION_URL}" style="color:#CFFF00">Stack completo en Notion</a>
</p>
<p style="margin:0 0 16px">
  → <a href="${NOTION_URL}/pdf" style="color:#CFFF00">Descargar PDF</a>
</p>

<p style="margin:16px 0">
  Honesto: si te interesa montar el stack completo sin pagar 308€/mes,
  mi proyecto se llama <strong style="color:#CFFF00">DarkRoom</strong>.
  24,90€/mes. 14 días gratis. Sin tarjeta.
</p>

<p style="margin:0 0 16px;color:#888;font-size:13px">
  En 2 días te mando algo más. Cómo monté esto sin tirar de gurú-marketing.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "EMPEZAR 14 DÍAS GRATIS",
      ctaUrl: TRIAL_URL,
    }),
    text: `${greeting(ctx.firstname)}

Aquí está. 12 herramientas IA. Lo que pago al mes. Lo que ahorra.

Stack en Notion: ${NOTION_URL}
PDF descarga: ${NOTION_URL}/pdf

Honesto: si te interesa montar el stack completo sin pagar 308€/mes, mi proyecto se llama DarkRoom. 24,90€/mes. 14 días gratis. Sin tarjeta.

→ ${TRIAL_URL}

En 2 días te mando algo más. Cómo monté esto sin tirar de gurú-marketing.

— Pablo`,
  };
}

// ─── Email 2 · día 2 · storytelling ─────────────────────────────────

export function renderEmail2(ctx: DarkRoomEmailContext): RenderedEmail {
  const subject = "Cómo monté DarkRoom · 0 → ✓";
  const preheader = "Pagaba 280€/mes en suscripciones. Decidí hacerlo bien.";
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">${greeting(ctx.firstname)}</p>

<p style="margin:0 0 16px">
  Hace 8 meses pagaba <strong>280€/mes</strong> en suscripciones IA.
  ChatGPT Plus, Claude Pro, Midjourney, Canva, CapCut, Eleven Labs, Minea, PiPiAds.
  Como creator solo. Sin agencia detrás.
</p>

<p style="margin:0 0 16px">
  Vi el modelo group buy hispano cutre · cuentas pirateadas · soporte en
  WhatsApp · sin marca · sin garantías. Imposible recomendar a nadie.
</p>

<p style="margin:0 0 16px">
  Decidí hacer una versión bien hecha:
</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#CFFF00">
  <li style="margin:6px 0">Group buy <strong>legal</strong> (acuerdo colectivo)</li>
  <li style="margin:6px 0">Soporte humano en español, 24/7</li>
  <li style="margin:6px 0">Marca, web, términos. Punto.</li>
</ul>

<p style="margin:0 0 16px">
  Hoy <strong style="color:#CFFF00">100+ creators</strong> lo usan a diario.
  Cuesta 24,90€/mes. Es el mismo stack que el Notion que te he mandado.
</p>

<p style="margin:16px 0;color:#888;font-size:13px">
  Si quieres probarlo · 14 días gratis · sin tarjeta.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "PROBAR DARKROOM 14 DÍAS",
      ctaUrl: TRIAL_URL,
    }),
    text: `${greeting(ctx.firstname)}

Hace 8 meses pagaba 280€/mes en suscripciones IA. ChatGPT Plus, Claude Pro, Midjourney, Canva, CapCut, ElevenLabs, Minea, PiPiAds. Como creator solo. Sin agencia detrás.

Vi el modelo group buy hispano cutre · cuentas pirateadas · soporte en WhatsApp · sin marca · sin garantías. Imposible recomendar a nadie.

Decidí hacer una versión bien hecha:
- Group buy legal (acuerdo colectivo)
- Soporte humano en español, 24/7
- Marca, web, términos. Punto.

Hoy 100+ creators lo usan a diario. Cuesta 24,90€/mes. Es el mismo stack del Notion.

→ Probar 14 días gratis: ${TRIAL_URL}

— Pablo`,
  };
}

// ─── Email 4 · día 4 · comparativa cruda ────────────────────────────

export function renderEmail4(ctx: DarkRoomEmailContext): RenderedEmail {
  const subject = "308€ vs 24,90€ · math, no marketing";
  const preheader = "El stack completo, pieza a pieza. Por qué cuesta lo que cuesta.";
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">${greeting(ctx.firstname)}</p>

<p style="margin:0 0 16px">
  Math directo. Sin embellecer.
</p>

<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-family:'JetBrains Mono',monospace;font-size:13px">
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">ChatGPT Plus</td><td style="padding:6px 0;text-align:right">22,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Claude Pro</td><td style="padding:6px 0;text-align:right">22,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Gemini Advanced</td><td style="padding:6px 0;text-align:right">22,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Canva Pro</td><td style="padding:6px 0;text-align:right">12,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">CapCut Pro</td><td style="padding:6px 0;text-align:right">8,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Freepik Premium+</td><td style="padding:6px 0;text-align:right">22,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Higgsfield</td><td style="padding:6px 0;text-align:right">29,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">ElevenLabs</td><td style="padding:6px 0;text-align:right">22,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Minea</td><td style="padding:6px 0;text-align:right">39,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Dropsip.io</td><td style="padding:6px 0;text-align:right">29,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">PiPiAds</td><td style="padding:6px 0;text-align:right">38,00€</td></tr>
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><td style="padding:6px 0">Seedance</td><td style="padding:6px 0;text-align:right">43,00€</td></tr>
  <tr style="border-top:2px solid #CFFF00;font-weight:700"><td style="padding:10px 0">RETAIL TOTAL</td><td style="padding:10px 0;text-align:right">308,00€</td></tr>
  <tr style="background:rgba(207,255,0,0.08);font-weight:700"><td style="padding:10px 0;color:#CFFF00">DARKROOM PRO</td><td style="padding:10px 0;text-align:right;color:#CFFF00">24,90€</td></tr>
</table>

<p style="margin:0 0 16px">
  Por qué cuesta tan poco · acuerdo colectivo + 50 personas comparten = el
  precio se prorratea. Es group buy <strong>legal</strong>. No es piratería.
  No es revender cuentas. Es un acuerdo escrito con los proveedores.
</p>

<p style="margin:0 0 16px;color:#FF3B3B;font-weight:600">
  Ahorras 283€ al mes. 3.396€ al año.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "VER PLANES · 14 DÍAS GRATIS",
      ctaUrl: TRIAL_URL,
    }),
    text: `${greeting(ctx.firstname)}

Math directo. Sin embellecer.

ChatGPT Plus 22€ + Claude Pro 22€ + Gemini Advanced 22€ + Canva Pro 12€ + CapCut Pro 8€ + Freepik Premium+ 22€ + Higgsfield 29€ + ElevenLabs 22€ + Minea 39€ + Dropsip.io 29€ + PiPiAds 38€ + Seedance 43€ = 308€/mes retail.

DarkRoom Pro: 24,90€/mes. Mismo stack.

Por qué cuesta tan poco · acuerdo colectivo + 50 personas comparten = el precio se prorratea. Es group buy legal. No es piratería. No es revender cuentas.

Ahorras 283€/mes. 3.396€/año.

→ ${TRIAL_URL}

— Pablo`,
  };
}

// ─── Email 7 · día 7 · oferta directa ───────────────────────────────

export function renderEmail7(ctx: DarkRoomEmailContext): RenderedEmail {
  const subject = "Es ahora · 14 días gratis";
  const preheader = "Si esto va contigo, empieza el trial. Si no, no te molesto más.";
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">${greeting(ctx.firstname)}</p>

<p style="margin:0 0 16px">
  Han pasado 7 días.
</p>

<p style="margin:0 0 16px">
  Si esto va contigo · empieza el trial. <strong>14 días gratis</strong>.
  Sin tarjeta. Sin compromiso. Cancelas cuando quieras.
</p>

<p style="margin:0 0 16px">
  Si no · no te molesto más con esto.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "EMPEZAR TRIAL · 14 DÍAS GRATIS",
      ctaUrl: TRIAL_URL,
    }),
    text: `${greeting(ctx.firstname)}

Han pasado 7 días.

Si esto va contigo · empieza el trial. 14 días gratis. Sin tarjeta. Sin compromiso. Cancelas cuando quieras.

Si no · no te molesto más con esto.

→ ${TRIAL_URL}

— Pablo`,
  };
}

// ─── Email 14 · día 14 · Lifetime drop ──────────────────────────────

export function renderEmail14(ctx: DarkRoomEmailContext): RenderedEmail {
  const subject = "Lifetime 349€ · quedan plazas este mes";
  const preheader = "Pago único. Acceso de por vida. Amortiza en 35 días.";
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">${greeting(ctx.firstname)}</p>

<p style="margin:0 0 16px">
  Última cosa.
</p>

<p style="margin:0 0 16px">
  <strong style="color:#CFFF00">Lifetime DarkRoom · 349€</strong>.
  Pago único. Acceso al stack completo · de por vida.
</p>

<p style="margin:0 0 16px;color:#888">
  Math: amortiza en 35 días vs retail (308€/mes).<br>
  Math: amortiza en 14 meses vs Pro (24,90€/mes).<br>
  Después de eso · 0€ para siempre.
</p>

<p style="margin:0 0 16px;color:#FF3B3B;font-weight:600">
  Solo este mes · plazas limitadas para no romper el modelo colectivo.
</p>

<p style="margin:0 0 16px">
  Si lo dejas pasar · sin drama. Volvemos a 24,90€/mes Pro normal.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "LIFETIME · 349€",
      ctaUrl: LIFETIME_URL,
      ctaSecondaryText: "O empezar Pro 24,90€/mes",
      ctaSecondaryUrl: TRIAL_URL,
    }),
    text: `${greeting(ctx.firstname)}

Última cosa.

Lifetime DarkRoom · 349€. Pago único. Acceso al stack completo de por vida.

Math: amortiza en 35 días vs retail (308€/mes).
Math: amortiza en 14 meses vs Pro (24,90€/mes).
Después de eso · 0€ para siempre.

Solo este mes · plazas limitadas para no romper el modelo colectivo.

Si lo dejas pasar · sin drama. Volvemos a 24,90€/mes Pro normal.

→ Lifetime: ${LIFETIME_URL}
→ Pro 24,90€/mes: ${TRIAL_URL}

— Pablo`,
  };
}

// ─── Mapeo step → renderer ──────────────────────────────────────────

export type LeadEmailStep = 0 | 1 | 2 | 3 | 4;

export function renderEmailForStep(
  step: LeadEmailStep,
  ctx: DarkRoomEmailContext
): RenderedEmail {
  switch (step) {
    case 0: return renderEmail0(ctx);
    case 1: return renderEmail2(ctx);
    case 2: return renderEmail4(ctx);
    case 3: return renderEmail7(ctx);
    case 4: return renderEmail14(ctx);
  }
}

/** Días desde captured_at en los que toca enviar el email_step. */
export const STEP_DAYS_OFFSET: Record<LeadEmailStep, number> = {
  0: 0,
  1: 2,
  2: 4,
  3: 7,
  4: 14,
};

// ────────────────────────────────────────────────────────────────────
// ─── Dark Room Crew · templates afiliados ───────────────────────────
// ────────────────────────────────────────────────────────────────────

import { TIERS, type TierKey } from "./crew-tiers";

const CREW_DASHBOARD_BASE = `${SITE_URL}/crew/dashboard`;
const CREW_LANDING = `${SITE_URL}/crew`;

interface WelcomeCrewCtx {
  name: string;
  code: string;
  dashboardUrl: string;
}

export function renderWelcomeCrew(ctx: WelcomeCrewCtx): RenderedEmail {
  const subject = "Bienvenido a DarkRoom Crew · tu code está listo";
  const preheader = `Tu link: ${SITE_URL}?ref=${ctx.code}. Trae a tu gente. Sube de rango. Cobra cada mes.`;
  const tiersTable = TIERS.map(
    (t) =>
      `<tr>
        <td style="padding:6px 8px">${t.emoji} ${t.label}</td>
        <td style="padding:6px 8px">${t.refsMin}${t.refsMax === null ? "+" : `-${t.refsMax}`}</td>
        <td style="padding:6px 8px">${(t.oneTimeCents / 100).toFixed(0)}€</td>
        <td style="padding:6px 8px">${(t.recurringCents / 100).toFixed(0)}€/ref/mes</td>
      </tr>`
  ).join("");
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">Hey ${ctx.name},</p>

<p style="margin:0 0 16px">
  Estás dentro de <strong style="color:#CFFF00">DarkRoom Crew</strong>.
  Tu code:
</p>

<div style="margin:16px 0;padding:14px;background:#0A0A0A;border:1px dashed #CFFF00;
            border-radius:6px;text-align:center;font-family:'JetBrains Mono',monospace;
            font-size:18px;color:#CFFF00;letter-spacing:1px">
  ${ctx.code}
</div>

<p style="margin:0 0 16px">
  Tu link para compartir:
</p>

<div style="margin:0 0 16px;padding:12px;background:#0A0A0A;border-radius:6px;
            font-family:'JetBrains Mono',monospace;font-size:13px;color:#E6E6E6;
            word-break:break-all">
  ${SITE_URL}?ref=${ctx.code}
</div>

<p style="margin:16px 0 8px;color:#FFF;font-weight:600">Cómo funciona:</p>

<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13px">
  <thead>
    <tr style="border-bottom:1px solid rgba(207,255,0,0.2);color:#CFFF00">
      <th style="padding:6px 8px;text-align:left">Rango</th>
      <th style="padding:6px 8px;text-align:left">Refs</th>
      <th style="padding:6px 8px;text-align:left">Único</th>
      <th style="padding:6px 8px;text-align:left">Recurrente</th>
    </tr>
  </thead>
  <tbody>${tiersTable}</tbody>
</table>

<p style="margin:0 0 16px;color:#888;font-size:13px">
  Subes de rango → todos tus refs activos pasan al rate del nuevo rango (motivador máximo).
  Pago día 5 vía PayPal/SEPA. Mínimo 50€ acumulado.
</p>

<p style="margin:0 0 16px">
  Tu panel personal en cualquier momento:
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "VER MI PANEL",
      ctaUrl: ctx.dashboardUrl,
      ctaSecondaryText: "Tabla completa de rangos",
      ctaSecondaryUrl: CREW_LANDING,
    }),
    text: `Hey ${ctx.name},

Estás dentro de DarkRoom Crew. Tu code: ${ctx.code}

Tu link: ${SITE_URL}?ref=${ctx.code}

Cómo funciona:
- 🎬 Init (1-10 refs): 5€ único + 1€/ref/mes
- 🎞️ Active (11-20): 6€ + 2€/ref/mes
- 🎥 Pro (21-30): 7€ + 3€/ref/mes
- 📽️ Director (31-40): 8€ + 4€/ref/mes
- 🎟️ Producer (41-50): 9€ + 5€/ref/mes
- 🌟 TOP (51+): 10€ + 5€/ref/mes (TOPE)

Subes de rango → todos tus refs activos pasan al rate del nuevo rango.
Pago día 5 PayPal/SEPA. Mín 50€ acumulado.

Tu panel: ${ctx.dashboardUrl}

— Pablo`,
  };
}

interface TierUpCtx {
  name: string;
  oldTier: TierKey;
  newTier: TierKey;
  refsActive: number;
  dashboardUrl: string;
}

export function renderTierUp(ctx: TierUpCtx): RenderedEmail {
  const oldT = TIERS.find((t) => t.key === ctx.oldTier);
  const newT = TIERS.find((t) => t.key === ctx.newTier);
  if (!oldT || !newT) throw new Error("invalid tier in renderTierUp");
  const subject = `Subiste a ${newT.emoji} ${newT.label} · todos tus refs al nuevo rate`;
  const preheader = `Ahora ${(newT.recurringCents / 100).toFixed(0)}€/ref/mes × ${ctx.refsActive} refs activos.`;
  const monthlyOld = ctx.refsActive * oldT.recurringCents;
  const monthlyNew = ctx.refsActive * newT.recurringCents;
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">Hey ${ctx.name},</p>

<p style="margin:0 0 16px">
  ${oldT.emoji} ${oldT.label} → <strong style="color:#CFFF00">${newT.emoji} ${newT.label}</strong>.
</p>

<p style="margin:0 0 16px">
  Tienes <strong>${ctx.refsActive} refs activos</strong>.
  Desde el próximo cobro mensual, todos pasan al rate del nuevo rango.
</p>

<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px">
  <tr style="border-bottom:1px solid rgba(255,255,255,0.06)">
    <td style="padding:8px 0;color:#888">Antes</td>
    <td style="padding:8px 0;text-align:right">
      ${ctx.refsActive} × ${(oldT.recurringCents / 100).toFixed(0)}€ = <strong>${(monthlyOld / 100).toFixed(0)}€/mes</strong>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;color:#CFFF00;font-weight:600">Ahora</td>
    <td style="padding:8px 0;text-align:right;color:#CFFF00;font-weight:600">
      ${ctx.refsActive} × ${(newT.recurringCents / 100).toFixed(0)}€ = ${(monthlyNew / 100).toFixed(0)}€/mes
    </td>
  </tr>
</table>

<p style="margin:0 0 16px;color:#888;font-size:13px">
  Y tu próximo ref one-time pasa a <strong>${(newT.oneTimeCents / 100).toFixed(0)}€</strong>.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "VER MI PANEL",
      ctaUrl: ctx.dashboardUrl,
    }),
    text: `Hey ${ctx.name},

${oldT.emoji} ${oldT.label} → ${newT.emoji} ${newT.label}.

Tienes ${ctx.refsActive} refs activos. Desde el próximo cobro mensual:

Antes: ${ctx.refsActive} × ${(oldT.recurringCents / 100).toFixed(0)}€ = ${(monthlyOld / 100).toFixed(0)}€/mes
Ahora: ${ctx.refsActive} × ${(newT.recurringCents / 100).toFixed(0)}€ = ${(monthlyNew / 100).toFixed(0)}€/mes

Tu próximo ref one-time pasa a ${(newT.oneTimeCents / 100).toFixed(0)}€.

Panel: ${ctx.dashboardUrl}

— Pablo`,
  };
}

interface PayoutReadyCtx {
  name: string;
  period: string;             // 'YYYY-MM'
  amountEur: number;          // ya en euros
  payoutMethod: string;
  dashboardUrl: string;
}

export function renderPayoutReady(ctx: PayoutReadyCtx): RenderedEmail {
  const subject = `Tu pago de ${ctx.amountEur.toFixed(2)}€ está aprobado`;
  const preheader = `Período ${ctx.period}. Llega vía ${ctx.payoutMethod} en las próximas 48h.`;
  const body = `
<p style="margin:0 0 16px;color:#FFF;font-weight:600">Hey ${ctx.name},</p>

<p style="margin:0 0 16px">
  Tu pago del período <strong>${ctx.period}</strong> está aprobado:
</p>

<div style="margin:16px 0;padding:20px;background:#0A0A0A;border:1px solid #CFFF00;
            border-radius:6px;text-align:center">
  <div style="font-family:'Anton','Impact',sans-serif;font-size:36px;color:#CFFF00;line-height:1">
    ${ctx.amountEur.toFixed(2)}€
  </div>
  <div style="margin-top:8px;color:#888;font-size:12px;letter-spacing:1px;text-transform:uppercase">
    vía ${ctx.payoutMethod}
  </div>
</div>

<p style="margin:0 0 16px;color:#888;font-size:13px">
  Llega en las próximas 48h. Si no llega, escríbeme a support@darkroomcreative.cloud.
</p>

<p style="margin:24px 0 0">— Pablo</p>
`;
  return {
    subject,
    from: FROM_EMAIL,
    html: wrapDarkRoom({
      preheader,
      bodyHtml: body,
      ctaText: "VER PANEL",
      ctaUrl: ctx.dashboardUrl,
    }),
    text: `Hey ${ctx.name},

Tu pago del período ${ctx.period} está aprobado: ${ctx.amountEur.toFixed(2)}€ vía ${ctx.payoutMethod}.

Llega en las próximas 48h. Si no llega, support@darkroomcreative.cloud.

Panel: ${ctx.dashboardUrl}

— Pablo`,
  };
}

export function buildCrewDashboardUrl(code: string): string {
  return `${CREW_DASHBOARD_BASE}?code=${encodeURIComponent(code)}`;
}

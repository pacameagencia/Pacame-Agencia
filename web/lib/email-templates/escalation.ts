/**
 * PACAME — Email templates para escaladas internas a Pablo.
 *
 * Subjects cortos y punchy para triage rapido en movil.
 * Bodies con contexto + CTA al dashboard.
 */

import { wrapEmailTemplate } from "@/lib/resend";

const DASHBOARD_BASE = "https://pacameagencia.com";

function escapeForHtml(raw: string | null | undefined): string {
  return (raw ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface EscalationEmail {
  subject: string;
  html: string;
}

export interface EscalationQARejectedParams {
  orderNumber: string;
  serviceSlug: string;
  score: number;
  feedback: string;
  orderUrl?: string;
}

export function escalationQARejected(params: EscalationQARejectedParams): EscalationEmail {
  const scoreStr = Number.isFinite(params.score)
    ? params.score.toFixed(1)
    : String(params.score);
  const orderUrl = params.orderUrl || `${DASHBOARD_BASE}/dashboard/orders/${params.orderNumber}`;
  const subject = `[PACAME] 🚨 QA rechazo ${params.orderNumber} (score ${scoreStr}/10)`;

  const body =
    `El auto-QA ha RECHAZADO el entregable antes de salir al cliente.\n\n` +
    `Order: ${params.orderNumber}\n` +
    `Servicio: ${params.serviceSlug}\n` +
    `Score: ${scoreStr}/10\n\n` +
    `Feedback del reviewer:\n${params.feedback}\n\n` +
    `El pedido esta en status 'processing'. Revisa el entregable, ajusta manualmente o relanza el delivery. El cliente no ha sido notificado todavia.`;

  const html = wrapEmailTemplate(body, {
    cta: "Abrir orden en dashboard",
    ctaUrl: orderUrl,
    preheader: `QA rechazo — score ${scoreStr}/10 en ${params.orderNumber}`,
  });

  return { subject, html };
}

export interface EscalationThirdRevisionParams {
  orderNumber: string;
  clientName?: string | null;
  feedback: string;
  orderUrl?: string;
}

export function escalationThirdRevision(params: EscalationThirdRevisionParams): EscalationEmail {
  const orderUrl = params.orderUrl || `${DASHBOARD_BASE}/dashboard/orders/${params.orderNumber}`;
  const clientLabel = params.clientName?.trim() || "Cliente";
  const subject = `[PACAME] ⚠️ Tercera revision en ${params.orderNumber} — intervenir`;

  const body =
    `${clientLabel} ha pedido una tercera revision (o feedback muy negativo). El flujo automatico se ha pausado.\n\n` +
    `Order: ${params.orderNumber}\n\n` +
    `Feedback del cliente:\n${params.feedback}\n\n` +
    `Recomendacion: llama o escribe al cliente en menos de 2h. Mejor soltar un entregable manual premium que perderlo.`;

  const html = wrapEmailTemplate(body, {
    cta: "Abrir orden en dashboard",
    ctaUrl: orderUrl,
    preheader: `3a revision — ${clientLabel} en ${params.orderNumber}`,
  });

  return { subject, html };
}

export interface EscalationLowRatingParams {
  orderNumber: string;
  clientName?: string | null;
  rating: number;
  review?: string | null;
  orderUrl?: string;
}

export function escalationLowRating(params: EscalationLowRatingParams): EscalationEmail {
  const orderUrl = params.orderUrl || `${DASHBOARD_BASE}/dashboard/orders/${params.orderNumber}`;
  const clientLabel = params.clientName?.trim() || "Cliente";
  const reviewText = params.review?.trim() || "(sin comentario adicional)";
  const subject = `[PACAME] ⭐ Rating bajo ${params.rating}/5 en ${params.orderNumber}`;

  const body =
    `${clientLabel} ha dejado un rating de ${params.rating}/5 en esta orden.\n\n` +
    `Order: ${params.orderNumber}\n` +
    `Rating: ${params.rating}/5\n\n` +
    `Comentario:\n${reviewText}\n\n` +
    `Accion sugerida: contactar al cliente en 24h para entender que fallo y recuperar NPS. Considera ofrecer extra gratis.`;

  const html = wrapEmailTemplate(body, {
    cta: "Abrir orden en dashboard",
    ctaUrl: orderUrl,
    preheader: `Rating ${params.rating}/5 — ${clientLabel}`,
  });

  return { subject, html };
}

// Export helper por si alguien quiere escaparlo explicitamente en otro template
export const _internal = { escapeForHtml };

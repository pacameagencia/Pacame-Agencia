/**
 * Onboarding 7-day · state machine reactiva ejecutada por NIMBO.
 *
 * Cada miembro nuevo (`tier !== 'lurker'`) recibe una secuencia D0/D2/D5/D7
 * basada en `joined_at`. El cron diario (`/api/darkroom/community/onboarding`)
 * lee `darkroom_community_members` y dispara el step pendiente según
 * `darkroom_community_events.event_type` ya registrados.
 *
 * Plan §6.2 + master-success-playbook §7 Notebook 1 (lifecycle).
 *
 * Bajada churn proyectada 12% → 6% si se ejecuta correctamente — es la
 * inversión retentiva con mejor ROI del SaaS.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { recordEvent, markEventDelivered } from "./messages";
import type { CommunityMember, EventType } from "./types";

export interface OnboardingStep {
  day: 0 | 2 | 5 | 7;
  eventType: EventType;
  /** Mensaje base — `{name}` se sustituye con displayName/email. NIMBO puede expandir con LLM standard. */
  message: string;
  channel: "discord_dm" | "whatsapp_template" | "discord_channel";
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    day: 0,
    eventType: "onboarding:d0",
    channel: "discord_dm",
    message:
      "Hola {name}, bienvenido a DarkRoom.\n\n" +
      "Quick win 30 min: entra al stack, abre Midjourney y genera tu primera imagen. " +
      "Te dejo el tutorial paso a paso en #stack-tutoriales.\n\n" +
      "Si algo falla escribe en #soporte-ai. IRIS responde en <30s.",
  },
  {
    day: 2,
    eventType: "onboarding:d2",
    channel: "discord_dm",
    message:
      "{name}, día 2.\n\n" +
      "Reto: sube tu primer trabajo a #showcase. Da igual que sea un test.\n\n" +
      "Los viernes destacamos los 3 mejores. El primero que sube siempre llama la atención.",
  },
  {
    day: 5,
    eventType: "onboarding:d5",
    channel: "discord_dm",
    message:
      "{name}, día 5.\n\n" +
      "¿Te has presentado en #bienvenida? Una línea: qué haces y qué tool del pack vas a destrozar primero.\n\n" +
      "La comunidad funciona si nos conocemos.",
  },
  {
    day: 7,
    eventType: "onboarding:d7",
    channel: "discord_dm",
    message:
      "{name}, semana 1 cerrada.\n\n" +
      "Si llegaste hasta aquí ya estás dentro. Pequeña encuesta 1 minuto: ¿qué herramienta del pack te ha sorprendido?\n\n" +
      "Tu respuesta abre los siguientes tutoriales semanales.",
  },
];

/**
 * Devuelve qué step toca disparar para un miembro AHORA, o null si:
 *   · el step ya está registrado
 *   · todavía no ha pasado el día requerido
 *   · el miembro está paused/banned/left
 *   · el miembro es lurker (no ha pagado nada)
 */
export async function nextStepFor(member: CommunityMember): Promise<OnboardingStep | null> {
  if (member.status !== "active") return null;
  if (member.tier === "lurker") return null;

  const sb = createServerSupabase();
  const { data: existing, error } = await sb
    .from("darkroom_community_events")
    .select("event_type")
    .eq("member_id", member.id)
    .in(
      "event_type",
      ONBOARDING_STEPS.map((s) => s.eventType),
    );
  if (error) {
    getLogger().warn({ err: error, memberId: member.id }, "[dr-onboarding] events lookup error");
    return null;
  }
  const fired = new Set((existing ?? []).map((r) => r.event_type as EventType));

  const joined = new Date(member.joinedAt).getTime();
  const daysSinceJoin = Math.floor((Date.now() - joined) / 86_400_000);

  for (const step of ONBOARDING_STEPS) {
    if (fired.has(step.eventType)) continue;
    if (daysSinceJoin >= step.day) return step;
  }
  return null;
}

/** Renderiza placeholders del mensaje. Mantenido simple; NIMBO puede regenerar con LLM standard. */
export function renderStep(step: OnboardingStep, member: CommunityMember): string {
  const name = member.displayName?.split(" ")[0] || member.discordUsername || "creator";
  return step.message.replaceAll("{name}", name);
}

/** Marca un step como delivered (lo invoca quien envíe el mensaje al canal). */
export async function markStepDelivered(memberId: string, step: OnboardingStep): Promise<void> {
  const event = await recordEvent({
    memberId,
    eventType: step.eventType,
    payload: { day: step.day },
    deliveredVia: step.channel,
    status: "recorded",
  });
  await markEventDelivered(event.id);
}

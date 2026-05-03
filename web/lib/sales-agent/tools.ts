/**
 * DarkRoom Sales Agent · Claude tool definitions.
 *
 * Tools que el agente puede invocar via Claude tool_use mid-conversation:
 *   - create_lead: registra prospect en Supabase (si no es ya miembro/lead)
 *   - send_trial_link: genera link único trial 14d (Stripe)
 *   - apply_discount: aplica código descuento (uso 1 vez por contacto)
 *   - escalate_human: crea ticket interno para humano
 *   - send_crew_invite: link al programa Crew
 *   - get_member_status: consulta si es miembro / estado trial / churn risk
 *
 * Cada tool tiene su handler real más abajo. El agent.ts orquesta.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { sendTelegram } from "@/lib/telegram";
import type { SalesAgentChannel } from "./persona-darkroom";
import type { DarkRoomIntent } from "./intent";

// ─── Tool definitions (formato Claude tool_use) ───────────────────────────────

export const DARKROOM_TOOLS = [
  {
    name: "create_lead",
    description:
      "Registra un nuevo prospecto en Supabase. Llamar SOLO la primera vez que un contacto identifica intención clara de compra/info. NO llamar si ya existe el lead (usar get_member_status primero si dudas).",
    input_schema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: "ID externo del contacto (IG handle, WA phone, Telegram chat_id).",
        },
        channel: {
          type: "string",
          enum: ["instagram", "whatsapp", "telegram"],
          description: "Canal por donde llegó.",
        },
        intent: {
          type: "string",
          description: "Intent detectado (info, pricing, stack, trial, refer, etc.).",
        },
        signal: {
          type: "string",
          description: "Frase del usuario que motivó el lead.",
        },
        contact_name: {
          type: "string",
          description: "Nombre/handle visible si lo sabemos.",
        },
      },
      required: ["contact_id", "channel", "intent"],
    },
  },
  {
    name: "send_trial_link",
    description:
      "Genera y envía un link único de trial 14d (Stripe checkout) para el contacto. Incluye crew_ref si la conversación viene de un Crew member. Llamar cuando el lead pide explícitamente probar o tras 2-3 turnos de info útil.",
    input_schema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        plan: { type: "string", enum: ["starter", "pro", "studio"], description: "Plan recomendado (default pro)." },
        crew_ref_slug: { type: "string", description: "Slug del Crew member referente, si aplica." },
      },
      required: ["contact_id", "plan"],
    },
  },
  {
    name: "apply_discount",
    description:
      "Aplica código descuento (DARKROOM10 = 10% primer mes). Llamar SOLO si la objeción principal es precio Y el lead muestra señales de cerrar (no descuento ofensivo).",
    input_schema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        code: { type: "string", enum: ["DARKROOM10", "FRIEND15"], description: "DARKROOM10 = 10% primer mes; FRIEND15 = 15% primer trimestre (uso restringido)." },
      },
      required: ["contact_id", "code"],
    },
  },
  {
    name: "escalate_human",
    description:
      "Deriva al humano (ticket interno via Telegram alert). Llamar cuando: legal/refund/agresividad/issue técnico no resuelto en 2 turnos / lead amenaza compartir capturas. Después de llamar, pasa al cliente un mensaje neutro sin prometer plazo.",
    input_schema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        reason: {
          type: "string",
          enum: ["legal", "refund", "tech_issue", "abusive", "high_value", "other"],
        },
        summary: {
          type: "string",
          description: "1-2 frases con qué pidió el cliente y por qué se escala.",
        },
      },
      required: ["contact_id", "reason", "summary"],
    },
  },
  {
    name: "send_crew_invite",
    description:
      "Envía link al programa de afiliados DarkRoom Crew. Llamar cuando preguntan referidos/afiliados/cómo recomendar y aún no son Crew.",
    input_schema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "get_member_status",
    description:
      "Consulta si el contacto ya es miembro DarkRoom o trial activo. Útil antes de pitchear (no pitchear a quien ya pagó).",
    input_schema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        email: { type: "string", description: "Email si lo sabemos (opcional)." },
      },
      required: ["contact_id"],
    },
  },
] as const;

export type DarkRoomToolName =
  | "create_lead"
  | "send_trial_link"
  | "apply_discount"
  | "escalate_human"
  | "send_crew_invite"
  | "get_member_status";

// ─── Handlers reales ─────────────────────────────────────────────────────────

const supabase = createServerSupabase();
const log = getLogger();

export async function handleCreateLead(input: {
  contact_id: string;
  channel: SalesAgentChannel;
  intent: DarkRoomIntent | string;
  signal?: string;
  contact_name?: string;
}): Promise<{ success: boolean; lead_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("darkroom_leads")
      .upsert(
        {
          contact_id: input.contact_id,
          channel: input.channel,
          first_intent: input.intent,
          first_signal: input.signal || null,
          contact_name: input.contact_name || null,
          status: "new",
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "contact_id" }
      )
      .select("id")
      .single();
    if (error) {
      log.error({ err: error }, "[sales-agent] create_lead failed");
      return { success: false, error: error.message };
    }
    return { success: true, lead_id: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function handleSendTrialLink(input: {
  contact_id: string;
  plan: "starter" | "pro" | "studio";
  crew_ref_slug?: string;
}): Promise<{ success: boolean; checkout_url?: string; error?: string }> {
  // Stripe checkout creation: el endpoint específico /api/darkroom/stripe/trial
  // se construye en sprint siguiente. Por ahora devolvemos URL pública con
  // query param que la landing interpreta para arrancar trial.
  const baseUrl = "https://darkroomcreative.cloud/trial";
  const params = new URLSearchParams({ plan: input.plan, c: input.contact_id });
  if (input.crew_ref_slug) params.set("ref", input.crew_ref_slug);
  const url = `${baseUrl}?${params}`;
  try {
    await supabase.from("darkroom_lead_events").insert({
      contact_id: input.contact_id,
      event_type: "trial_link_sent",
      meta: { plan: input.plan, crew_ref_slug: input.crew_ref_slug ?? null, url },
    });
    return { success: true, checkout_url: url };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function handleApplyDiscount(input: {
  contact_id: string;
  code: "DARKROOM10" | "FRIEND15";
}): Promise<{ success: boolean; one_use?: boolean; error?: string }> {
  // Verifica que el contacto no haya usado código antes
  try {
    const { data: existing } = await supabase
      .from("darkroom_lead_events")
      .select("id")
      .eq("contact_id", input.contact_id)
      .eq("event_type", "discount_applied")
      .maybeSingle();
    if (existing) {
      return { success: false, one_use: true, error: "Already used a discount code" };
    }
    await supabase.from("darkroom_lead_events").insert({
      contact_id: input.contact_id,
      event_type: "discount_applied",
      meta: { code: input.code },
    });
    return { success: true, one_use: false };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function handleEscalateHuman(input: {
  contact_id: string;
  reason: "legal" | "refund" | "tech_issue" | "abusive" | "high_value" | "other";
  summary: string;
}): Promise<{ success: boolean; ticket_id?: string; error?: string }> {
  const emoji = input.reason === "legal" ? "🚨"
    : input.reason === "refund" ? "💸"
    : input.reason === "abusive" ? "⚠️"
    : "📩";

  // Notificación inmediata via Telegram brand=darkroom (o pacame fallback)
  await sendTelegram(
    `${emoji} <b>DarkRoom escalation · ${input.reason}</b>\n\n` +
      `Contact: <code>${input.contact_id}</code>\n` +
      `Summary: ${input.summary}\n\n` +
      `Atender en <code>/app/darkroom/inbox</code>`,
    { brand: "darkroom" }
  );

  try {
    const { data, error } = await supabase
      .from("darkroom_escalations")
      .insert({
        contact_id: input.contact_id,
        reason: input.reason,
        summary: input.summary,
        status: "open",
      })
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, ticket_id: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function handleSendCrewInvite(input: {
  contact_id: string;
}): Promise<{ success: boolean; url: string }> {
  const url = "https://darkroomcreative.cloud/crew";
  try {
    await supabase.from("darkroom_lead_events").insert({
      contact_id: input.contact_id,
      event_type: "crew_invite_sent",
      meta: { url },
    });
  } catch {
    /* noop */
  }
  return { success: true, url };
}

export async function handleGetMemberStatus(input: {
  contact_id: string;
  email?: string;
}): Promise<{
  is_member: boolean;
  is_trial: boolean;
  is_crew: boolean;
  plan?: string;
  trial_ends_at?: string;
}> {
  try {
    const { data: member } = await supabase
      .from("darkroom_members")
      .select("plan, status, trial_ends_at")
      .or(
        input.email
          ? `contact_id.eq.${input.contact_id},email.eq.${input.email}`
          : `contact_id.eq.${input.contact_id}`
      )
      .maybeSingle();

    const { data: crew } = await supabase
      .from("crew_members")
      .select("id")
      .eq("contact_id", input.contact_id)
      .maybeSingle();

    return {
      is_member: !!member && member.status === "active",
      is_trial: !!member && member.status === "trial",
      is_crew: !!crew,
      plan: member?.plan,
      trial_ends_at: member?.trial_ends_at,
    };
  } catch {
    return { is_member: false, is_trial: false, is_crew: false };
  }
}

/**
 * Dispatcher: invoca el handler según `name`. Devuelve un string serializable
 * que el agente puede consumir en el siguiente turno (Claude tool_result).
 */
export async function dispatchTool(
  name: DarkRoomToolName,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "create_lead":
        return JSON.stringify(await handleCreateLead(input as Parameters<typeof handleCreateLead>[0]));
      case "send_trial_link":
        return JSON.stringify(await handleSendTrialLink(input as Parameters<typeof handleSendTrialLink>[0]));
      case "apply_discount":
        return JSON.stringify(await handleApplyDiscount(input as Parameters<typeof handleApplyDiscount>[0]));
      case "escalate_human":
        return JSON.stringify(await handleEscalateHuman(input as Parameters<typeof handleEscalateHuman>[0]));
      case "send_crew_invite":
        return JSON.stringify(await handleSendCrewInvite(input as Parameters<typeof handleSendCrewInvite>[0]));
      case "get_member_status":
        return JSON.stringify(await handleGetMemberStatus(input as Parameters<typeof handleGetMemberStatus>[0]));
      default:
        return JSON.stringify({ success: false, error: `Unknown tool: ${String(name)}` });
    }
  } catch (err) {
    return JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : "tool dispatch error",
    });
  }
}

/**
 * Tipos compartidos entre el router del cerebro y los channel adapters.
 * Un ChannelAdapter decide si puede alcanzar a un lead y cuanto cuesta el touch.
 */

export type ChannelSlug =
  | "email"
  | "whatsapp"
  | "linkedin"
  | "voice"
  | "instagram_dm"
  | "sms";

export interface ChannelMessage {
  /** Solo email usa subject. Otros canales lo ignoran. */
  subject?: string;
  body: string;
  imageUrl?: string;
  cta?: { text: string; url: string };
}

export interface ChannelSendResult {
  success: boolean;
  /** ID externo: resend_id, whatsapp_msg_id, vapi_call_id, null si es manual. */
  externalId?: string | null;
  error?: string;
  /** true cuando el canal solo prepara el mensaje (ej. linkedin manual). */
  queuedForManual?: boolean;
}

export interface LeadContext {
  id: string;
  business_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  instagram_handle?: string | null;
  niche_slug?: string;
  status?: string;
  signals?: Record<string, unknown>;
}

export interface SendContext {
  campaignId?: string | null;
  touchNumber: number;
  /** Token opaco para el link de unsubscribe en emails. */
  unsubscribeToken?: string;
}

export interface ChannelAdapter {
  slug: ChannelSlug;
  label: string;
  /** Devuelve true si el lead tiene los datos minimos para usar este canal. */
  canReach(lead: LeadContext): boolean;
  /** Coste aproximado en USD de un touch. Permite al router optimizar ROI. */
  estimateCostUsd(): number;
  send(
    lead: LeadContext,
    msg: ChannelMessage,
    context: SendContext
  ): Promise<ChannelSendResult>;
}

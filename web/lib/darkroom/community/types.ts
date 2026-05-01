/**
 * Tipos compartidos del módulo comunidad DarkRoom.
 *
 * Plan: C:\Users\Pacame24\.claude\plans\ya-que-tienes-acceso-glittery-rain.md
 * Migration: infra/migrations/041_darkroom_community.sql
 *
 * Regla dura (master-success-playbook §1 línea 22): cero menciones a PACAME en
 * persona/voz de los agentes DR. Estos tipos solo viven dentro de
 * `web/lib/darkroom/community/` y `web/app/api/darkroom/...`.
 */

// ─── Membership tiers (mapean a roles Discord + planes Stripe) ─────────────

export const MEMBER_TIERS = [
  "lurker",     // entró a comunidad sin pagar (Discord/WA, no Stripe)
  "trial",      // 14 días free trial post-Stripe checkout
  "starter",    // Plan 15€
  "pro",        // Plan 29€ (mayoría)
  "studio",     // Plan 49€
  "crew",       // Afiliado activo (>1 referral pagando)
  "crew_vip",   // Top 5 afiliados (40% lifetime + roadmap access)
  "founder",    // Pablo
] as const;

export type MemberTier = (typeof MEMBER_TIERS)[number];

export const MEMBER_STATUSES = ["active", "paused", "banned", "left"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

// ─── Channels (origen del mensaje) ─────────────────────────────────────────

export type DiscordChannel =
  | "discord:bienvenida"
  | "discord:reglas-y-faq"
  | "discord:anuncios"
  | "discord:soporte-ai"
  | "discord:status-stack"
  | "discord:stack-tutoriales"
  | "discord:showcase"
  | "discord:oportunidades"
  | "discord:confesionario"
  | "discord:crew-vip"
  | "discord:ofertas-pablo"
  | "discord:dm";

export type WhatsAppChannel =
  | "whatsapp:dm"
  | "whatsapp:soporte-rapido"
  | "whatsapp:showcase-creators"
  | "whatsapp:anuncios";

export type TelegramChannel = "telegram:bot";
export type InstagramChannel = "ig:dm";

export type CommunityChannel =
  | DiscordChannel
  | WhatsAppChannel
  | TelegramChannel
  | InstagramChannel;

export type MessageDirection = "inbound" | "outbound";

// ─── Intent (clasificación de mensaje entrante) ────────────────────────────

export const INTENT_TYPES = [
  "support",       // problema con cuenta/herramienta
  "lead",          // interés comercial · pre-pago
  "feedback",      // opinión miembro pagado
  "cancellation",  // intent de cancelar
  "abuse",         // spam/piracy/threats
  "showcase",      // sube work
  "social",        // saludo / charla casual
  "unknown",
] as const;

export type IntentType = (typeof INTENT_TYPES)[number];

export interface IntentDetection {
  intent: IntentType;
  confidence: number;        // 0..1
  keywords: string[];        // qué disparó
  suggestedAgent: AgentName; // a qué agente se rutea
  escalateToHuman: boolean;  // bypass total a Pablo
}

// ─── Agentes ──────────────────────────────────────────────────────────────

export const AGENT_NAMES = ["iris", "nimbo", "vector", "human:pablo"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export interface AgentResponse {
  reply: string;
  agent: AgentName;
  llmTier: "titan" | "premium" | "standard" | "economy" | "reasoning" | "none";
  llmConfidence: number;     // 0..1
  escalated: boolean;
  escalationReason?: string;
  leadScoreDelta: number;
  intent: IntentType;
  events?: CommunityEventInput[];
  tokensUsed?: number;
  latencyMs?: number;
}

// ─── Member ───────────────────────────────────────────────────────────────

export interface CommunityMember {
  id: string;
  leadId?: string | null;
  stripeCustomerId?: string | null;
  discordUserId?: string | null;
  discordUsername?: string | null;
  whatsappPhone?: string | null;
  displayName?: string | null;
  email?: string | null;
  tier: MemberTier;
  joinedAt: string;
  lastActiveAt: string;
  status: MemberStatus;
  leadScore: number;
  affiliateCode?: string | null;
  meta: Record<string, unknown>;
}

export interface MemberLookup {
  discordUserId?: string;
  whatsappPhone?: string;
  email?: string;
  stripeCustomerId?: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────

export interface CommunityMessageInput {
  memberId: string;
  channel: CommunityChannel;
  direction: MessageDirection;
  agentHandler?: AgentName | null;
  intentDetected?: IntentType | null;
  contentRaw: string;     // hasher + truncar internamente, NO se persiste raw
  leadScoreDelta?: number;
  escalated?: boolean;
  llmTier?: string | null;
  llmConfidence?: number | null;
  meta?: Record<string, unknown>;
}

// ─── Events (onboarding + retention triggers) ─────────────────────────────

export type EventType =
  | "onboarding:d0"
  | "onboarding:d2"
  | "onboarding:d5"
  | "onboarding:d7"
  | "churn_risk_detected"
  | "retention_offer_sent"
  | "retention_offer_accepted"
  | "retention_offer_declined"
  | "showcase_post"
  | "tutorial_consumed"
  | "webinar_registered"
  | "webinar_attended"
  | "crew_invited"
  | "crew_joined"
  | "lifetime_offered"
  | "lifetime_purchased"
  | "abuse_flagged"
  | "banned"
  | "stripe:subscription_created"
  | "stripe:subscription_updated"
  | "stripe:subscription_canceled"
  | "discord:joined"
  | "discord:left"
  | "whatsapp:joined";

export type EventStatus = "recorded" | "delivered" | "failed" | "acknowledged";

export type EventDeliveryChannel =
  | "discord_dm"
  | "whatsapp_template"
  | "discord_channel"
  | "telegram"
  | "email"
  | "internal";

export interface CommunityEventInput {
  memberId: string;
  eventType: EventType;
  payload?: Record<string, unknown>;
  deliveredVia?: EventDeliveryChannel | null;
  status?: EventStatus;
}

export interface CommunityEvent extends CommunityEventInput {
  id: number;
  status: EventStatus;
  createdAt: string;
  deliveredAt?: string | null;
}

// ─── Lead scoring ─────────────────────────────────────────────────────────

export interface LeadScoreCalc {
  score: number;             // 0..100
  delta: number;             // cambio aplicado en este tick
  signals: string[];         // motivos detectados
  qualifiedTier: MemberTier; // recomendado por VECTOR
  objection?: string;        // primera objeción detectada (frenan compra)
  source: "discord" | "whatsapp" | "telegram" | "ig" | "outreach";
}

export interface LeadQualification {
  questionsAnswered: 0 | 1 | 2 | 3 | 4;
  profile?: "dropshipper" | "creator_visual" | "ai_creator" | "freelance" | "student" | "agency";
  toolsPaying?: string[];
  monthlySpendEur?: number;
  blocker?: string;          // qué frenaba probar DR (Q4)
  recommended: MemberTier;
  antiIcp: boolean;          // agencia >5 personas (positioning.md:75)
}

// ─── Known issue (KB de IRIS) ─────────────────────────────────────────────

export interface KnownIssue {
  id: string;
  slug: string;
  title: string;
  symptomKeywords: string[];
  resolution: string;
  escalateToHuman: boolean;
  category: "access" | "billing" | "tools" | "refund" | "general";
  active: boolean;
}

// ─── Errores ──────────────────────────────────────────────────────────────

export class CommunityError extends Error {
  constructor(message: string, public readonly code: string, public readonly meta?: unknown) {
    super(message);
    this.name = "CommunityError";
  }
}

/**
 * Public API del módulo comunidad DarkRoom.
 *
 * Importar desde aquí (no desde rutas internas) garantiza estabilidad de la
 * superficie cuando refactoricemos.
 */

export type {
  AgentName,
  AgentResponse,
  CommunityChannel,
  CommunityEvent,
  CommunityEventInput,
  CommunityMember,
  CommunityMessageInput,
  DiscordChannel,
  EventDeliveryChannel,
  EventStatus,
  EventType,
  InstagramChannel,
  IntentDetection,
  IntentType,
  KnownIssue,
  LeadQualification,
  LeadScoreCalc,
  MemberLookup,
  MemberStatus,
  MemberTier,
  MessageDirection,
  TelegramChannel,
  WhatsAppChannel,
} from "./types";

export { CommunityError, MEMBER_TIERS, MEMBER_STATUSES, INTENT_TYPES, AGENT_NAMES } from "./types";

export { dispatch } from "./dispatcher";
export type { DispatchInput, DispatchResult } from "./dispatcher";

export { detectIntent } from "./intent-detector";

export {
  bumpLeadScore,
  findMember,
  normalizePhone,
  setMemberTier,
  upsertMember,
} from "./members";

export { isLikelySpam, markEventDelivered, recordEvent, recordMessage } from "./messages";

export {
  ONBOARDING_STEPS,
  markStepDelivered,
  nextStepFor,
  renderStep,
} from "./onboarding-7day";
export type { OnboardingStep } from "./onboarding-7day";

export {
  DR_ANTI_PROMISES,
  DR_BANNED_PATTERNS_REGEX,
  DR_SYSTEM_PROMPT_BASE,
  DR_VOICE_DONTS,
  DR_VOICE_DOS,
  DR_VOICE_RULES,
  DR_WHATSAPP_PRIVACY_NOTICE,
} from "./voice";

export { handleWithIris } from "./agents/iris";
export { handleWithNimbo } from "./agents/nimbo";
export { handleWithVector } from "./agents/vector";

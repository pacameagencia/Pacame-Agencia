/**
 * PACAME — Env Vars Registry (single source of truth)
 *
 * Describe CADA env var que el codigo usa. Sirve para:
 *  1. Generar .env.local.example automaticamente (scripts/generate-env-example.mjs)
 *  2. Endpoint /api/admin/env-check que reporta estado en vivo
 *  3. Dashboard /dashboard/env que muestra matrix coloreada
 *  4. Auto-complete TypeScript via EnvVarKey
 *
 * Anadir una var NUEVA: solo editar este fichero. El resto se regenera/actualiza.
 */

export type EnvCategory =
  | "llm"
  | "database"
  | "payments"
  | "messaging"
  | "social"
  | "content"
  | "infrastructure"
  | "auth"
  | "analytics"
  | "cron";

export interface EnvVarMeta {
  /** Friendly category for UI grouping */
  category: EnvCategory;
  /** What this var does — 1 linea */
  description: string;
  /** Donde es requerida. Vacio = opcional */
  required_in: Array<"production" | "preview" | "development">;
  /** Provider humano (Anthropic, Stripe, Supabase...) */
  provider: string;
  /** Direct link al panel del provider para generar la key */
  generate_url?: string;
  /** true = NEXT_PUBLIC_ o similar — ok exponer al cliente */
  public?: boolean;
  /** Placeholder para .env.example (NO poner valores reales) */
  example?: string;
}

export const envRegistry = {
  // ========================================================================
  // LLM — Model providers + routing config
  // ========================================================================
  CLAUDE_API_KEY: {
    category: "llm",
    description: "Anthropic API key — tiers reasoning/titan/premium primary",
    required_in: ["production", "preview", "development"],
    provider: "Anthropic",
    generate_url: "https://console.anthropic.com/settings/keys",
    example: "sk-ant-api03-...",
  },
  NEBIUS_API_KEY: {
    category: "llm",
    description: "Nebius AI Studio — tiers standard/economy primary + fallback todo",
    required_in: ["production", "preview", "development"],
    provider: "Nebius",
    generate_url: "https://studio.nebius.com/settings/api-keys",
    example: "eyJhbGci...",
  },
  NEBIUS_API_URL: {
    category: "llm",
    description: "Nebius endpoint override (default api.tokenfactory.nebius.com)",
    required_in: [],
    provider: "Nebius",
    example: "https://api.tokenfactory.nebius.com/v1",
  },
  GEMMA_API_TOKEN: {
    category: "llm",
    description: "Gemma self-hosted VPS (Ollama) — economy tier primary",
    required_in: [],
    provider: "PACAME VPS",
    example: "(bearer token del VPS)",
  },
  GEMMA_API_URL: {
    category: "llm",
    description: "Gemma VPS endpoint (default gemma.pacameagencia.com)",
    required_in: [],
    provider: "PACAME VPS",
    example: "https://gemma.pacameagencia.com",
  },
  GEMINI_API_KEY: {
    category: "llm",
    description: "Google Gemini API — backup multimodal",
    required_in: [],
    provider: "Google AI",
    generate_url: "https://aistudio.google.com/app/apikey",
    example: "AIza...",
  },
  OPENAI_API_KEY: {
    category: "llm",
    description: "OpenAI — Whisper (transcripcion audio) + DALL-E 3 (imagenes)",
    required_in: [],
    provider: "OpenAI",
    generate_url: "https://platform.openai.com/api-keys",
    example: "sk-proj-...",
  },
  VERTEX_ACCESS_TOKEN: {
    category: "llm",
    description: "Google Vertex AI access token (si se usa Vertex)",
    required_in: [],
    provider: "Google Cloud",
    generate_url: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    example: "ya29....",
  },
  LLM_STRATEGY: {
    category: "llm",
    description: "Routing strategy: 'quality-first' (default) o 'cost-first'",
    required_in: ["production"],
    provider: "PACAME internal",
    example: "quality-first",
  },
  LLM_THINKING_BUDGET_TOKENS: {
    category: "llm",
    description: "Budget tokens extended thinking Claude Opus (default 5000)",
    required_in: [],
    provider: "PACAME internal",
    example: "5000",
  },
  LLM_BUDGET_REASONING_EUR_DAILY: {
    category: "llm",
    description: "Cap EUR/dia tier reasoning. Al 80% warn, 100% auto-degrade",
    required_in: [],
    provider: "PACAME internal",
    example: "15",
  },
  LLM_BUDGET_TITAN_EUR_DAILY: {
    category: "llm",
    description: "Cap EUR/dia tier titan",
    required_in: [],
    provider: "PACAME internal",
    example: "20",
  },
  LLM_BUDGET_PREMIUM_EUR_DAILY: {
    category: "llm",
    description: "Cap EUR/dia tier premium",
    required_in: [],
    provider: "PACAME internal",
    example: "30",
  },
  LLM_BUDGET_STANDARD_EUR_DAILY: {
    category: "llm",
    description: "Cap EUR/dia tier standard",
    required_in: [],
    provider: "PACAME internal",
    example: "10",
  },
  LLM_BUDGET_ECONOMY_EUR_DAILY: {
    category: "llm",
    description: "Cap EUR/dia tier economy",
    required_in: [],
    provider: "PACAME internal",
    example: "3",
  },
  LLM_USD_TO_EUR: {
    category: "llm",
    description: "Tipo de cambio USD→EUR para budget guard (default 0.92)",
    required_in: [],
    provider: "PACAME internal",
    example: "0.92",
  },
  LLM_BUDGET_OVERRIDE: {
    category: "llm",
    description: "Si 'true', salta todos los budget caps (emergencia)",
    required_in: [],
    provider: "PACAME internal",
    example: "false",
  },

  // ========================================================================
  // DATABASE — Supabase + direct Postgres
  // ========================================================================
  NEXT_PUBLIC_SUPABASE_URL: {
    category: "database",
    description: "Supabase project URL (client-side visible)",
    required_in: ["production", "preview", "development"],
    provider: "Supabase",
    generate_url: "https://supabase.com/dashboard/project/_/settings/api",
    public: true,
    example: "https://xxxxx.supabase.co",
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    category: "database",
    description: "Supabase anon key — client browser (RLS protects data)",
    required_in: ["production", "preview", "development"],
    provider: "Supabase",
    generate_url: "https://supabase.com/dashboard/project/_/settings/api",
    public: true,
    example: "eyJhbGci...",
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    category: "database",
    description: "Supabase service role — server-only, bypasses RLS",
    required_in: ["production", "preview", "development"],
    provider: "Supabase",
    generate_url: "https://supabase.com/dashboard/project/_/settings/api",
    example: "eyJhbGci...",
  },
  DATABASE_URL: {
    category: "database",
    description: "Postgres connection string (Session Pooler) — migrations script",
    required_in: ["development"],
    provider: "Supabase",
    generate_url: "https://supabase.com/dashboard/project/_/settings/database",
    example: "postgresql://postgres.xxxxx:PWD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres",
  },

  // ========================================================================
  // PAYMENTS — Stripe
  // ========================================================================
  STRIPE_SECRET_KEY: {
    category: "payments",
    description: "Stripe secret — server-side checkout/refunds",
    required_in: ["production", "preview", "development"],
    provider: "Stripe",
    generate_url: "https://dashboard.stripe.com/apikeys",
    example: "sk_live_...",
  },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    category: "payments",
    description: "Stripe publishable — client-side tokenization",
    required_in: ["production", "preview", "development"],
    provider: "Stripe",
    generate_url: "https://dashboard.stripe.com/apikeys",
    public: true,
    example: "pk_live_...",
  },
  STRIPE_WEBHOOK_SECRET: {
    category: "payments",
    description: "Stripe webhook signing secret — valida events",
    required_in: ["production", "preview"],
    provider: "Stripe",
    generate_url: "https://dashboard.stripe.com/webhooks",
    example: "whsec_...",
  },

  // ========================================================================
  // AUTH — Admin dashboard + cron
  // ========================================================================
  DASHBOARD_PASSWORD: {
    category: "auth",
    description: "Admin dashboard password (HMAC-signed tokens derivan de esta)",
    required_in: ["production", "preview", "development"],
    provider: "PACAME internal",
    example: "una-password-fuerte",
  },
  CRON_SECRET: {
    category: "auth",
    description: "Bearer token para proteger cron endpoints de Vercel scheduler",
    required_in: ["production"],
    provider: "PACAME internal",
    example: "random-32-chars",
  },

  // ========================================================================
  // MESSAGING — Email, SMS, Voice, Telegram
  // ========================================================================
  RESEND_API_KEY: {
    category: "messaging",
    description: "Resend — envio transaccional de emails",
    required_in: ["production", "preview", "development"],
    provider: "Resend",
    generate_url: "https://resend.com/api-keys",
    example: "re_...",
  },
  TELEGRAM_BOT_TOKEN: {
    category: "messaging",
    description: "Telegram bot — notifica Pablo (leads, errores, payments)",
    required_in: ["production"],
    provider: "Telegram BotFather",
    generate_url: "https://t.me/BotFather",
    example: "1234567:AAH...",
  },
  TELEGRAM_CHAT_ID: {
    category: "messaging",
    description: "Chat ID de Pablo (destino notifications)",
    required_in: ["production"],
    provider: "Telegram",
    example: "123456789",
  },
  TELEGRAM_WEBHOOK_SECRET: {
    category: "messaging",
    description: "Secret header para validar webhooks Telegram",
    required_in: [],
    provider: "Telegram",
    example: "random-secret",
  },
  TWILIO_ACCOUNT_SID: {
    category: "messaging",
    description: "Twilio Account SID — SMS",
    required_in: [],
    provider: "Twilio",
    generate_url: "https://console.twilio.com",
    example: "AC...",
  },
  TWILIO_AUTH_TOKEN: {
    category: "messaging",
    description: "Twilio auth token",
    required_in: [],
    provider: "Twilio",
    example: "...",
  },
  TWILIO_PHONE_NUMBER: {
    category: "messaging",
    description: "Twilio voice phone (E.164)",
    required_in: [],
    provider: "Twilio",
    example: "+34722669381",
  },
  TWILIO_SMS_NUMBER: {
    category: "messaging",
    description: "Twilio SMS phone (E.164)",
    required_in: [],
    provider: "Twilio",
    example: "+34722669381",
  },
  VAPI_API_KEY: {
    category: "messaging",
    description: "Vapi — llamadas de voz IA",
    required_in: [],
    provider: "Vapi",
    generate_url: "https://dashboard.vapi.ai",
    example: "...",
  },
  VAPI_PHONE_NUMBER_ID: {
    category: "messaging",
    description: "Vapi phone number ID (linked a Twilio)",
    required_in: [],
    provider: "Vapi",
    example: "...",
  },
  VOICE_SERVER_URL: {
    category: "messaging",
    description: "Voice server propio (VPS) — reemplaza Vapi si esta online",
    required_in: [],
    provider: "PACAME VPS",
    example: "https://voice.pacameagencia.com",
  },
  WHATSAPP_PHONE_ID: {
    category: "messaging",
    description: "WhatsApp Business Phone ID (Meta Graph API)",
    required_in: [],
    provider: "Meta for Developers",
    generate_url: "https://developers.facebook.com/apps",
    example: "...",
  },
  WHATSAPP_TOKEN: {
    category: "messaging",
    description: "WhatsApp Business access token (long-lived)",
    required_in: [],
    provider: "Meta",
    example: "EAA...",
  },
  WHATSAPP_VERIFY_TOKEN: {
    category: "messaging",
    description: "WhatsApp webhook verify token",
    required_in: [],
    provider: "Meta",
    example: "pacame-wa-verify",
  },

  // ========================================================================
  // SOCIAL — Instagram, Meta, LinkedIn, Buffer
  // ========================================================================
  INSTAGRAM_APP_ID: {
    category: "social",
    description: "Meta Instagram App ID",
    required_in: [],
    provider: "Meta for Developers",
    generate_url: "https://developers.facebook.com/apps",
    example: "...",
  },
  INSTAGRAM_APP_SECRET: {
    category: "social",
    description: "Meta Instagram App Secret (OAuth + HMAC webhooks)",
    required_in: [],
    provider: "Meta",
    example: "...",
  },
  INSTAGRAM_ACCESS_TOKEN: {
    category: "social",
    description: "Instagram Business long-lived access token",
    required_in: [],
    provider: "Meta",
    example: "IGQ...",
  },
  INSTAGRAM_ACCOUNT_ID: {
    category: "social",
    description: "Instagram Business Account ID",
    required_in: [],
    provider: "Meta",
    example: "17...",
  },
  INSTAGRAM_VERIFY_TOKEN: {
    category: "social",
    description: "Instagram webhook verify token",
    required_in: [],
    provider: "Meta",
    example: "pacame-ig-verify",
  },
  META_PAGE_ID: {
    category: "social",
    description: "Facebook Page ID (multi-channel publishing)",
    required_in: [],
    provider: "Meta",
    example: "...",
  },
  META_PAGE_ACCESS_TOKEN: {
    category: "social",
    description: "Facebook Page access token",
    required_in: [],
    provider: "Meta",
    example: "EAA...",
  },
  LINKEDIN_ACCESS_TOKEN: {
    category: "social",
    description: "LinkedIn API access token",
    required_in: [],
    provider: "LinkedIn Developers",
    generate_url: "https://www.linkedin.com/developers/apps",
    example: "AQV...",
  },
  LINKEDIN_ORG_ID: {
    category: "social",
    description: "LinkedIn organization/company ID",
    required_in: [],
    provider: "LinkedIn",
    example: "12345678",
  },
  BUFFER_ACCESS_TOKEN: {
    category: "social",
    description: "Buffer API token (multi-social scheduling)",
    required_in: [],
    provider: "Buffer",
    generate_url: "https://publish.buffer.com/app/account/apps",
    example: "1/...",
  },

  // ========================================================================
  // CONTENT — Image gen + design
  // ========================================================================
  FREEPIK_API_KEY: {
    category: "content",
    description: "Freepik Suite — imagen IA, upscale, remove bg, text-to-video",
    required_in: [],
    provider: "Freepik",
    generate_url: "https://www.freepik.com/api/dashboard",
    example: "FPSX...",
  },
  STITCH_API_KEY: {
    category: "content",
    description: "Google Stitch — diseno UI con IA",
    required_in: [],
    provider: "Google Stitch",
    example: "...",
  },

  // ========================================================================
  // INFRASTRUCTURE — Apify, n8n, Upstash, Sentry
  // ========================================================================
  APIFY_API_KEY: {
    category: "infrastructure",
    description: "Apify — scraping Google Maps (lead gen)",
    required_in: ["production"],
    provider: "Apify",
    generate_url: "https://console.apify.com/account/integrations",
    example: "apify_api_...",
  },
  NEXT_PUBLIC_N8N_LEAD_WEBHOOK: {
    category: "infrastructure",
    description: "n8n webhook URL — lead form automation",
    required_in: ["production"],
    provider: "PACAME VPS n8n",
    public: true,
    example: "https://n8n.pacameagencia.com/webhook/lead-form",
  },
  UPSTASH_REDIS_REST_URL: {
    category: "infrastructure",
    description: "Upstash Redis — rate limiting",
    required_in: [],
    provider: "Upstash",
    generate_url: "https://console.upstash.com/redis",
    example: "https://xxx.upstash.io",
  },
  UPSTASH_REDIS_REST_TOKEN: {
    category: "infrastructure",
    description: "Upstash Redis token",
    required_in: [],
    provider: "Upstash",
    example: "AX...",
  },
  SENTRY_DSN: {
    category: "infrastructure",
    description: "Sentry server DSN (error tracking)",
    required_in: [],
    provider: "Sentry",
    generate_url: "https://sentry.io/settings/projects/",
    example: "https://xxx@sentry.io/yyy",
  },
  NEXT_PUBLIC_SENTRY_DSN: {
    category: "infrastructure",
    description: "Sentry client DSN (browser errors)",
    required_in: [],
    provider: "Sentry",
    public: true,
    example: "https://xxx@sentry.io/yyy",
  },
  SENTRY_AUTH_TOKEN: {
    category: "infrastructure",
    description: "Sentry auth (source maps upload en build)",
    required_in: [],
    provider: "Sentry",
    example: "sntrys_...",
  },
  RESEND_WEBHOOK_SECRET: {
    category: "infrastructure",
    description: "Resend webhook Svix secret (open/click tracking lifecycle)",
    required_in: [],
    provider: "Resend",
    generate_url: "https://resend.com/webhooks",
    example: "whsec_...",
  },
} as const satisfies Record<string, EnvVarMeta>;

export type EnvVarKey = keyof typeof envRegistry;

export const envCategories: EnvCategory[] = [
  "llm",
  "database",
  "payments",
  "auth",
  "messaging",
  "social",
  "content",
  "infrastructure",
  "analytics",
  "cron",
];

export const categoryLabels: Record<EnvCategory, string> = {
  llm: "LLM / AI Models",
  database: "Database",
  payments: "Payments (Stripe)",
  auth: "Auth & Admin",
  messaging: "Messaging (Email/SMS/Voice)",
  social: "Social Media",
  content: "Content & Design",
  infrastructure: "Infrastructure & Ops",
  analytics: "Analytics",
  cron: "Cron & Scheduled",
};

/** Lista todas las vars requeridas en el environment dado */
export function requiredFor(
  env: "production" | "preview" | "development"
): EnvVarKey[] {
  return (Object.entries(envRegistry) as [EnvVarKey, EnvVarMeta][])
    .filter(([, meta]) => meta.required_in.includes(env))
    .map(([k]) => k);
}

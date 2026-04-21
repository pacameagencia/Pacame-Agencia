/**
 * Catálogo curado de proyectos open source con potencial de fork+rebrand
 * bajo marca PACAME.
 *
 * Directiva: cada OSS del catálogo es candidato a convertirse en microservicio
 * PACAME (fork + hosting + rebrand + capa propia + soporte + suscripción).
 *
 * Criterios para estar en el catálogo:
 * - Licencia permisiva (MIT, Apache 2, BSD) — evitar AGPL si se quiere cerrar código
 * - >1000 stars en GitHub (tracción real)
 * - Categoría con demanda de mercado conocida
 * - Modelo de negocio claro (hosting, support, enterprise feature)
 */

export interface OSSCandidate {
  github: string;                    // 'owner/repo'
  name: string;
  brand: string;                      // 'PACAME XXX'
  license: 'MIT' | 'Apache-2.0' | 'BSD' | 'AGPL' | 'BSL' | 'Sustainable';
  stars: number;                      // aproximado, última actualización manual
  category: string;
  rebrand_value: 'alto' | 'medio' | 'bajo';
  description: string;
  monetization_model: string;        // cómo PACAME lo vende
}

export const OSS_CATALOG: OSSCandidate[] = [
  // === ORQUESTACIÓN / META ===
  { github: 'paperclipai/paperclip', name: 'Paperclip', brand: 'PACAME OS',
    license: 'MIT', stars: 3500, category: 'orchestration', rebrand_value: 'alto',
    description: 'Orquestador de agentes IA (zero-human company)',
    monetization_model: 'SaaS hosting + enterprise support' },

  // === CALENDARIO / AGENDA ===
  { github: 'calcom/cal.com', name: 'Cal.com', brand: 'PACAME Agenda',
    license: 'AGPL', stars: 38000, category: 'scheduling', rebrand_value: 'alto',
    description: 'Booking/scheduling open source (alt. Calendly)',
    monetization_model: 'SaaS 15-50€/mes por usuario + plan team' },

  // === PROJECT MANAGEMENT ===
  { github: 'makeplane/plane', name: 'Plane', brand: 'PACAME Project',
    license: 'AGPL', stars: 40000, category: 'project-management', rebrand_value: 'alto',
    description: 'Alternativa self-hosted a Linear/Jira',
    monetization_model: 'SaaS por workspace + addons enterprise' },

  // === ECOMMERCE ===
  { github: 'medusajs/medusa', name: 'Medusa', brand: 'PACAME Commerce',
    license: 'MIT', stars: 28000, category: 'ecommerce', rebrand_value: 'alto',
    description: 'Headless ecommerce (alt. Shopify) en Node',
    monetization_model: 'Hosting + migración + plugins premium' },

  // === CHATBOTS / TYPEFORMS ===
  { github: 'baptisteArno/typebot.io', name: 'Typebot', brand: 'PACAME Chatflow',
    license: 'AGPL', stars: 8000, category: 'chatbots', rebrand_value: 'alto',
    description: 'Chatbots visuales (alt. Typeform + chatflows)',
    monetization_model: 'SaaS tiers + whitelabel' },

  { github: 'formbricks/formbricks', name: 'Formbricks', brand: 'PACAME Forms',
    license: 'AGPL', stars: 9000, category: 'surveys-forms', rebrand_value: 'alto',
    description: 'Surveys y forms open source (alt. Typeform/SurveyMonkey)',
    monetization_model: 'SaaS tiers + embed premium' },

  // === BACKEND / DATABASE / NO-CODE ===
  { github: 'nocobase/nocobase', name: 'NocoBase', brand: 'PACAME Base',
    license: 'AGPL', stars: 9000, category: 'no-code-db', rebrand_value: 'alto',
    description: 'Alt. Airtable con extensibilidad',
    monetization_model: 'Hosting + plugins + enterprise' },

  { github: 'directus/directus', name: 'Directus', brand: 'PACAME CMS',
    license: 'BSL', stars: 25000, category: 'headless-cms', rebrand_value: 'medio',
    description: 'Headless CMS + data platform',
    monetization_model: 'Hosting + premium modules' },

  { github: 'supabase/supabase', name: 'Supabase', brand: 'PACAME Data',
    license: 'Apache-2.0', stars: 65000, category: 'backend', rebrand_value: 'medio',
    description: 'Firebase alternative con Postgres',
    monetization_model: 'Hosting + soporte + consultoría' },

  // === AUTOMATION / WORKFLOWS ===
  { github: 'windmill-labs/windmill', name: 'Windmill', brand: 'PACAME Flow',
    license: 'AGPL', stars: 7500, category: 'automation', rebrand_value: 'alto',
    description: 'Workflow engine + scripts (alt. Airplane.dev / Retool workflows)',
    monetization_model: 'Hosting + ejecuciones + enterprise' },

  { github: 'n8n-io/n8n', name: 'n8n', brand: 'PACAME Automate',
    license: 'Sustainable', stars: 45000, category: 'automation', rebrand_value: 'medio',
    description: 'Alt. Zapier self-hosted',
    monetization_model: 'Hosting + ejecuciones + nodes custom' },

  // === ANALYTICS ===
  { github: 'umami-software/umami', name: 'Umami', brand: 'PACAME Analytics',
    license: 'MIT', stars: 20000, category: 'analytics', rebrand_value: 'alto',
    description: 'Privacy-first analytics (alt. Google Analytics)',
    monetization_model: 'Hosting 9-29€/mes por sitio' },

  { github: 'plausible/analytics', name: 'Plausible', brand: 'PACAME Stats',
    license: 'AGPL', stars: 19000, category: 'analytics', rebrand_value: 'medio',
    description: 'Analytics simple y privacy-first',
    monetization_model: 'Hosting + team plans' },

  { github: 'PostHog/posthog', name: 'PostHog', brand: 'PACAME Insights',
    license: 'MIT', stars: 20000, category: 'product-analytics', rebrand_value: 'alto',
    description: 'Product analytics + feature flags + session replay',
    monetization_model: 'Hosting + usage tier' },

  // === EMAIL ===
  { github: 'knadh/listmonk', name: 'Listmonk', brand: 'PACAME Mail',
    license: 'AGPL', stars: 15000, category: 'email-marketing', rebrand_value: 'alto',
    description: 'Alt. Mailchimp self-hosted, muy rápido',
    monetization_model: 'Hosting + subscribers tier + SMTP incluido' },

  // === CONTENT / BLOG / DOCS ===
  { github: 'TryGhost/Ghost', name: 'Ghost', brand: 'PACAME Blog',
    license: 'MIT', stars: 48000, category: 'blogging', rebrand_value: 'alto',
    description: 'Plataforma blog + newsletter (alt. Medium/Substack)',
    monetization_model: 'Hosting + newsletter premium + membership' },

  { github: 'outline/outline', name: 'Outline', brand: 'PACAME Docs',
    license: 'BSL', stars: 30000, category: 'wiki', rebrand_value: 'medio',
    description: 'Wiki colaborativa (alt. Notion docs empresa)',
    monetization_model: 'Hosting por team + SSO enterprise' },

  // === CHAT / COMUNIDAD ===
  { github: 'RocketChat/Rocket.Chat', name: 'Rocket.Chat', brand: 'PACAME Team',
    license: 'MIT', stars: 40000, category: 'team-chat', rebrand_value: 'alto',
    description: 'Alt. Slack self-hosted',
    monetization_model: 'Hosting + apps marketplace + soporte' },

  { github: 'mattermost/mattermost', name: 'Mattermost', brand: 'PACAME Hub',
    license: 'AGPL', stars: 29000, category: 'team-chat', rebrand_value: 'medio',
    description: 'Chat + collab self-hosted, foco compliance',
    monetization_model: 'Hosting + enterprise edition' },

  // === MONITORING / OPS ===
  { github: 'louislam/uptime-kuma', name: 'Uptime Kuma', brand: 'PACAME Monitor',
    license: 'MIT', stars: 60000, category: 'monitoring', rebrand_value: 'alto',
    description: 'Alt. UptimeRobot self-hosted',
    monetization_model: 'SaaS 5-29€/mes por monitores' },

  { github: 'langfuse/langfuse', name: 'Langfuse', brand: 'PACAME Trace',
    license: 'MIT', stars: 9000, category: 'llm-ops', rebrand_value: 'alto',
    description: 'Observabilidad LLM (alt. Weights&Biases para LLMs)',
    monetization_model: 'SaaS por evento ingested' },

  // === VOTE / COORDINATION ===
  { github: 'lukevella/rallly', name: 'Rallly', brand: 'PACAME Vote',
    license: 'AGPL', stars: 4000, category: 'coordination', rebrand_value: 'medio',
    description: 'Alt. Doodle para coordinar reuniones',
    monetization_model: 'SaaS freemium + workspace' },

  // === AI / LLM TOOLS ===
  { github: 'ollama/ollama', name: 'Ollama', brand: 'PACAME Local LLM',
    license: 'MIT', stars: 100000, category: 'llm-local', rebrand_value: 'medio',
    description: 'Run LLMs locally',
    monetization_model: 'Cloud hosting + enterprise' },

  { github: 'mudler/LocalAI', name: 'LocalAI', brand: 'PACAME Private AI',
    license: 'MIT', stars: 26000, category: 'llm-local', rebrand_value: 'alto',
    description: 'OpenAI API-compatible local',
    monetization_model: 'Hosting + enterprise' },

  // === SCHEDULING / AVAILABILITY ===
  { github: 'documenso/documenso', name: 'Documenso', brand: 'PACAME Sign',
    license: 'AGPL', stars: 9000, category: 'e-signature', rebrand_value: 'alto',
    description: 'Alt. DocuSign open source',
    monetization_model: 'SaaS por firma + team plans' },

  // === CUSTOMER SUPPORT ===
  { github: 'chatwoot/chatwoot', name: 'Chatwoot', brand: 'PACAME Support',
    license: 'MIT', stars: 24000, category: 'customer-support', rebrand_value: 'alto',
    description: 'Alt. Intercom open source',
    monetization_model: 'Hosting + conversations tier' },
];

/**
 * Devuelve hasta N candidatos con rebrand_value no bajo + licencia permisiva.
 * Rota pseudo-aleatoriamente usando la fecha del día.
 */
export function pickDailyOssSeeds(n = 5, now = new Date()): OSSCandidate[] {
  const filtered = OSS_CATALOG.filter(o =>
    o.rebrand_value !== 'bajo' &&
    ['MIT', 'Apache-2.0', 'BSD', 'BSL'].includes(o.license)
  );
  // Orden pseudo-aleatorio por seed diario (consistente dentro del mismo día)
  const seed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
  const sorted = [...filtered].sort((a, b) => {
    const ha = hashString(a.github + seed);
    const hb = hashString(b.github + seed);
    return ha - hb;
  });
  return sorted.slice(0, n);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Client materializer — convierte una plantilla sector + datos cliente
 * en un set de archivos físicos listos para desplegar.
 *
 * Lee los archivos plantilla del filesystem (templates/sector/<slug>/),
 * los renderiza con las variables del cliente, y produce:
 *
 *   {
 *     files: [
 *       { path: 'web/.env.example',                 content: '...' },
 *       { path: 'web/lib/business-config.ts',       content: '...' },
 *       { path: 'n8n/workflows/01-confirmar.json',  content: '{...}' },
 *       { path: 'vapi/assistant-config.json',       content: '{...}' },
 *       { path: 'supabase/seed-tenant.sql',         content: '...' },
 *       { path: 'README-DESPLIEGUE.md',             content: '...' },
 *     ],
 *     manifest: { ... },
 *     missing: [],
 *   }
 *
 * NO escribe a disco directamente — eso lo hace el endpoint API que
 * sube a Supabase Storage.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { renderTemplate, slugify } from "./template-renderer";
import type { RenderResult } from "./template-renderer";

export interface ClientInput {
  business_name: string;
  business_type?: string;
  business_legal_name?: string;
  city: string;
  region?: string;
  postal_code?: string;
  street?: string;
  neighborhood?: string;
  phone_whatsapp?: string;
  email_contact?: string;
  cuisine?: string;
  seats_count?: number;
  turn_capacity_lunch?: number;
  turn_capacity_dinner?: number;
  average_ticket_eur?: number;
  language_secondary?: string;
  pets_allowed?: boolean;
  accessibility?: string;
  parking_info?: string;
  opening_hours?: string;
  specialties?: string;
  year_opened?: number;
  owner_name?: string;
  google_my_business_id?: string;
  google_place_id?: string;
  instagram_handle?: string;
  booking_deposit_percentage?: number;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  language_primary?: string;
  goals?: string[];
  current_state?: string;
}

export interface MaterializedFile {
  path: string;
  content: string;
  contentType: string;
  bytes: number;
}

export interface MaterializationResult {
  files: MaterializedFile[];
  slug: string;
  template_id: string;
  missing_vars: string[];
  resolved_vars: string[];
  warnings: string[];
}

const TEMPLATE_BASE_CANDIDATES = [
  path.join(process.cwd(), "..", "templates", "sector"),
  path.join(process.cwd(), "templates", "sector"),
];

async function findTemplateDir(templateId: string): Promise<string> {
  const slug = templateId.replace(/-v\d+$/, "");
  for (const base of TEMPLATE_BASE_CANDIDATES) {
    const candidate = path.join(base, slug);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error(`template ${templateId} not found in any of: ${TEMPLATE_BASE_CANDIDATES.join(", ")}`);
}

async function readTemplateFile(dir: string, file: string): Promise<string> {
  return fs.readFile(path.join(dir, file), "utf8");
}

function buildClientVars(client: ClientInput, slug: string): Record<string, unknown> {
  // Inferencias seguras y defaults para que las plantillas no quiebren
  // con vars opcionales. Cualquier var crítica que falte queda en `missing`.
  const businessSlug = slugify(client.business_name);

  // Datos derivados / inferidos
  const enrichedClient = {
    ...client,
    business_legal_name: client.business_legal_name ?? client.business_name,
    business_type: client.business_type ?? "restaurante",
    slug: businessSlug,
    language_primary: client.language_primary ?? "es",
    language_secondary: client.language_secondary ?? "ninguno",
    pets_allowed: client.pets_allowed ?? false,
    booking_deposit_percentage: client.booking_deposit_percentage ?? 0,
    year_opened: client.year_opened ?? new Date().getFullYear() - 5,
    seats_count: client.seats_count ?? 0,
    turn_capacity_lunch: client.turn_capacity_lunch ?? Math.round((client.seats_count ?? 0) * 1.4),
    turn_capacity_dinner: client.turn_capacity_dinner ?? Math.round((client.seats_count ?? 0) * 1.6),
    average_ticket_eur: client.average_ticket_eur ?? 30,
    accessibility: client.accessibility ?? "Consultar disponibilidad de acceso accesible",
    parking_info: client.parking_info ?? "Consultar zonas de aparcamiento cercanas",
    opening_hours: client.opening_hours ?? "Consultar en web",
    specialties: client.specialties ?? "Consultar carta",
    private_events_info: "Eventos privados disponibles, escalar al humano para propuesta",
    address: [client.street, client.neighborhood, client.city, client.postal_code]
      .filter(Boolean)
      .join(", "),
    address_short: client.street ?? client.city,
    public_transport_short: "Consultar opciones de transporte público local",
    deposit_amount: client.booking_deposit_percentage
      ? `${Math.round(((client.average_ticket_eur ?? 30) * client.booking_deposit_percentage) / 100)} €`
      : "no aplica",
    business_name_short: client.business_name.split(" ").slice(0, 2).join(" "),
    menu_url: `https://${businessSlug}.com/carta`,
    owner_telegram_handle: "owner_handle_pendiente",
  };

  // Variables del despliegue
  const deployment = {
    slug,
    created_at: new Date().toISOString(),
    template_id: "hosteleria-v1",
  };

  // Variables PACAME (constantes)
  const pacame = {
    contact_email: "hola@pacameagencia.com",
    whatsapp: "+34722669381",
    web: "https://pacameagencia.com",
  };

  // Devuelve TODAS las variables del cliente disponibles en root level
  // (compatibilidad con plantillas que usan {{business_name}} directo)
  // Y también bajo el namespace `client.` para uso explícito.
  return {
    ...enrichedClient,
    client: enrichedClient,
    deployment,
    pacame,
  };
}

function envFile(client: ClientInput, slug: string): string {
  return `# Variables de entorno — ${client.business_name}
# Generado por la factoría PACAME el ${new Date().toISOString()}
# Slug del despliegue: ${slug}

# ── Identidad del negocio ─────────────────────────────────
NEXT_PUBLIC_BUSINESS_NAME="${client.business_name}"
NEXT_PUBLIC_BUSINESS_CITY="${client.city}"
NEXT_PUBLIC_BUSINESS_PHONE="${client.phone_whatsapp ?? ""}"
NEXT_PUBLIC_BUSINESS_EMAIL="${client.email_contact ?? ""}"
NEXT_PUBLIC_BUSINESS_INSTAGRAM="${client.instagram_handle ?? ""}"

# ── Supabase (clonar de PACAME inicial) ───────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_TENANT_ID="${slug}"

# ── Vapi (recepcionista IA) ───────────────────────────────
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=
VAPI_ASSISTANT_ID=

# ── Stripe (depósitos reservas) ───────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLIC_KEY=

# ── Comunicación ──────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM="whatsapp:${client.phone_whatsapp ?? "+34..."}"
RESEND_API_KEY=

# ── Google integrations ───────────────────────────────────
GOOGLE_PLACE_ID="${client.google_place_id ?? ""}"
GOOGLE_MY_BUSINESS_LOCATION_ID="${client.google_my_business_id ?? ""}"
GOOGLE_REVIEWS_API_KEY=

# ── Instagram Business ────────────────────────────────────
INSTAGRAM_BUSINESS_ID=
INSTAGRAM_ACCESS_TOKEN=

# ── n8n (workflows) ───────────────────────────────────────
N8N_WEBHOOK_BASE=https://n8n.pacame.es/webhook
N8N_CLIENT_ID="${slug}"

# ── Telegram (alerts al dueño) ────────────────────────────
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=
`;
}

function businessConfigFile(vars: Record<string, unknown>): string {
  const c = vars.client as ClientInput & { slug: string };
  return `// Generated by PACAME factoría on ${new Date().toISOString()}
// Slug: ${c.slug}
// DO NOT edit this file by hand — se regenera al actualizar el despliegue.

export const BUSINESS_CONFIG = {
  name: ${JSON.stringify(c.business_name)},
  legalName: ${JSON.stringify(c.business_legal_name ?? c.business_name)},
  type: ${JSON.stringify(c.business_type ?? "restaurante")},
  city: ${JSON.stringify(c.city)},
  region: ${JSON.stringify(c.region ?? "")},
  neighborhood: ${JSON.stringify(c.neighborhood ?? "")},
  postalCode: ${JSON.stringify(c.postal_code ?? "")},
  street: ${JSON.stringify(c.street ?? "")},
  phone: ${JSON.stringify(c.phone_whatsapp ?? "")},
  email: ${JSON.stringify(c.email_contact ?? "")},
  instagram: ${JSON.stringify(c.instagram_handle ?? "")},
  googlePlaceId: ${JSON.stringify(c.google_place_id ?? "")},
  googleMyBusinessId: ${JSON.stringify(c.google_my_business_id ?? "")},
  cuisine: ${JSON.stringify(c.cuisine ?? "")},
  seatsCount: ${c.seats_count ?? 0},
  turnCapacity: {
    lunch: ${c.turn_capacity_lunch ?? Math.round((c.seats_count ?? 0) * 1.4)},
    dinner: ${c.turn_capacity_dinner ?? Math.round((c.seats_count ?? 0) * 1.6)},
  },
  averageTicketEur: ${c.average_ticket_eur ?? 30},
  yearOpened: ${c.year_opened ?? new Date().getFullYear() - 5},
  language: {
    primary: ${JSON.stringify(c.language_primary ?? "es")},
    secondary: ${JSON.stringify(c.language_secondary ?? null)},
  },
  brand: {
    primary: ${JSON.stringify(c.brand_primary_color ?? "#B54E30")},
    secondary: ${JSON.stringify(c.brand_secondary_color ?? "#283B70")},
  },
  bookingDepositPercentage: ${c.booking_deposit_percentage ?? 0},
  petsAllowed: ${c.pets_allowed ?? false},
  accessibility: ${JSON.stringify(c.accessibility ?? "Consultar")},
  parking: ${JSON.stringify(c.parking_info ?? "Consultar")},
} as const;

export type BusinessConfig = typeof BUSINESS_CONFIG;
`;
}

function vapiAssistantConfig(vars: Record<string, unknown>, prompt: string): string {
  const c = vars.client as ClientInput;
  // Voice ID válido de 11labs. Usamos el de PACAME por defecto (Brian, multilingual_v2).
  // Cliente puede sobreescribir vía VAPI_DEFAULT_VOICE_ID env var.
  const voiceId = process.env.VAPI_DEFAULT_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || "nPczCjzI2devNBz1zQrb";
  return JSON.stringify(
    {
      name: `recepcionista-${slugify(c.business_name)}`,
      firstMessage: `Hola, has llamado a ${c.business_name}, ¿en qué puedo ayudarte?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: c.language_primary ?? "es",
      },
      voice: {
        provider: "11labs",
        voiceId,
        stability: 0.5,
        similarityBoost: 0.75,
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.5,
        systemPrompt: prompt,
        functions: [
          {
            name: "create_booking",
            description: "Crea una reserva confirmada en el sistema",
            parameters: {
              type: "object",
              properties: {
                party_size: { type: "integer" },
                booking_date: { type: "string", format: "date" },
                booking_time: { type: "string" },
                customer_name: { type: "string" },
                customer_phone: { type: "string" },
                notes: { type: "string" },
              },
              required: ["party_size", "booking_date", "booking_time", "customer_name", "customer_phone"],
            },
          },
          {
            name: "escalate_to_human",
            description: "Pasa la conversación al humano",
            parameters: {
              type: "object",
              properties: {
                priority: { type: "string", enum: ["low", "medium", "high"] },
                reason: { type: "string" },
                summary: { type: "string" },
              },
              required: ["priority", "reason"],
            },
          },
        ],
      },
      serverUrl: `https://pacameagencia.com/api/calls/webhook?tenant=${slugify(c.business_name)}`,
      endCallFunctionEnabled: true,
      recordingEnabled: true,
      hipaaEnabled: false,
      backgroundDenoisingEnabled: true,
    },
    null,
    2
  );
}

function n8nWorkflowConfirmReserva(vars: Record<string, unknown>): string {
  const c = vars.client as ClientInput;
  const slug = (vars.deployment as { slug: string }).slug;
  return JSON.stringify(
    {
      name: `[${slug}] confirmar-reserva`,
      nodes: [
        {
          parameters: {
            httpMethod: "POST",
            path: `${slug}/booking-created`,
            responseMode: "lastNode",
            options: {},
          },
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          position: [240, 300],
        },
        {
          parameters: {
            tenant_id: slug,
            table: "bookings",
            operation: "insert",
          },
          name: "Supabase Insert",
          type: "n8n-nodes-base.supabase",
          position: [460, 300],
        },
        {
          parameters: {
            from: `whatsapp:${c.phone_whatsapp ?? ""}`,
            to: "={{$json.customer_phone}}",
            messageType: "text",
            message: `Hola {{$json.customer_name}}, tu reserva está confirmada:\n\n📅 {{$json.booking_date_human}}\n🕐 {{$json.booking_time}}\n👥 {{$json.party_size}} personas\n📍 ${c.street ?? c.city}\n\nSi necesitas modificar algo, responde a este mensaje.\nTe recordamos 2 horas antes.\n\n¡Hasta pronto!\n${c.business_name}`,
          },
          name: "Enviar WhatsApp Confirmación",
          type: "n8n-nodes-base.twilio",
          position: [680, 300],
        },
      ],
      connections: {
        Webhook: { main: [[{ node: "Supabase Insert", type: "main", index: 0 }]] },
        "Supabase Insert": { main: [[{ node: "Enviar WhatsApp Confirmación", type: "main", index: 0 }]] },
      },
      settings: { executionOrder: "v1" },
      tags: [
        { name: "factoria-hosteleria" },
        { name: slug },
      ],
    },
    null,
    2
  );
}

function supabaseSeedTenant(slug: string, businessName: string): string {
  return `-- Seed tenant para ${businessName}
-- Slug: ${slug}
-- Generado por la factoría PACAME el ${new Date().toISOString()}

INSERT INTO clients (
  name,
  business_name,
  business_type,
  email,
  phone,
  status,
  monthly_fee,
  brand_guidelines
) VALUES (
  '${businessName.replace(/'/g, "''")}',
  '${businessName.replace(/'/g, "''")}',
  'hosteleria',
  '',
  '',
  'onboarding',
  149,
  jsonb_build_object(
    'tenant_id', '${slug}',
    'template_id', 'hosteleria-v1'
  )
)
ON CONFLICT DO NOTHING;
`;
}

function readmeDeploy(vars: Record<string, unknown>, plan: unknown): string {
  const c = vars.client as ClientInput;
  const slug = (vars.deployment as { slug: string }).slug;
  return `# Despliegue PACAME · ${c.business_name}

> Generado por la factoría el ${new Date().toLocaleString("es-ES")}
> Slug del despliegue: \`${slug}\`
> Plantilla: \`hosteleria-v1\`

## 0 · Antes de empezar

Recopila los siguientes datos del cliente (los pendientes están marcados con \`?\`):

- Nombre legal del negocio: ${c.business_legal_name ?? "?"}
- Razón social / NIF: ?
- Logo (.svg/.png alta resolución): ?
- Fotos del local (mínimo 8): ?
- Carta actual (PDF o link): ?
- Horarios exactos por día: ${c.opening_hours ?? "?"}
- Especialidades destacadas: ${c.specialties ?? "?"}
- Datos Google My Business (acceso): ?

## 1 · Variables de entorno

Copia \`.env.example\` a \`.env.local\` y rellena las variables vacías. Las que tienen valor por defecto ya vienen del cliente.

\`\`\`bash
cp .env.example .env.local
# editar y completar las vacías
\`\`\`

Variables vacías que necesitas obtener:
- \`NEXT_PUBLIC_SUPABASE_URL\`, \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`, \`SUPABASE_SERVICE_ROLE_KEY\` → Supabase project settings
- \`VAPI_API_KEY\`, \`VAPI_PHONE_NUMBER_ID\` → Vapi dashboard, comprar número español
- \`STRIPE_SECRET_KEY\`, \`STRIPE_WEBHOOK_SECRET\`, \`STRIPE_PUBLIC_KEY\` → Stripe dashboard del cliente
- \`TWILIO_*\` → Twilio o 360dialog (WhatsApp Business)
- \`RESEND_API_KEY\` → Resend con dominio del cliente verificado
- \`GOOGLE_REVIEWS_API_KEY\` → Google Cloud Console, habilitar Places API
- \`INSTAGRAM_*\` → Meta for Developers, app del cliente
- \`TELEGRAM_*\` → Crear bot vía @BotFather

## 2 · Supabase (15 min)

\`\`\`bash
# Aplicar seed del tenant
psql "$DATABASE_URL" -f supabase/seed-tenant.sql
\`\`\`

Crear las tablas multi-tenant (si no existen ya):

\`\`\`bash
psql "$DATABASE_URL" -f supabase/multitenant-tables.sql
\`\`\`

## 3 · Vapi (30 min)

1. Comprar número español en Vapi (~5 €/mes).
2. Importar \`vapi/assistant-config.json\` vía Vapi API:
   \`\`\`bash
   curl -X POST https://api.vapi.ai/assistant \\
     -H "Authorization: Bearer $VAPI_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d @vapi/assistant-config.json
   \`\`\`
3. Asignar el assistant_id resultante a la variable \`VAPI_ASSISTANT_ID\`.
4. Asociar el número al assistant en el dashboard Vapi.

## 4 · n8n (45 min)

\`\`\`bash
# Importar los 6 workflows uno a uno desde la UI de n8n
# o via API:
for f in n8n/workflows/*.json; do
  curl -X POST https://n8n.pacame.es/api/v1/workflows \\
    -H "X-N8N-API-KEY: $N8N_API_KEY" \\
    -H "Content-Type: application/json" \\
    -d @"$f"
done
\`\`\`

Activar cada workflow tras crearlo. Configurar credentials de Twilio, Supabase y Telegram en n8n credentials manager.

## 5 · Vercel (10 min)

\`\`\`bash
npm install
vercel link --project pacame-${slug}
vercel env pull .env.local  # si has subido las env a Vercel
vercel --prod
\`\`\`

Configurar dominio custom del cliente en Vercel Dashboard → Domains.

## 6 · Google My Business (15 min)

1. Reclamar / verificar el local en Google Business Profile.
2. Activar reservas vía link directo a la web del cliente.
3. Configurar respuestas automáticas de mensajes (opcional, vía API).

## 7 · Stripe (10 min)

1. Crear producto "Depósito reserva" si \`booking_deposit_percentage > 0\`.
2. Webhook endpoint: \`https://[dominio-cliente]/api/stripe/webhook\`.
3. Eventos: \`checkout.session.completed\`, \`payment_intent.succeeded\`.

## 8 · Validación end-to-end

Antes de entregar al cliente:

- [ ] Web carga sin errores en /
- [ ] Reserva de prueba se crea en bookings
- [ ] WhatsApp de confirmación llega al teléfono de prueba
- [ ] Recordatorio 2h antes funciona (forzar fecha próxima en n8n)
- [ ] NPS post-visita se envía
- [ ] Recepcionista IA responde por voz (llamar al número Vapi)
- [ ] Recepcionista IA responde por WhatsApp
- [ ] Dashboard interno carga métricas básicas
- [ ] Stripe checkout (si aplica) procesa cobro

## 9 · Handoff al cliente

- [ ] Sesión de training 90 min con dueño y equipo de sala
- [ ] Documentación PDF entregada
- [ ] Credenciales en gestor de contraseñas del cliente
- [ ] Plan de mantenimiento mensual firmado (149 €/mes)

## Plan completo de SAGE

\`\`\`json
${JSON.stringify(plan, null, 2)}
\`\`\`

---

Para soporte interno PACAME: \`hola@pacameagencia.com\` · WhatsApp \`+34 722 669 381\`.
`;
}

/**
 * Materializa una plantilla sector + datos cliente en archivos físicos.
 *
 * No escribe a disco — devuelve los archivos en memoria. El endpoint API
 * los sube a Supabase Storage.
 */
export async function materializeClient(input: {
  template_id: string;
  client: ClientInput;
  plan?: unknown;
}): Promise<MaterializationResult> {
  const { template_id, client, plan } = input;

  if (!client.business_name || !client.city) {
    throw new Error("client.business_name and client.city are required");
  }

  const slug = `${slugify(client.business_name)}-${slugify(client.city)}`;
  const templateDir = await findTemplateDir(template_id);

  // Cargar plantillas markdown
  const [agentePromptRaw] = await Promise.all([
    readTemplateFile(templateDir, "agente-recepcionista-ia.md"),
  ]);

  const vars = buildClientVars(client, slug);
  const warnings: string[] = [];
  const allMissing = new Set<string>();
  const allResolved = new Set<string>();

  // Render del prompt del agente IA — extraer SOLO la sección "System prompt"
  // que está dentro de un bloque de código markdown (entre ``` y ```).
  const systemPromptMatch = agentePromptRaw.match(/```\n([\s\S]+?)\n```/);
  let agentePrompt = "";
  if (systemPromptMatch) {
    const renderedPrompt = renderTemplate(systemPromptMatch[1], vars);
    agentePrompt = renderedPrompt.output;
    renderedPrompt.missingVars.forEach((v) => allMissing.add(v));
    renderedPrompt.resolvedVars.forEach((v) => allResolved.add(v));
  } else {
    warnings.push("agente-recepcionista-ia.md: bloque de system prompt no encontrado");
  }

  // Construir archivos
  const files: MaterializedFile[] = [];

  function addFile(filePath: string, content: string, contentType: string) {
    files.push({
      path: filePath,
      content,
      contentType,
      bytes: Buffer.byteLength(content, "utf8"),
    });
  }

  addFile(`${slug}/.env.example`, envFile(client, slug), "text/plain");
  addFile(`${slug}/web/lib/business-config.ts`, businessConfigFile(vars), "text/plain");
  addFile(`${slug}/vapi/assistant-config.json`, vapiAssistantConfig(vars, agentePrompt), "application/json");
  addFile(`${slug}/vapi/system-prompt.md`, agentePrompt, "text/markdown");
  addFile(`${slug}/n8n/workflows/01-confirmar-reserva.json`, n8nWorkflowConfirmReserva(vars), "application/json");
  addFile(`${slug}/supabase/seed-tenant.sql`, supabaseSeedTenant(slug, client.business_name), "application/sql");
  addFile(`${slug}/README-DESPLIEGUE.md`, readmeDeploy(vars, plan), "text/markdown");

  // Snapshot de la plantilla original para auditoría
  addFile(`${slug}/_template-snapshot/MANIFEST.md`, await readTemplateFile(templateDir, "MANIFEST.md"), "text/markdown");
  addFile(`${slug}/_template-snapshot/copy-blocks.md`, await readTemplateFile(templateDir, "copy-blocks.md"), "text/markdown");
  addFile(`${slug}/_template-snapshot/seo-keywords.md`, await readTemplateFile(templateDir, "seo-keywords.md"), "text/markdown");
  addFile(`${slug}/_template-snapshot/automation-n8n.md`, await readTemplateFile(templateDir, "automation-n8n.md"), "text/markdown");

  return {
    files,
    slug,
    template_id,
    missing_vars: Array.from(allMissing),
    resolved_vars: Array.from(allResolved),
    warnings,
  };
}

/**
 * POST /api/factoria/template-deploy
 *
 * FASE D — Plantilla de entrega por sector.
 *
 * Recibe:
 *   { template_id: 'hosteleria-v1', client: { business_name, city, ... } }
 *
 * Hace:
 *   1. Lee plantilla desde templates/sector/<slug>/
 *   2. SAGE personaliza (LLM tier=titan) generando plan de despliegue específico
 *      del cliente con variables resueltas + estimación de tiempos por agente.
 *   3. Persiste en Supabase tabla `client_deployments`.
 *   4. Devuelve el plan de despliegue como JSON estructurado.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { llmChat } from "@/lib/llm";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { cacheGetById } from "@/lib/factoria/intake-cache";
import type { BrandBrief } from "@/lib/factoria/firecrawl-brand";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ClientInput {
  business_name: string;
  business_type?: string;
  city: string;
  neighborhood?: string;
  phone_whatsapp?: string;
  email_contact?: string;
  cuisine?: string;
  seats_count?: number;
  current_state?: string;
  goals?: string[];
  language_secondary?: string;
  /** FASE H: si presente, prefilla brand_primary_color y contact en el plan SAGE */
  brand_brief?: BrandBrief;
}

interface DeploymentPlan {
  client_summary: string;
  deployment_phases: { phase: string; days: string; deliverables: string[]; agents: string[] }[];
  pricing: {
    setup_eur: number;
    monthly_eur: number;
    rationale: string;
    addons: { name: string; eur: number; optional: boolean }[];
  };
  immediate_next_steps: string[];
  expected_outcomes_90_days: { metric: string; baseline: string; target: string }[];
  risks_and_mitigations: { risk: string; mitigation: string }[];
}

const TEMPLATE_DIR = path.join(process.cwd(), "..", "templates", "sector");
// Fallback en caso de que el cwd sea distinto en producción.
const TEMPLATE_DIR_ALT = path.join(process.cwd(), "templates", "sector");

async function readTemplateFiles(templateId: string): Promise<string> {
  const slug = templateId.replace(/-v\d+$/, "");
  const candidates = [path.join(TEMPLATE_DIR, slug), path.join(TEMPLATE_DIR_ALT, slug)];

  let baseDir: string | null = null;
  for (const c of candidates) {
    try {
      await fs.access(c);
      baseDir = c;
      break;
    } catch {
      // probar siguiente
    }
  }
  if (!baseDir) {
    throw new Error(`template ${templateId} not found in ${candidates.join(" or ")}`);
  }

  const files = ["MANIFEST.md", "agente-recepcionista-ia.md", "seo-keywords.md", "automation-n8n.md", "copy-blocks.md"];
  const parts: string[] = [];
  for (const f of files) {
    try {
      const content = await fs.readFile(path.join(baseDir, f), "utf8");
      parts.push(`### FILE: ${f}\n\n${content}`);
    } catch {
      // archivo opcional
    }
  }
  return parts.join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `Eres SAGE, agente PACAME que personaliza plantillas de la factoría para clientes específicos.

Recibes una plantilla de sector (manifest + copy + automatización + SEO + agente IA) y los datos de un cliente concreto.

Tu trabajo: generar el PLAN DE DESPLIEGUE personalizado para ese cliente, en formato JSON estricto:

{
  "client_summary": "string (3-4 frases que resumen al cliente, su contexto y por qué la plantilla aplica)",
  "deployment_phases": [
    { "phase": "Día 0-3 · Setup", "days": "0-3", "deliverables": ["..."], "agents": ["DIOS", "..."] },
    ...
  ],
  "pricing": {
    "setup_eur": number,
    "monthly_eur": number,
    "rationale": "string corto explicando por qué este precio para este cliente",
    "addons": [ { "name": "...", "eur": number, "optional": true } ]
  },
  "immediate_next_steps": ["3-5 pasos concretos para el día 1"],
  "expected_outcomes_90_days": [
    { "metric": "Reservas online/mes", "baseline": "10-20", "target": "80-150" }
  ],
  "risks_and_mitigations": [
    { "risk": "...", "mitigation": "..." }
  ]
}

Reglas:
- NO inventar números fuera del rango del MANIFEST.
- Pricing setup entre 2500-4500 € (Stack default), monthly 149 € por defecto.
- Pricing puede subir/bajar según señales del cliente (volumen, urgencia, complejidad regulatoria).
- Si el cliente no ha dado dato crítico (city, business_name), pedir que se complete antes.
- Tono: directo, español, tutea al cliente, frases cortas.
- Solo JSON, sin markdown fences, sin texto antes ni después.`;

function buildUserPrompt(templateContent: string, client: ClientInput): string {
  return `PLANTILLA SECTOR:

${templateContent}

---

CLIENTE A DESPLEGAR:

${JSON.stringify(client, null, 2)}

Genera el JSON del plan de despliegue.`;
}

function tryParseJson(text: string): DeploymentPlan | null {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(cleaned.slice(first, last + 1)) as DeploymentPlan;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  let body: { template_id?: string; client?: ClientInput; brief_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { template_id, brief_id } = body;
  let client = body.client;

  // FASE H: si llega brief_id, hidratamos campos client desde la cache.
  // Permite que el caller pase solo {brief_id, template_id, client:{city}} y el
  // resto se rellene del BrandBrief.
  if (brief_id) {
    const row = await cacheGetById(brief_id);
    if (!row) {
      return NextResponse.json({ error: `brief_id ${brief_id} not found in cache` }, { status: 404 });
    }
    const brief = row.brief_json;
    client = {
      business_name: client?.business_name || brief.business_name,
      city: client?.city || "",
      ...client,
      email_contact: client?.email_contact ?? brief.contact?.email,
      phone_whatsapp: client?.phone_whatsapp ?? brief.contact?.phone,
      brand_brief: brief,
    } as ClientInput;
  }

  if (!template_id || !client?.business_name || !client?.city) {
    return NextResponse.json(
      { error: "template_id, client.business_name and client.city required (provee city aunque uses brief_id)" },
      { status: 400 }
    );
  }

  let templateContent: string;
  try {
    templateContent = await readTemplateFiles(template_id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 404 }
    );
  }

  const llmRes = await llmChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(templateContent, client) },
    ],
    {
      tier: "titan",
      maxTokens: 2500,
      temperature: 0.3,
      agentId: "sage",
      source: "factoria-template-deploy",
      metadata: { template_id, business_name: client.business_name, city: client.city },
    }
  );

  const plan = tryParseJson(llmRes.content);
  if (!plan) {
    return NextResponse.json(
      { error: "LLM returned invalid JSON", raw: llmRes.content },
      { status: 502 }
    );
  }

  // Persistir en Supabase (tabla opcional — si no existe, retornamos sin error).
  try {
    const supabase = createServerSupabase();
    await supabase.from("client_deployments").insert({
      template_id,
      business_name: client.business_name,
      city: client.city,
      client_data: client,
      plan,
      llm_provider: llmRes.provider,
      llm_model: llmRes.model,
      created_at: new Date().toISOString(),
    });
  } catch {
    // ok si no existe la tabla — la migration la crea más tarde
  }

  return NextResponse.json({
    ok: true,
    template_id,
    client: { business_name: client.business_name, city: client.city },
    plan,
    provider: llmRes.provider,
    model: llmRes.model,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    available_templates: [
      {
        id: "hosteleria-v1",
        sector: "hostelería",
        subverticals: ["restaurante", "bar", "cafetería", "cervecería", "bistró", "food truck", "chiringuito"],
        tier_default: "stack",
        timeline_days: { min: 15, max: 30 },
        agents: ["DIOS", "PIXEL", "NEXUS", "PULSE", "COPY", "CORE", "SAGE", "LENS"],
      },
    ],
  });
}

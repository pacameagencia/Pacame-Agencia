/**
 * Vapi API wrapper genérico (asistentes, transcripciones, números).
 * Para flujos de factoría usa lib/factoria/deploy/vapi.ts (que persiste deploy_log).
 */

const VAPI_BASE = "https://api.vapi.ai";

function authHeaders() {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) throw new Error("VAPI_API_KEY no configurada");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export interface VapiAssistantConfig {
  name: string;
  firstMessage?: string;
  model?: {
    provider: "openai" | "anthropic" | "google";
    model: string;
    messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
  };
  voice?: {
    provider: "11labs" | "azure" | "playht";
    voiceId: string;
    model?: string;
  };
  transcriber?: {
    provider: "deepgram" | "talkscriber";
    model?: string;
    language?: string;
  };
  endCallPhrases?: string[];
  recordingEnabled?: boolean;
  metadata?: Record<string, string>;
  serverUrl?: string;
}

export async function createAssistant(config: VapiAssistantConfig): Promise<{ ok: true; id: string; raw: unknown } | { ok: false; error: string; status: number }> {
  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const t = await res.text();
    return { ok: false, status: res.status, error: t.slice(0, 500) };
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) return { ok: false, status: 500, error: "Vapi no devolvió id" };
  return { ok: true, id: json.id, raw: json };
}

export async function updateAssistant(id: string, config: Partial<VapiAssistantConfig>) {
  const res = await fetch(`${VAPI_BASE}/assistant/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const t = await res.text();
    return { ok: false as const, status: res.status, error: t.slice(0, 500) };
  }
  return { ok: true as const, raw: await res.json() };
}

export async function deleteAssistant(id: string) {
  const res = await fetch(`${VAPI_BASE}/assistant/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return { ok: res.ok, status: res.status };
}

export async function getAssistant(id: string) {
  const res = await fetch(`${VAPI_BASE}/assistant/${id}`, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function getCall(callId: string) {
  const res = await fetch(`${VAPI_BASE}/call/${callId}`, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export interface AsesorReceptionistInput {
  asesor_name: string;
  brand: string;
  business_hours?: string; // "L-V 9:00-18:00"
  webhook_url: string;
  metadata: Record<string, string>;
}

export function buildAsesorReceptionistConfig(input: AsesorReceptionistInput): VapiAssistantConfig {
  const systemPrompt = `Eres la asistente virtual del despacho ${input.brand}, atendiendo en nombre de ${input.asesor_name}. Tu trabajo es:
1. Saludar con calidez en español neutro/peninsular y preguntar el motivo de la llamada.
2. Si es un cliente actual: identifícalo por NIF o nombre fiscal, recoge el motivo (factura, gasto, IVA, plazo, duda) y promete que ${input.asesor_name} le devolverá la llamada en menos de 24h.
3. Si es un nuevo cliente potencial: explica qué servicios ofrece el despacho (autónomos, sociedades, IVA, IRPF, asesoría laboral) y pide email + teléfono para enviarle propuesta.
4. Si pide presupuesto: di que el rango va de 60-200€/mes según volumen y que ${input.asesor_name} le confirma con una llamada concreta.
5. Si te piden algo fuera de ámbito o algo urgente legal, transfiere al humano diciendo: "Te paso con ${input.asesor_name} si está disponible, sino te llamamos en máximo 30 minutos".
${input.business_hours ? `Horario del despacho: ${input.business_hours}.` : ""}
NO inventes datos fiscales. NO des consejos legales/fiscales concretos: limítate a recoger info y prometer respuesta del asesor humano.
Cierra siempre confirmando el motivo capturado y agradeciendo la llamada.`;

  return {
    name: `Recepcionista · ${input.brand}`,
    firstMessage: `Despacho ${input.brand}, soy la asistente virtual. ¿En qué puedo ayudarte?`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role: "system", content: systemPrompt }],
    },
    voice: {
      provider: "11labs",
      voiceId: process.env.ELEVENLABS_VOICE_ID || "nPczCjzI2devNBz1zQrb",
      model: "eleven_multilingual_v2",
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "es",
    },
    endCallPhrases: ["adiós", "hasta luego", "muchas gracias eso es todo"],
    recordingEnabled: true,
    metadata: input.metadata,
    serverUrl: input.webhook_url,
  };
}

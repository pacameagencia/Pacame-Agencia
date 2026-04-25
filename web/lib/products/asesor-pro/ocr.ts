/**
 * OCR de tickets/facturas con Gemini Vision.
 *
 * Recibe la imagen como base64 + mimeType, devuelve datos estructurados
 * que el cliente puede revisar antes de guardar el gasto.
 *
 * Modelo: gemini-2.0-flash (rápido, multimodal, gratis hasta cuota)
 * Variable env: GEMINI_API_KEY
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ReceiptOcrResult {
  vendor_name: string | null;
  vendor_nif: string | null;
  expense_date: string | null; // ISO date YYYY-MM-DD
  base_cents: number | null;
  iva_pct: number | null;
  iva_cents: number | null;
  total_cents: number | null;
  currency: string;
  category: string | null;
  confidence: number; // 0..1
  raw_text: string | null;
  warnings: string[];
}

const SYSTEM_PROMPT = `Eres un asistente OCR especializado en tickets y facturas españolas. Extrae datos estructurados de la imagen.

Devuelves SIEMPRE un JSON válido (sin markdown fences, sin texto antes ni después) con este schema:

{
  "vendor_name": "Nombre comercial del establecimiento (string o null)",
  "vendor_nif": "NIF/CIF del emisor si aparece (string A12345678 o B12345678, o null)",
  "expense_date": "YYYY-MM-DD si la fecha es legible, null si no",
  "base_cents": "Base imponible en céntimos (integer) o null",
  "iva_pct": "Porcentaje IVA aplicado: 0|4|10|21 según ley española, o null",
  "iva_cents": "Importe IVA en céntimos o null",
  "total_cents": "Total en céntimos (integer) o null",
  "currency": "EUR" (siempre EUR para España, otra moneda solo si claramente extranjera),
  "category": "Categoría: 'restaurante'|'combustible'|'material'|'transporte'|'alojamiento'|'telefonia'|'suministros'|'otros'",
  "confidence": "Confianza global 0.0-1.0 según legibilidad y completitud",
  "raw_text": "Texto OCR plano (max 500 chars) para auditoría",
  "warnings": ["array de strings con dudas o campos no claros"]
}

Reglas:
- Convierte siempre a céntimos: 12,34 € → 1234
- IVA español típico: 21% general, 10% reducido (hostelería, transporte), 4% superreducido (alimentación básica), 0% exento
- Si vendor_nif no existe en el ticket, devuelve null (no inventes)
- Si la imagen no parece ticket/factura, confidence bajo + warning "no se detecta ticket válido"
- Solo JSON, nada más.`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: { blockReason?: string };
}

export async function extractReceiptOCR(input: {
  imageBase64: string;
  mimeType: string;
}): Promise<ReceiptOcrResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing en env");
  }

  const body = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inline_data: {
              mime_type: input.mimeType,
              data: input.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`gemini ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as GeminiResponse;

  if (data.promptFeedback?.blockReason) {
    throw new Error(`gemini blocked: ${data.promptFeedback.blockReason}`);
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("gemini empty response");
  }

  // Parsear JSON, tolerante a code fences accidentales
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new Error("gemini response no contiene JSON");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned.slice(first, last + 1));
  } catch (err) {
    throw new Error(`JSON parse: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    vendor_name: typeof parsed.vendor_name === "string" ? parsed.vendor_name : null,
    vendor_nif: typeof parsed.vendor_nif === "string" ? parsed.vendor_nif : null,
    expense_date: typeof parsed.expense_date === "string" ? parsed.expense_date : null,
    base_cents: typeof parsed.base_cents === "number" ? parsed.base_cents : null,
    iva_pct: typeof parsed.iva_pct === "number" ? parsed.iva_pct : null,
    iva_cents: typeof parsed.iva_cents === "number" ? parsed.iva_cents : null,
    total_cents: typeof parsed.total_cents === "number" ? parsed.total_cents : null,
    currency: typeof parsed.currency === "string" ? parsed.currency : "EUR",
    category: typeof parsed.category === "string" ? parsed.category : null,
    confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    raw_text: typeof parsed.raw_text === "string" ? parsed.raw_text.slice(0, 500) : null,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
  };
}

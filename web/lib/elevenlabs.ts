/**
 * ElevenLabs TTS wrapper.
 * Modelo por defecto: eleven_multilingual_v2 (mejor para español).
 * Voz por defecto: Brian (premade) si no hay ELEVENLABS_VOICE_ID.
 */

const API = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || "nPczCjzI2devNBz1zQrb"; // Brian
const DEFAULT_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

export interface TTSOptions {
  voice_id?: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
  output_format?: "mp3_44100_128" | "mp3_44100_192" | "mp3_22050_32";
}

export interface TTSResult {
  ok: true;
  audio: ArrayBuffer;
  mime: "audio/mpeg";
  bytes: number;
  voice_id: string;
  model_id: string;
}

export interface TTSError {
  ok: false;
  status: number;
  error: string;
}

export async function textToSpeech(text: string, options: TTSOptions = {}): Promise<TTSResult | TTSError> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { ok: false, status: 500, error: "ELEVENLABS_API_KEY no configurada" };

  const voice = options.voice_id || DEFAULT_VOICE;
  const model = options.model_id || DEFAULT_MODEL;
  const fmt = options.output_format || "mp3_44100_128";

  const body = {
    text,
    model_id: model,
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarity_boost ?? 0.75,
      style: options.style ?? 0.0,
      use_speaker_boost: options.use_speaker_boost ?? true,
    },
  };

  const res = await fetch(`${API}/text-to-speech/${voice}?output_format=${fmt}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: text || `ElevenLabs ${res.status}` };
  }

  const audio = await res.arrayBuffer();
  return {
    ok: true,
    audio,
    mime: "audio/mpeg",
    bytes: audio.byteLength,
    voice_id: voice,
    model_id: model,
  };
}

export async function listVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": apiKey } });
  if (!res.ok) return null;
  return res.json();
}

export function buildInvoiceSummary(input: {
  number: string;
  series?: string | null;
  customer: string;
  total_eur: number;
  iva_eur: number;
  base_eur: number;
  issue_date: string;
}): string {
  const date = new Date(input.issue_date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const numero = input.series ? `${input.series} ${input.number}` : input.number;
  return [
    `Resumen de la factura ${numero} emitida el ${date}.`,
    `Destinatario: ${input.customer}.`,
    `Base imponible: ${input.base_eur.toFixed(2)} euros.`,
    `IVA repercutido: ${input.iva_eur.toFixed(2)} euros.`,
    `Total: ${input.total_eur.toFixed(2)} euros.`,
    `Recuerda guardar el justificante de pago para tu próxima declaración.`,
  ].join(" ");
}

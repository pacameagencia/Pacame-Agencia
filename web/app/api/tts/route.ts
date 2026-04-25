/**
 * /api/tts — Text-to-Speech del Compañero PACAME.
 *
 * Cascada de proveedores (intenta por orden hasta que uno funcione):
 *   1) ElevenLabs — si ELEVENLABS_API_KEY (voz premium clonada)
 *   2) OpenAI TTS tts-1-hd — si OPENAI_API_KEY + sin 429 (voces naturales)
 *   3) Microsoft Edge TTS — gratis, sin auth, voces Neural españolas alta calidad
 *   4) Google Translate TTS — fallback universal (mp3, gratis, calidad media)
 *
 * POST { text: string, voice?: string } → audio/mpeg
 *
 * El cliente siempre recibe audio válido (nunca depende de SpeechSynthesis del browser
 * salvo fallo total de red).
 */
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// === Rate limit por IP + límite total de chars/min ===
// Defensa contra abuso: TTS público consume cuota ElevenLabs (10k chars/mes free).
// Un atacante con scripts podría agotarla en minutos sin esto.
const TTS_WINDOW_MS = 60_000;        // ventana 1 min
const TTS_MAX_REQUESTS = 8;          // 8 requests / min / IP
const TTS_MAX_CHARS_PER_IP = 2400;   // 2400 chars / min / IP (≈4 frases largas)
type TtsBucket = { count: number; chars: number; resetAt: number };
const ttsBuckets = new Map<string, TtsBucket>();
function ttsRateLimit(ip: string, charsLen: number): { ok: boolean; reason?: string } {
  const now = Date.now();
  const b = ttsBuckets.get(ip);
  if (!b || now > b.resetAt) {
    ttsBuckets.set(ip, { count: 1, chars: charsLen, resetAt: now + TTS_WINDOW_MS });
    return { ok: true };
  }
  if (b.count >= TTS_MAX_REQUESTS) return { ok: false, reason: "too_many_requests" };
  if (b.chars + charsLen > TTS_MAX_CHARS_PER_IP) return { ok: false, reason: "char_quota_exceeded" };
  b.count++;
  b.chars += charsLen;
  return { ok: true };
}

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
// Brian — voz premade masculina grave, funciona en free tier (multilingual_v2).
// Cuando Pablo suba el tier puede poner una custom: ej. YXGHKitgIMeIV5gGeQvP.
const ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE_ID || "nPczCjzI2devNBz1zQrb";
// multilingual_v2 es compatible con premade voices en free tier (turbo_v2_5 no lo es)
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Mapeo preset-id → voice_id premade (todos multilingüe, hablan español bien)
const ELEVEN_VOICE_MAP: Record<string, string> = {
  onyx: "nPczCjzI2devNBz1zQrb",   // Brian — deep, resonant male (PACAME default)
  ash: "pNInz6obpgDQGcFmaJgB",    // Adam — dominant, firm
  echo: "JBFqnCBsd6RMkjVDRZzb",   // George — warm storyteller
  ballad: "cjVigY5qzO86Huf0OWal", // Eric — smooth, trustworthy
  sage: "pqHfZKP75CvOlQylNhV4",   // Bill — wise, mature
  nova: "cgSgspJ2msm6clMCkdW9",   // Jessica — playful bright female
  shimmer: "EXAVITQu4vr4xnSDxMaL",// Sarah — mature reassuring female
  coral: "hpp4J3VqNfWAUOO0d1Us",  // Bella — professional bright female
  alloy: "XrExE9yKIg1WjnnlVkGX",  // Matilda — knowledgable female
  // Lucía — voz default de PACAME GPT (español de España, femenina mid-30s).
  // ElevenLabs no tiene premade nativas ES-ES; con multilingual_v2 cualquier voz
  // habla español pero el acento mejor para castellano neutro lo da Sarah.
  // Si Pablo activa una voz ES-ES clonada → setear ELEVENLABS_LUCIA_VOICE_ID en Vercel
  // y se usa en lugar de la premade.
  lucia: process.env.ELEVENLABS_LUCIA_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
};

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== "string") {
      return json({ error: "text required" }, 400);
    }
    // Limitar a 1200 chars: ElevenLabs free tier consume cuota muy rápido.
    // El compañero responde con maxTokens 220 (≈ 600 chars), sobra margen.
    const clean = text.slice(0, 1200);

    // Rate limit por IP — protege la cuota de ElevenLabs de abuso público
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    const rl = ttsRateLimit(ip, clean.length);
    if (!rl.ok) {
      return json({ error: "rate_limited", reason: rl.reason }, 429);
    }

    const errors: string[] = [];

    // ─── Modo PACAME GPT (voice="lucia") ───────────────────────────────────
    // Cascada distinta: priorizamos voces NATIVAS castellanas garantizadas
    // sobre voces multilingual americanas que "hablan español".
    //
    // Orden:
    //   1. ElevenLabs Lucía custom (solo si Pablo configuró ELEVENLABS_LUCIA_VOICE_ID)
    //   2. Edge es-ES-ElviraNeural (gratis, castellano nativo, calidad alta)
    //   3. Google Translate TTS (gratis, castellano por defecto, calidad media)
    //   4. OpenAI shimmer (calidad alta pero acento americano)
    //   5. ElevenLabs Sarah (último recurso — americana hablando español)
    //
    // Justificación: en local Windows el WebSocket de Edge a veces falla.
    // Google Translate, aunque robótica, suena 100% castellana — mejor que
    // Sarah multilingual_v2 para el oído del español de pie.
    if (voice === "lucia") {
      const wantElevenFirst = !!process.env.ELEVENLABS_LUCIA_VOICE_ID && !!ELEVENLABS_KEY;

      if (wantElevenFirst) {
        try {
          const audio = await ttsElevenLabs(clean, voice);
          return audioResponse(audio, "elevenlabs-lucia-custom");
        } catch (e: any) {
          errors.push(`elevenlabs-custom:${e.message}`);
        }
      }

      try {
        const audio = await ttsEdge(clean, voice);
        return audioResponse(audio, "edge-microsoft");
      } catch (e: any) {
        errors.push(`edge:${e.message}`);
      }

      try {
        const audio = await ttsGoogleTranslate(clean);
        return audioResponse(audio, "google-translate");
      } catch (e: any) {
        errors.push(`google-translate:${e.message}`);
      }

      if (OPENAI_KEY) {
        try {
          const audio = await ttsOpenAI(clean, "shimmer");
          return audioResponse(audio, "openai");
        } catch (e: any) {
          errors.push(`openai:${e.message}`);
        }
      }

      if (ELEVENLABS_KEY && !wantElevenFirst) {
        try {
          const audio = await ttsElevenLabs(clean, voice);
          return audioResponse(audio, "elevenlabs");
        } catch (e: any) {
          errors.push(`elevenlabs:${e.message}`);
        }
      }

      return json({ error: "Lucía sin voz disponible", details: errors }, 502);
    }

    // ─── Modo legacy (voice ≠ "lucia"): cascada original ──────────────────
    if (ELEVENLABS_KEY) {
      try {
        const audio = await ttsElevenLabs(clean, voice);
        return audioResponse(audio, "elevenlabs");
      } catch (e: any) {
        errors.push(`elevenlabs:${e.message}`);
      }
    }

    if (OPENAI_KEY) {
      try {
        const audio = await ttsOpenAI(clean, voice || "onyx");
        return audioResponse(audio, "openai");
      } catch (e: any) {
        errors.push(`openai:${e.message}`);
      }
    }

    try {
      const audio = await ttsEdge(clean, voice);
      return audioResponse(audio, "edge-microsoft");
    } catch (e: any) {
      errors.push(`edge:${e.message}`);
    }

    try {
      const audio = await ttsGoogleTranslate(clean);
      return audioResponse(audio, "google-translate");
    } catch (e: any) {
      errors.push(`google-translate:${e.message}`);
    }

    return json({ error: "All TTS providers failed", details: errors }, 502);
  } catch (err: any) {
    return json({ error: err?.message || "TTS error" }, 500);
  }
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function audioResponse(buf: ArrayBuffer, provider: string) {
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-TTS-Provider": provider,
    },
  });
}

// --- ElevenLabs ---
async function ttsElevenLabs(text: string, voicePref?: string): Promise<ArrayBuffer> {
  const voiceId = (voicePref && ELEVEN_VOICE_MAP[voicePref]) || ELEVENLABS_VOICE;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.4, use_speaker_boost: true },
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${t.slice(0, 120)}`);
  }
  return await res.arrayBuffer();
}

// --- OpenAI ---
async function ttsOpenAI(text: string, voice: string): Promise<ArrayBuffer> {
  const valid = new Set(["alloy", "ash", "ballad", "coral", "echo", "nova", "onyx", "sage", "shimmer"]);
  const v = valid.has(voice) ? voice : "onyx";
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY!}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1-hd", voice: v, input: text, response_format: "mp3", speed: 1.05 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status}${t.includes("quota") ? " quota" : ""}`);
  }
  return await res.arrayBuffer();
}

// --- Microsoft Edge TTS (WebSocket, gratis, voces Neural) ---
// Voices ES soportadas: es-ES-ElviraNeural (F), es-ES-AlvaroNeural (M),
//   es-MX-JorgeNeural, es-MX-DaliaNeural, es-US-AlonsoNeural...
async function ttsEdge(text: string, voicePref?: string): Promise<ArrayBuffer> {
  const WebSocket = (await import("ws")).default;
  const voiceMap: Record<string, string> = {
    onyx: "es-ES-AlvaroNeural",
    nova: "es-ES-ElviraNeural",
    ballad: "es-ES-ElviraNeural",
    echo: "es-ES-AlvaroNeural",
    sage: "es-ES-ElviraNeural",
    alloy: "es-ES-AlvaroNeural",
    coral: "es-ES-ElviraNeural",
    ash: "es-ES-AlvaroNeural",
    shimmer: "es-ES-ElviraNeural",
    // Lucía → voz castellana femenina nativa de Microsoft (gratis, calidad alta).
    // Es el plan B garantizado si ElevenLabs falla o agota cuota.
    lucia: "es-ES-ElviraNeural",
  };
  const voice = voiceMap[voicePref || ""] || "es-ES-AlvaroNeural";

  const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

  const connectionId = randomHex(32);
  const requestId = randomHex(32);
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='es-ES'>
    <voice name='${voice}'><prosody pitch='+0Hz' rate='+5%' volume='+0%'>${escapeXml(text)}</prosody></voice>
  </speak>`.trim();

  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const ws = new WebSocket(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      },
    });

    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("timeout"));
    }, 15000);

    ws.on("open", () => {
      const configMsg =
        `X-Timestamp:${new Date().toISOString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMsg);

      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date().toISOString()}\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    });

    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        // Los frames binarios llevan un prefijo con headers separados por \r\n\r\n
        const headerLenBuf = data.subarray(0, 2);
        const headerLen = headerLenBuf.readUInt16BE(0);
        const audioChunk = data.subarray(2 + headerLen);
        if (audioChunk.length > 0) chunks.push(audioChunk);
      } else {
        const msg = data.toString("utf-8");
        if (msg.includes("Path:turn.end")) {
          clearTimeout(timeout);
          try { ws.close(); } catch {}
          if (chunks.length === 0) return reject(new Error("no audio received"));
          const merged = Buffer.concat(chunks);
          resolve(merged.buffer.slice(merged.byteOffset, merged.byteOffset + merged.byteLength) as ArrayBuffer);
        }
      }
    });

    ws.on("error", (err: Error) => { clearTimeout(timeout); reject(err); });
    ws.on("close", () => { clearTimeout(timeout); if (chunks.length === 0) reject(new Error("closed without audio")); });
  });
}

// --- Google Translate TTS (chunked, ~200 chars por request) ---
async function ttsGoogleTranslate(text: string): Promise<ArrayBuffer> {
  const chunks = chunkForTranslate(text, 180);
  const buffers: ArrayBuffer[] = [];
  for (const c of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(c)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    buffers.push(await res.arrayBuffer());
  }
  // Concatenar MP3s
  const total = buffers.reduce((s, b) => s + b.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of buffers) {
    out.set(new Uint8Array(b), off);
    off += b.byteLength;
  }
  return out.buffer;
}

function chunkForTranslate(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const parts = text.split(/([.!?]+\s+)/);
  const chunks: string[] = [];
  let current = "";
  for (const p of parts) {
    if ((current + p).length > maxLen && current) {
      chunks.push(current);
      current = p;
    } else {
      current += p;
    }
  }
  if (current) chunks.push(current);
  // Segunda pasada: si algún chunk sigue siendo largo, corta por palabras
  return chunks.flatMap((c) => {
    if (c.length <= maxLen) return [c];
    const words = c.split(" ");
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).length > maxLen && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + " " + w : w;
      }
    }
    if (cur) out.push(cur);
    return out;
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

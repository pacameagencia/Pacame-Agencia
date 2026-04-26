/**
 * POST /api/products/promptforge/audio
 *
 * Convierte texto a audio MP3 con ElevenLabs (multilingual_v2, voz Brian por defecto).
 * Persistimos la generación y devolvemos un object URL servible vía /audio.
 *
 * Body: { text: string, voice_id?: string, prompt_id?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireProductUser } from "@/lib/products/session";
import { getActiveSubscription } from "@/lib/products/subscriptions";
import { textToSpeech } from "@/lib/elevenlabs";
import { createServerSupabase } from "@/lib/supabase/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "promptforge-audio";

export async function POST(request: NextRequest) {
  const user = await requireProductUser("/p/promptforge");
  const subscription = await getActiveSubscription(user.id, "promptforge");
  if (!subscription) return NextResponse.json({ error: "subscription_required" }, { status: 402 });

  let body: { text?: string; voice_id?: string; prompt_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text || text.length < 5) return NextResponse.json({ error: "text_too_short" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "text_too_long" }, { status: 400 });

  const result = await textToSpeech(text, { voice_id: body.voice_id });
  if (!result.ok) {
    return NextResponse.json({ error: "tts_failed", detail: result.error }, { status: result.status });
  }

  const supabase = createServerSupabase();

  // Subir a Storage (bucket público para reproducción simple)
  const hash = crypto.createHash("sha1").update(text + "::" + result.voice_id).digest("hex").slice(0, 16);
  const path = `${user.id}/${hash}.mp3`;

  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {
    /* ya existe */
  });

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(result.audio), {
      contentType: "audio/mpeg",
      upsert: true,
    });

  let publicUrl: string | null = null;
  if (!upErr) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    publicUrl = data.publicUrl;
  }

  const { data: gen } = await supabase
    .from("promptforge_generations")
    .insert({
      user_id: user.id,
      prompt_id: body.prompt_id ?? null,
      modality: "audio",
      provider: "elevenlabs",
      status: "completed",
      prompt_text: text.slice(0, 1000),
      params: { voice_id: result.voice_id, model_id: result.model_id, bytes: result.bytes },
      urls: publicUrl ? [publicUrl] : [],
    })
    .select("id")
    .single();

  if (publicUrl) {
    return NextResponse.json({ ok: true, generation_id: gen?.id, url: publicUrl, bytes: result.bytes });
  }

  // Fallback: devolver base64 si fallo de storage
  const b64 = Buffer.from(result.audio).toString("base64");
  return NextResponse.json({
    ok: true,
    generation_id: gen?.id,
    audio_base64: b64,
    mime: "audio/mpeg",
    bytes: result.bytes,
  });
}

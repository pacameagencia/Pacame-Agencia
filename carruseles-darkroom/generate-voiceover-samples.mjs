#!/usr/bin/env node
/**
 * Genera muestras de voiceover ElevenLabs para teaser PACAME.
 * 3 voces distintas, mismo guión corto (~150 chars cada una).
 * Output: ugc-kit/pack-5-voiceovers/sample-{voice}.mp3
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(__dirname, "ugc-kit", "pack-5-voiceovers");
fs.mkdirSync(OUT_DIR, { recursive: true });

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const KEY = env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Missing ELEVENLABS_API_KEY"); process.exit(1); }

const SCRIPT = "Una agencia de marketing más en España. Hasta que algo cambió. PACAME. Diez agentes. Setecientos noventa y ocho skills. Esto no es una agencia. Es lo siguiente.";

// Voice IDs (3 candidates)
const VOICES = [
  { id: "nPczCjzI2devNBz1zQrb", name: "brian-deep",       label: "Brian · Deep, Resonant (multilingual EN→ES)" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "adam-dominant",    label: "Adam · Dominant, Firm (multilingual)" },
  { id: "gD1IexrzCvsXPHUuT5lZ", name: "sara-pacame-pen",  label: "Sara PACAME · peninsular fem young" },
];

const MODEL = "eleven_multilingual_v2";

async function tts(voiceId, text, outPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status}: ${t.slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

async function main() {
  console.log(`PACAME teaser voiceover · ${VOICES.length} muestras\nGuión (${SCRIPT.length} chars): "${SCRIPT}"\n`);
  let totalChars = 0;
  for (const v of VOICES) {
    const outPath = path.join(OUT_DIR, `sample-${v.name}.mp3`);
    process.stdout.write(`→ ${v.label.padEnd(50)} ... `);
    try {
      const size = await tts(v.id, SCRIPT, outPath);
      console.log(`ok (${(size / 1024).toFixed(0)} KB)`);
      totalChars += SCRIPT.length;
    } catch (err) {
      console.log(`FAIL: ${err.message.slice(0, 200)}`);
    }
  }
  console.log(`\nChars used: ${totalChars} (free tier: ~7219 disponibles antes de esta corrida)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });

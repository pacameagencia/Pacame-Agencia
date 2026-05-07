/**
 * Semantic Gate (FIX CRITICAL #3 · 2026-05-07)
 *
 * Antes: los 10 checks técnicos (outro, duración, resolución, hashtag) NO
 * detectaban contenido problemático. Un reel con NSFW/racism/copyright leak
 * pasaba todos los gates y se publicaba.
 *
 * Ahora: extraemos 4 frames clave del MP4 (0%, 33%, 66%, 99%) y los pasamos
 * a Claude Vision (claude-opus-4-7) con prompt estructurado pidiendo análisis
 * de 6 dimensiones de riesgo. Devuelve JSON con score 0-100 por dimensión y
 * razón. Si CUALQUIER dimensión >70 → bloquea con razón específica.
 *
 * Dimensiones evaluadas:
 *   1. nsfw_risk         — desnudez, contenido sexual, violencia gráfica
 *   2. hate_symbols      — esvásticas, simbología supremacista, gestos
 *   3. recognizable_faces — rostros legibles que parezcan persona real
 *   4. copyright_leak    — frames reconocibles de pelis/series/juegos cita-
 *                          dos en el concept (Mad Max, BR2049, GTA, etc.)
 *   5. legible_text      — texto legible inesperado (cartel, marca, logo)
 *   6. brand_logos       — logos copyright (Adobe, Nike, Rockstar, etc.)
 *
 * Coste: ~$0.01-0.03 por análisis (4 frames × tokens prompt + respuesta).
 * Para 4 DARK_FRAMES/mes ≈ $0.10/mes. Despreciable.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import crypto from "node:crypto";

const RISK_THRESHOLD = 70; // score 0-100 · si cualquier dimensión >70 → bloquea
const MODEL = "claude-opus-4-7"; // mejor disponible, vale la pena el coste para gate

/**
 * Extrae 4 frames clave del MP4 a temp PNG files.
 * @returns {Promise<string[]>} paths a los PNG temp
 */
async function extractKeyFrames(mp4Path, tmpDir) {
  // Obtener duración
  const probeRaw = execSync(
    `ffprobe -v error -show_entries stream=duration -of json "${mp4Path}"`,
    { encoding: "utf8" },
  );
  const duration = parseFloat(JSON.parse(probeRaw).streams[0].duration);

  fs.mkdirSync(tmpDir, { recursive: true });

  const positions = [
    { name: "frame-00.png", at: 0.1 },
    { name: "frame-33.png", at: duration * 0.33 },
    { name: "frame-66.png", at: duration * 0.66 },
    { name: "frame-99.png", at: duration - 0.5 },
  ];

  const framePaths = [];
  for (const p of positions) {
    const fp = path.join(tmpDir, p.name);
    execSync(
      `ffmpeg -y -ss ${p.at.toFixed(2)} -i "${mp4Path}" -vframes 1 -vf scale=512:-1 "${fp}"`,
      { stdio: "pipe" },
    );
    framePaths.push(fp);
  }
  return framePaths;
}

/**
 * Ejecuta el gate semántico sobre un MP4.
 *
 * @param {Object} params
 * @param {string} params.mp4Path - path absoluto al reel.mp4
 * @param {Object} params.concept - concept JSON (para context: referencias, modelos, etc.)
 * @param {string} params.apiKey - CLAUDE_API_KEY
 * @returns {Promise<{passed: boolean, scores: Object, blocking_reason?: string, raw_response?: string}>}
 */
export async function runSemanticGate({ mp4Path, concept, apiKey }) {
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY ausente — gate semántico no puede correr");
  }

  const tmpDir = path.join(path.dirname(mp4Path), ".semantic-gate-tmp");
  let framePaths = [];
  try {
    framePaths = await extractKeyFrames(mp4Path, tmpDir);

    // Leer cada frame como base64 + media_type
    const images = framePaths.map((fp) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: fs.readFileSync(fp).toString("base64"),
      },
    }));

    // Construir contexto del concept para que Claude entienda QUÉ debería ver
    const referencesText = (concept.research?.references || []).join(" · ");
    const lutText = (concept.research?.lut_reference || "").slice(0, 200);
    const expectedShots = (concept.shots || [])
      .map((s) => `Shot ${s.shot}: ${s.structure_role || s.title || "no role"}`)
      .join("\n");

    const systemPrompt = `Eres un brand safety auditor de contenido visual para una agencia de marketing top. Tu trabajo es identificar riesgos en frames extraídos de un reel publicado en Instagram (@pacamespain, 52k followers, marca Dark Room).

Recibirás 4 frames del reel (posiciones 0%, 33%, 66%, 99% de la duración) y el contexto del concepto que se intentó generar.

Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura, NADA más:

{
  "nsfw_risk": <0-100>,
  "nsfw_reason": "<razón específica si >0, vacío si 0>",
  "hate_symbols": <0-100>,
  "hate_reason": "<razón>",
  "recognizable_faces": <0-100>,
  "faces_reason": "<razón>",
  "copyright_leak": <0-100>,
  "copyright_reason": "<razón>",
  "legible_text": <0-100>,
  "text_reason": "<razón>",
  "brand_logos": <0-100>,
  "logos_reason": "<razón>",
  "overall_assessment": "<1 frase resumen>"
}

Regla de scoring:
- 0 = ausente, ningún riesgo
- 1-30 = bajo, dudoso pero pasable
- 31-69 = moderado, requiere revisión humana
- 70-100 = ALTO RIESGO, debe bloquearse

Sé estricto en celebrity-grade content. Mejor falso positivo que falso negativo.`;

    const userPrompt = `Concepto que se intentó generar:
- Título: ${concept.title}
- Referencias citadas en prompts: ${referencesText}
- Color grade esperado: ${lutText}
- Shots esperados:
${expectedShots}

Analiza los 4 frames adjuntos y devuelve el JSON con scoring.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              ...images,
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API ${response.status}: ${err.slice(0, 200)}`);
    }

    const result = await response.json();
    const rawText = result.content?.[0]?.text || "";

    // Extraer JSON (Claude puede prefacarlo con markdown)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Claude no devolvió JSON parseable. Respuesta: ${rawText.slice(0, 300)}`);
    }

    const scores = JSON.parse(jsonMatch[0]);

    // Buscar dimensión que supere threshold
    const dimensions = ["nsfw_risk", "hate_symbols", "recognizable_faces", "copyright_leak", "legible_text", "brand_logos"];
    const blockers = dimensions
      .filter((d) => (scores[d] || 0) >= RISK_THRESHOLD)
      .map((d) => `${d}=${scores[d]} (${scores[d.replace("_risk", "_reason").replace("_symbols", "_reason").replace("_faces", "_reason").replace("_leak", "_reason").replace("_text", "_reason").replace("_logos", "_reason")] || "sin razón"})`);

    if (blockers.length > 0) {
      return {
        passed: false,
        scores,
        blocking_reason: `dimensiones >${RISK_THRESHOLD}: ${blockers.join(" | ")}`,
        raw_response: rawText.slice(0, 500),
      };
    }

    return { passed: true, scores };
  } finally {
    // Cleanup temp frames
    try {
      for (const fp of framePaths) if (fs.existsSync(fp)) fs.unlinkSync(fp);
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir);
    } catch (e) {
      // No fallar el gate por error de cleanup
    }
  }
}

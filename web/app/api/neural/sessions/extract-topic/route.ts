// API: extract-topic — al cerrar un chat de Claude Code, lee el .jsonl,
// resume con LLM (tier economy) tema + decisiones + bloqueos + next steps,
// y agrupa la sesión bajo un thread por topic_slug (fuzzy-match contra
// existentes para evitar fragmentación tipo "shopify-theme" vs "theme-shopify").
//
// Llamado por tools/extract-session-topic.ts vía hook SessionEnd/SessionStart.

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import readline from "node:readline";
import { createServerSupabase } from "@/lib/supabase/server";
import { llmChat, extractJSON } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LAST_TURNS = 12;
const MAX_TEXT_PER_TURN = 1200;
const FUZZY_THRESHOLD = 0.82;
const STOPWORDS_ES = new Set([
  "el", "la", "los", "las", "un", "una", "y", "o", "de", "del", "en", "con",
  "para", "por", "que", "se", "es", "son", "al", "lo", "su", "sus", "mi", "tu",
  "como", "pero", "si", "no", "ya", "muy", "mas", "mas", "este", "esta", "estos",
]);

interface JsonlTurn {
  role: "user" | "assistant" | "system";
  text: string;
  ts?: string;
}

interface ExtractedTopic {
  topic_slug: string;
  topic_title: string;
  summary: string;
  decisions: Array<{ decision: string; severity?: string }>;
  blockers: Array<{ blocker: string; severity: "low" | "medium" | "high" | "critical" }>;
  next_steps: Array<{ step: string; owner: "pablo" | "claude" | "external" }>;
  participants: string[];
  quality_score: number;
}

function redactPII(s: string): string {
  return s
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, "[JWT]")
    .replace(/sk-[a-zA-Z0-9-_]{20,}/g, "[OPENAI_KEY]")
    .replace(/sbp_[a-zA-Z0-9]{20,}/g, "[SUPABASE_PAT]")
    .replace(/Bearer\s+[A-Za-z0-9._-]{20,}/gi, "Bearer [REDACTED]")
    .replace(/(?:password|passwd|pwd|api[_-]?key|secret)[\s:=]+[^\s"'`]{4,}/gi, (m) =>
      m.split(/[\s:=]+/)[0] + "=[REDACTED]"
    );
}

async function readLastTurns(jsonlPath: string, n: number): Promise<JsonlTurn[]> {
  const turns: JsonlTurn[] = [];
  const stream = fs.createReadStream(jsonlPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const evt = JSON.parse(line) as Record<string, unknown>;
      if (evt.type !== "user" && evt.type !== "assistant") continue;
      const message = evt.message as { content?: unknown } | undefined;
      let text = "";
      if (typeof message?.content === "string") {
        text = message.content;
      } else if (Array.isArray(message?.content)) {
        text = (message.content as Array<{ type?: string; text?: string }>)
          .filter((b) => b?.type === "text" && typeof b.text === "string")
          .map((b) => b.text as string)
          .join("\n");
      }
      if (!text || text.length < 5) continue;
      turns.push({
        role: evt.type as "user" | "assistant",
        text: redactPII(text).slice(0, MAX_TEXT_PER_TURN),
        ts: typeof evt.timestamp === "string" ? evt.timestamp : undefined,
      });
    } catch {
      // línea corrupta — ignorar
    }
  }
  return turns.slice(-n);
}

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .split("-")
    .filter((w) => w && !STOPWORDS_ES.has(w))
    .join("-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (!max) return 1;
  return 1 - levenshtein(a, b) / max;
}

const EXTRACT_PROMPT = `Eres un analista que resume conversaciones técnicas de Claude Code en español.
Tu salida DEBE ser un único objeto JSON válido, sin texto antes ni después.

Schema OBLIGATORIO:
{
  "topic_slug": "kebab-case-corto-3-a-6-palabras-relevantes",
  "topic_title": "Título humano del tema (4-10 palabras)",
  "summary": "2-3 frases que capturen de qué fue la conversación.",
  "decisions": [{"decision": "..."}],
  "blockers": [{"blocker": "...", "severity": "low|medium|high|critical"}],
  "next_steps": [{"step": "...", "owner": "pablo|claude|external"}],
  "participants": ["DIOS", "SAGE", ...],
  "quality_score": 0.0-1.0
}

Reglas:
- topic_slug: estable, palabras-clave del tema, sin stopwords.
- decisions/blockers/next_steps: 0 o más items, vacíos si no aplican.
- participants: SÓLO uno o más de [DIOS, SAGE, ATLAS, NEXUS, PIXEL, CORE, PULSE, NOVA, COPY, LENS] que se mencionen explícitamente, o [] si ninguno.
- quality_score: 0.2 charla básica, 0.5 trabajo medio, 0.8 decisiones técnicas con código real, 0.95 conversación crítica con multiples decisiones.
- NO inventes hechos. Si la conversación es muy corta o ruido, devuelve quality_score < 0.3 y arrays vacíos.`;

async function findOrCreateThread(
  supabase: ReturnType<typeof createServerSupabase>,
  extracted: ExtractedTopic,
  sessionId: string
): Promise<{ thread_id: string; topic_slug: string }> {
  const slug = normalizeSlug(extracted.topic_slug || extracted.topic_title);
  if (!slug) throw new Error("topic_slug vacío tras normalizar");

  // 1. Match exacto
  const exact = await supabase
    .from("conversation_threads")
    .select("id, topic_slug, decisions, blockers, next_steps, participants, session_ids, messages_count, summary")
    .eq("topic_slug", slug)
    .maybeSingle();

  let target = exact.data;

  // 2. Match fuzzy contra todos los slugs (límite 200 para perf)
  if (!target) {
    const { data: all } = await supabase
      .from("conversation_threads")
      .select("id, topic_slug, decisions, blockers, next_steps, participants, session_ids, messages_count, summary")
      .limit(500);
    if (all) {
      for (const row of all) {
        if (similarity(slug, row.topic_slug) >= FUZZY_THRESHOLD) {
          target = row;
          break;
        }
      }
    }
  }

  if (target) {
    // Merge: dedup por hash simple del texto principal
    const existingDecisions = (target.decisions as unknown[]) ?? [];
    const existingBlockers = (target.blockers as unknown[]) ?? [];
    const existingNextSteps = (target.next_steps as unknown[]) ?? [];
    const seenD = new Set(existingDecisions.map((d) => JSON.stringify((d as { decision?: string }).decision || "")));
    const seenB = new Set(existingBlockers.map((b) => JSON.stringify((b as { blocker?: string }).blocker || "")));
    const seenN = new Set(existingNextSteps.map((n) => JSON.stringify((n as { step?: string }).step || "")));

    const newDecisions = extracted.decisions
      .map((d) => ({ ...d, taken_at: new Date().toISOString(), session_id: sessionId }))
      .filter((d) => !seenD.has(JSON.stringify(d.decision)));
    const newBlockers = extracted.blockers
      .map((b) => ({ ...b, session_id: sessionId }))
      .filter((b) => !seenB.has(JSON.stringify(b.blocker)));
    const newNextSteps = extracted.next_steps
      .map((s) => ({ ...s, session_id: sessionId }))
      .filter((s) => !seenN.has(JSON.stringify(s.step)));

    const mergedParticipants = Array.from(
      new Set([...((target.participants as string[]) ?? []), ...extracted.participants])
    );
    const mergedSessions = Array.from(
      new Set([...((target.session_ids as string[]) ?? []), sessionId])
    );

    await supabase
      .from("conversation_threads")
      .update({
        decisions: [...existingDecisions, ...newDecisions],
        blockers: [...existingBlockers, ...newBlockers],
        next_steps: [...existingNextSteps, ...newNextSteps],
        participants: mergedParticipants,
        session_ids: mergedSessions,
        messages_count: (target.messages_count ?? 0) + 1,
        summary: extracted.summary,
      })
      .eq("id", target.id);

    return { thread_id: target.id as string, topic_slug: target.topic_slug as string };
  }

  // 3. Crear nuevo
  const { data: created, error } = await supabase
    .from("conversation_threads")
    .insert({
      topic_slug: slug,
      topic_title: extracted.topic_title,
      summary: extracted.summary,
      decisions: extracted.decisions.map((d) => ({
        ...d,
        taken_at: new Date().toISOString(),
        session_id: sessionId,
      })),
      blockers: extracted.blockers.map((b) => ({ ...b, session_id: sessionId })),
      next_steps: extracted.next_steps.map((s) => ({ ...s, session_id: sessionId })),
      participants: extracted.participants,
      session_ids: [sessionId],
      messages_count: 1,
      quality_score: extracted.quality_score,
    })
    .select("id, topic_slug")
    .single();

  if (error || !created) throw new Error(`insert thread fail: ${error?.message}`);
  return { thread_id: created.id, topic_slug: created.topic_slug };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: string; jsonlPath?: string };
    const { sessionId, jsonlPath } = body;
    if (!sessionId || !jsonlPath) {
      return NextResponse.json({ error: "sessionId y jsonlPath requeridos" }, { status: 400 });
    }
    if (!fs.existsSync(jsonlPath)) {
      return NextResponse.json({ error: "jsonlPath no existe" }, { status: 404 });
    }

    const turns = await readLastTurns(jsonlPath, LAST_TURNS);
    if (turns.length < 2) {
      return NextResponse.json({ skipped: true, reason: "menos de 2 turnos" }, { status: 200 });
    }

    const supabase = createServerSupabase();

    // Idempotencia: si esta session_id ya está procesada, saltar
    const existing = await supabase
      .from("conversation_sessions")
      .select("id, topic_slug")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (existing.data) {
      return NextResponse.json({
        skipped: true,
        reason: "ya procesada",
        topic_slug: existing.data.topic_slug,
      });
    }

    const transcript = turns
      .map((t, i) => `[${i + 1}] ${t.role.toUpperCase()}: ${t.text}`)
      .join("\n\n");

    const llmRes = await llmChat(
      [
        { role: "system", content: EXTRACT_PROMPT },
        {
          role: "user",
          content: `Conversación (últimos ${turns.length} turnos):\n\n${transcript}\n\nDevuelve el JSON.`,
        },
      ],
      {
        tier: "economy",
        maxTokens: 1500,
        temperature: 0.2,
        callSite: "neural/sessions/extract-topic",
        brainContext: false,
      }
    );

    const extracted = extractJSON<ExtractedTopic>(llmRes.content);
    if (!extracted || !extracted.topic_title) {
      return NextResponse.json(
        {
          error: "LLM no devolvió JSON válido",
          raw: llmRes.content.slice(0, 500),
          provider: llmRes.provider,
        },
        { status: 502 }
      );
    }

    extracted.decisions = Array.isArray(extracted.decisions) ? extracted.decisions : [];
    extracted.blockers = Array.isArray(extracted.blockers) ? extracted.blockers : [];
    extracted.next_steps = Array.isArray(extracted.next_steps) ? extracted.next_steps : [];
    extracted.participants = Array.isArray(extracted.participants) ? extracted.participants : [];
    extracted.quality_score = Number(extracted.quality_score) || 0.5;

    const { thread_id, topic_slug } = await findOrCreateThread(supabase, extracted, sessionId);

    const sessionInsert = await supabase.from("conversation_sessions").insert({
      thread_id,
      session_id: sessionId,
      topic_slug,
      summary: extracted.summary,
      decisions: extracted.decisions,
      blockers: extracted.blockers,
      next_steps: extracted.next_steps,
      participants: extracted.participants,
      jsonl_path: jsonlPath,
      jsonl_excerpt: transcript.slice(0, 8000),
      turns_count: turns.length,
      started_at: turns[0]?.ts,
      ended_at: turns[turns.length - 1]?.ts,
      metadata: {
        llm_provider: llmRes.provider,
        llm_model: llmRes.model,
        cost_usd: llmRes.costUsd,
        latency_ms: llmRes.latencyMs,
      },
    });

    if (sessionInsert.error) {
      return NextResponse.json(
        { error: `insert session fail: ${sessionInsert.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thread_id,
      topic_slug,
      topic_title: extracted.topic_title,
      decisions_added: extracted.decisions.length,
      blockers_added: extracted.blockers.length,
      next_steps_added: extracted.next_steps.length,
      quality_score: extracted.quality_score,
      cost_usd: llmRes.costUsd,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "unknown" },
      { status: 500 }
    );
  }
}

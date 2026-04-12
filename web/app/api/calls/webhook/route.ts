import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * Vapi Webhook Handler
 *
 * Vapi sends POST requests for call events:
 * - call.started: Call has been initiated
 * - call.ended: Call has ended (includes transcript, duration, cost)
 * - call.analysis: Post-call analysis ready
 * - transcript: Real-time transcript updates
 *
 * Configure this webhook URL in Vapi dashboard:
 * https://app.pacameagencia.com/api/calls/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, call } = body;

    // Vapi sends call data in the `call` field
    const vapiCallId = call?.id;
    const metadata = call?.metadata || {};

    if (!vapiCallId) {
      return NextResponse.json({ ok: true }); // Acknowledge but ignore malformed events
    }

    // --- Call Started ---
    if (type === "call.started") {
      // Update our DB record with the start time
      await supabase.from("voice_calls")
        .update({ outcome: "in_progress" })
        .eq("vapi_call_id", vapiCallId);

      return NextResponse.json({ ok: true });
    }

    // --- Call Ended ---
    if (type === "call.ended") {
      const transcript = call.transcript || "";
      const durationSeconds = call.duration ? Math.round(call.duration) : null;
      const costEur = call.cost ? Number(call.cost) : null;
      const endedReason = call.endedReason || "unknown";

      // Update the call record
      const updateData: Record<string, unknown> = {
        transcript: transcript || null,
        duration_seconds: durationSeconds,
        cost_eur: costEur,
        outcome: endedReason === "customer-ended" ? "Contacto colgo" :
                 endedReason === "assistant-ended" ? "Llamada completada" :
                 endedReason === "voicemail" ? "Buzon de voz" :
                 endedReason === "no-answer" ? "No contesto" :
                 `Finalizada: ${endedReason}`,
      };

      await supabase.from("voice_calls")
        .update(updateData)
        .eq("vapi_call_id", vapiCallId);

      updateAgentStatus("sage", "idle");

      // Auto-summarize with AI if we have a transcript
      if (transcript && CLAUDE_API_KEY) {
        try {
          const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": CLAUDE_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 400,
              messages: [{
                role: "user",
                content: `Analiza esta transcripcion de llamada comercial. Responde SOLO JSON:

TRANSCRIPCION:
${transcript.slice(0, 3000)}

{
  "summary": "resumen en 2-3 frases",
  "sentiment": "positive|neutral|negative",
  "outcome": "resultado principal de la llamada",
  "next_action": "siguiente paso concreto"
}`,
              }],
            }),
          });

          const aiData = await aiRes.json();
          const text = aiData.content?.[0]?.text || "";
          const jsonStart = text.indexOf("{");
          const jsonEnd = text.lastIndexOf("}") + 1;

          if (jsonStart >= 0) {
            const analysis = JSON.parse(text.slice(jsonStart, jsonEnd));
            await supabase.from("voice_calls").update({
              summary: analysis.summary,
              sentiment: analysis.sentiment || "neutral",
              outcome: analysis.outcome,
              next_action: analysis.next_action,
            }).eq("vapi_call_id", vapiCallId);

            // Update lead score based on sentiment
            if (metadata.lead_id) {
              const scoreDelta = analysis.sentiment === "positive" ? 1 :
                                 analysis.sentiment === "negative" ? -1 : 0;
              if (scoreDelta !== 0) {
                const { data: lead } = await supabase
                  .from("leads")
                  .select("score")
                  .eq("id", metadata.lead_id)
                  .single();
                if (lead) {
                  const newScore = Math.min(5, Math.max(1, (lead.score || 3) + scoreDelta));
                  await supabase.from("leads").update({
                    score: newScore,
                    status: analysis.sentiment === "positive" ? "qualified" : undefined,
                  }).eq("id", metadata.lead_id);
                }
              }
            }

            // Log activity
            logAgentActivity({
              agentId: "sage",
              type: "task_completed",
              title: `Llamada completada y analizada`,
              description: `Sentimiento: ${analysis.sentiment}. ${analysis.summary}`,
              metadata: { vapi_call_id: vapiCallId, lead_id: metadata.lead_id },
            });

            // Notify Pablo about completed call
            const contactId = metadata.lead_id || metadata.client_id;
            notifyPablo(
              `Llamada ${analysis.sentiment === "positive" ? "positiva" : analysis.sentiment} completada`,
              wrapEmailTemplate(
                `<strong>Resumen:</strong> ${analysis.summary}\n\n` +
                `<strong>Resultado:</strong> ${analysis.outcome}\n` +
                `<strong>Siguiente paso:</strong> ${analysis.next_action}\n` +
                `<strong>Duracion:</strong> ${durationSeconds ? `${Math.round(durationSeconds / 60)}m ${durationSeconds % 60}s` : "N/A"}\n` +
                `<strong>Coste:</strong> ${costEur ? `${costEur.toFixed(3)}€` : "N/A"}`,
                { cta: "Ver en dashboard", ctaUrl: `https://app.pacameagencia.com/dashboard/calls` }
              )
            );
          }
        } catch {
          // AI analysis failure is non-blocking
        }
      }

      // Create notification
      await supabase.from("notifications").insert({
        type: "call_completed",
        priority: "medium",
        title: "Llamada completada",
        message: `Duracion: ${durationSeconds ? `${Math.round(durationSeconds / 60)}m` : "N/A"}. Coste: ${costEur ? `${costEur.toFixed(3)}€` : "N/A"}.`,
        data: { vapi_call_id: vapiCallId, lead_id: metadata.lead_id, client_id: metadata.client_id },
      });

      return NextResponse.json({ ok: true });
    }

    // --- Real-time transcript update ---
    if (type === "transcript") {
      // We could store partial transcripts, but for now just acknowledge
      return NextResponse.json({ ok: true });
    }

    // Acknowledge unknown event types
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Vapi Webhook] Error:", err);
    // Always return 200 to prevent Vapi from retrying
    return NextResponse.json({ ok: true });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createServerSupabase();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL || "https://voice.pacameagencia.com";

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Initiate outbound call via voice-server ---
  if (action === "initiate") {
    const { lead_id, client_id, phone_number, purpose } = body;

    if (!phone_number) {
      return NextResponse.json({ error: "phone_number required" }, { status: 400 });
    }

    // Validate phone format (E.164: +country code + number, 8-15 digits)
    const cleanPhone = phone_number.replace(/[\s\-()]/g, "");
    if (!/^\+\d{8,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Formato de telefono invalido. Usa formato internacional: +34XXXXXXXXX" }, { status: 400 });
    }

    // Get contact context for the call
    let contactName = "Lead";
    let contactContext = "";
    if (lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("name, business_name, problem, sector, city, score")
        .eq("id", lead_id)
        .single();
      if (lead) {
        contactName = lead.name;
        contactContext = [
          `Nombre: ${lead.name}`,
          lead.business_name && `Empresa: ${lead.business_name}`,
          lead.sector && `Sector: ${lead.sector}`,
          lead.city && `Ciudad: ${lead.city}`,
          lead.problem && `Problema: ${lead.problem}`,
          lead.score && `Score: ${lead.score}/5`,
        ].filter(Boolean).join("\n");
      }
    } else if (client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("name, business_name, plan")
        .eq("id", client_id)
        .single();
      if (client) {
        contactName = client.name;
        contactContext = `Cliente existente: ${client.name} (${client.business_name || ""}). Plan: ${client.plan || "basico"}.`;
      }
    }

    updateAgentStatus("sage", "working", `Llamando a ${contactName}`);

    try {
      // Call our own voice-server instead of Vapi
      const vsRes = await fetch(`${VOICE_SERVER_URL}/call/outbound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: cleanPhone,
          contact_name: contactName,
          contact_context: contactContext || "Sin informacion previa.",
          lead_id: lead_id || null,
          client_id: client_id || null,
          purpose: purpose || "discovery",
        }),
      });

      if (!vsRes.ok) {
        const vsError = await vsRes.text();
        updateAgentStatus("sage", "idle");
        return NextResponse.json({ error: `Voice server error: ${vsError}` }, { status: 502 });
      }

      const vsData = await vsRes.json() as { call_sid: string };

      logAgentActivity({
        agentId: "sage",
        type: "task_started",
        title: `Llamada saliente a ${contactName}`,
        description: `Call SID: ${vsData.call_sid}. Proposito: ${purpose || "discovery"}.`,
        metadata: { call_sid: vsData.call_sid, lead_id, client_id },
      });

      return NextResponse.json({
        ok: true,
        call_sid: vsData.call_sid,
        status: "queued",
      });
    } catch (err) {
      updateAgentStatus("sage", "idle");
      const message = err instanceof Error ? err.message : "Error initiating call";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // --- Log a manual call ---
  if (action === "log") {
    const { lead_id, client_id, direction, purpose, summary, sentiment, outcome, next_action, duration_seconds } = body;

    const { data: call, error } = await supabase.from("voice_calls").insert({
      lead_id: lead_id || null,
      client_id: client_id || null,
      direction: direction || "outbound",
      purpose: purpose || null,
      summary: summary || null,
      sentiment: sentiment || "neutral",
      outcome: outcome || null,
      next_action: next_action || null,
      duration_seconds: duration_seconds || null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, call });
  }

  // --- Summarize a call transcript with AI ---
  if (action === "summarize") {
    const { call_id } = body;
    if (!call_id) return NextResponse.json({ error: "call_id required" }, { status: 400 });

    const { data: call } = await supabase
      .from("voice_calls")
      .select("*")
      .eq("id", call_id)
      .single();

    if (!call?.transcript) {
      return NextResponse.json({ error: "No transcript available" }, { status: 400 });
    }

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: "CLAUDE_API_KEY not configured" }, { status: 503 });
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `Analiza esta transcripcion de llamada comercial y responde SOLO JSON:

TRANSCRIPCION:
${call.transcript}

{
  "summary": "resumen en 2-3 frases",
  "sentiment": "positive|neutral|negative",
  "outcome": "resultado principal",
  "next_action": "siguiente paso concreto",
  "lead_score_delta": 0,
  "key_insights": ["insight 1", "insight 2"]
}`,
          }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;

      if (jsonStart >= 0) {
        let analysis: Record<string, unknown>;
        try {
          analysis = JSON.parse(text.slice(jsonStart, jsonEnd));
        } catch {
          return NextResponse.json({ error: "AI devolvio JSON invalido" }, { status: 500 });
        }

        // Update the call with AI analysis
        await supabase.from("voice_calls").update({
          summary: analysis.summary,
          sentiment: analysis.sentiment,
          outcome: analysis.outcome,
          next_action: analysis.next_action,
        }).eq("id", call_id);

        // Update lead score if applicable
        if (call.lead_id && analysis.lead_score_delta) {
          const { data: lead } = await supabase
            .from("leads")
            .select("score")
            .eq("id", call.lead_id)
            .single();
          if (lead) {
            const newScore = Math.min(5, Math.max(1, ((lead.score as number) || 3) + (analysis.lead_score_delta as number)));
            await supabase.from("leads").update({ score: newScore }).eq("id", call.lead_id);
          }
        }

        logAgentActivity({
          agentId: "sage",
          type: "task_completed",
          title: `Llamada analizada`,
          description: `Sentimiento: ${analysis.sentiment}. ${analysis.summary}`,
          metadata: { call_id, insights: analysis.key_insights },
        });

        return NextResponse.json({ ok: true, analysis });
      }
    } catch {
      // Continue without AI analysis
    }

    return NextResponse.json({ error: "Failed to analyze transcript" }, { status: 500 });
  }

  // --- Get voice server health ---
  if (action === "status") {
    try {
      const res = await fetch(`${VOICE_SERVER_URL}/health`);
      const data = await res.json() as { status: string; activeCalls: number };
      return NextResponse.json({ status: data.status, activeCalls: data.activeCalls });
    } catch {
      return NextResponse.json({ error: "Voice server unreachable" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

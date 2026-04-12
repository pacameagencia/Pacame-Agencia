import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Vapi assistant config for SAGE outbound calls
const SAGE_VOICE_SYSTEM_PROMPT = `Eres Sage, Chief Strategy Officer de PACAME, una agencia digital con IA.

REGLAS:
- Hablas en espanol de Espana, tutea siempre
- Tono cercano, profesional, directo. Sin servilismo
- Tu objetivo es hacer un diagnostico rapido del negocio del lead
- Identifica: que hace, que problemas digitales tiene, que presupuesto maneja
- Si detectas una oportunidad, sugiere una reunion con Pablo (el fundador)
- Duracion ideal: 3-5 minutos
- Cierra siempre con un proximo paso concreto

NUNCA:
- Inventes datos o prometas resultados exactos
- Presiones para comprar
- Hables de precios concretos (eso lo decide Pablo)

Si el lead no quiere hablar, despidete con educacion y ofrece contacto por email: hola@pacameagencia.com`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // --- Initiate outbound call via Vapi ---
  if (action === "initiate") {
    const { lead_id, client_id, phone_number, purpose } = body;

    if (!phone_number) {
      return NextResponse.json({ error: "phone_number required" }, { status: 400 });
    }

    if (!VAPI_API_KEY) {
      return NextResponse.json({ error: "VAPI_API_KEY not configured. Add it in Settings." }, { status: 503 });
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

    const systemPrompt = `${SAGE_VOICE_SYSTEM_PROMPT}\n\nCONTEXTO DEL CONTACTO:\n${contactContext || "Sin informacion previa."}`;

    updateAgentStatus("sage", "working", `Llamando a ${contactName}`);

    try {
      // Create Vapi call
      const vapiRes = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${VAPI_API_KEY}`,
        },
        body: JSON.stringify({
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          customer: { number: phone_number },
          assistant: {
            model: {
              provider: "anthropic",
              model: "claude-haiku-4-5-20251001",
              systemPrompt,
            },
            voice: {
              provider: "11labs",
              voiceId: process.env.ELEVENLABS_VOICE_ID || "ErXwobaYiN019PkySvjV",
            },
            firstMessage: `Hola, soy Sage de PACAME. ¿Hablo con ${contactName}?`,
            endCallMessage: "Perfecto, gracias por tu tiempo. Te mandamos toda la info por email. Un saludo!",
            transcriber: { provider: "deepgram", language: "es" },
          },
          metadata: {
            lead_id: lead_id || null,
            client_id: client_id || null,
            purpose: purpose || "discovery",
          },
        }),
      });

      if (!vapiRes.ok) {
        const vapiError = await vapiRes.text();
        updateAgentStatus("sage", "idle");
        return NextResponse.json({ error: `Vapi error: ${vapiError}` }, { status: 502 });
      }

      const vapiData = await vapiRes.json();

      // Save call record to DB
      const { data: call, error } = await supabase.from("voice_calls").insert({
        lead_id: lead_id || null,
        client_id: client_id || null,
        direction: "outbound",
        purpose: purpose || "discovery",
        vapi_call_id: vapiData.id,
        sentiment: "neutral",
      }).select().single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      logAgentActivity({
        agentId: "sage",
        type: "task_started",
        title: `Llamada saliente a ${contactName}`,
        description: `Vapi call ID: ${vapiData.id}. Proposito: ${purpose || "discovery"}.`,
        metadata: { call_id: call.id, vapi_call_id: vapiData.id, lead_id, client_id },
      });

      return NextResponse.json({
        ok: true,
        call_id: call.id,
        vapi_call_id: vapiData.id,
        status: vapiData.status,
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
        const analysis = JSON.parse(text.slice(jsonStart, jsonEnd));

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
            const newScore = Math.min(5, Math.max(1, (lead.score || 3) + analysis.lead_score_delta));
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

  // --- Get call status from Vapi ---
  if (action === "status") {
    const { vapi_call_id } = body;
    if (!vapi_call_id) return NextResponse.json({ error: "vapi_call_id required" }, { status: 400 });

    if (!VAPI_API_KEY) {
      return NextResponse.json({ error: "VAPI_API_KEY not configured" }, { status: 503 });
    }

    try {
      const res = await fetch(`https://api.vapi.ai/call/${vapi_call_id}`, {
        headers: { "Authorization": `Bearer ${VAPI_API_KEY}` },
      });
      const data = await res.json();
      return NextResponse.json({ status: data.status, duration: data.duration, cost: data.cost });
    } catch {
      return NextResponse.json({ error: "Failed to fetch call status" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

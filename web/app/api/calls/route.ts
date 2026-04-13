import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createServerSupabase();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Vapi assistant config for SAGE outbound calls
const SAGE_VOICE_SYSTEM_PROMPT = `Eres Sage, asesora estrategica de PACAME, una agencia digital con IA que ayuda a PYMEs a crecer online.

== IDENTIDAD Y TONO ==
- Hablas en espanol de Espana. Tutea SIEMPRE.
- Tono: cercano, seguro, conversacional. Como una colega experta, no como una vendedora.
- Habla con calma, sin prisas. Los ejecutivos hablan despacio — tu tambien.
- Usa frases cortas. Haz pausas. Deja que el prospecto hable el 80% del tiempo.
- NUNCA suenes robotica ni recites un guion. Se natural, mete alguna risa suave si viene al caso.
- Tratalos de igual a igual. NUNCA adules ni hagas la pelota.

== ESTRUCTURA DE LA LLAMADA (5 FASES) ==

FASE 1 — APERTURA (15 seg):
- Se honesta y directa. Ejemplo: "Oye, te soy sincera, no nos conocemos de nada. Soy Sage de PACAME. Te llamo porque hemos visto tu negocio y creemos que podriamos ayudarte a conseguir mas clientes online. Se que no esperabas mi llamada, asi que si no es buen momento me lo dices y no pasa nada."
- Si dicen que no es buen momento: "Totalmente, sin problema. Te puedo llamar en otro momento que te venga mejor, manana por la manana o por la tarde?"
- Objetivo: conseguir permiso para hablar 2 minutos.

FASE 2 — CUALIFICACION (60-90 seg):
- Haz preguntas abiertas para descubrir: situacion actual, dolor y deseo.
- Preguntas clave:
  * "Cuentame, a que se dedica tu negocio?"
  * "Como conseguis clientes ahora mismo?"
  * "Teneis web o redes sociales? Os funcionan?"
  * "Cual es vuestro mayor quebradero de cabeza para crecer?"
  * "Tendriais capacidad para coger 3 o 4 clientes mas al mes?"
- ESCUCHA. No interrumpas. Usa silencios estrategicos despues de preguntas importantes.
- Regla: NUNCA ofrezcas solucion sin haber diagnosticado primero.

FASE 3 — PROPUESTA DE VALOR (30 seg, regla 80/20):
- Solo menciona el 20% de lo que hacemos que resuelve SU dolor especifico.
- Estructura: Problema que sufren + solucion en una frase + prueba social.
- Ejemplo: "Mira, trabajamos con negocios como el tuyo en [sector]. Les montamos un sistema automatico que les genera contactos cualificados cada semana. El ultimo cliente que cogimos en [ciudad similar] paso de 0 consultas online a 15 al mes en dos meses."
- NO hagas un monologo de todo lo que hacemos. Solo lo que a ELLOS les importa.

FASE 4 — CIERRE (agendar reunion):
- El objetivo NO es vender. Es agendar una reunion de 15-20 min con Pablo, el fundador.
- Usa doble alternativa: "Mira, yo creo que esto os puede encajar bastante bien. Lo mejor seria que hablarais directamente con Pablo, nuestro fundador, para ver un plan concreto. Tiene un hueco manana por la manana o el jueves a las 12, que te viene mejor?"
- Si dicen que si: "Perfecto, te mando un email ahora mismo con la confirmacion. Que email usas?"

FASE 5 — DESPEDIDA:
- Breve y calida: "Genial, pues nada, encantada de hablar contigo. Pablo te va a encantar. Un saludo!"

== MANEJO DE OBJECIONES (metodo Mr. Miyagi: nunca confrontes) ==

Si dice "Mandame un email":
- "Claro que si, pero te soy honesta: nosotros nos adaptamos mucho a cada cliente, no tenemos un folleto generico que mandarte porque te estaria mintiendo. Lo que si puedo hacer es que Pablo te dedique 15 minutitos y te haga una propuesta a medida. Sin compromiso. El martes o el jueves, que te viene mejor?"

Si dice "No me interesa":
- "Te entiendo perfectamente. Sabes que es curioso? La mayoria de nuestros mejores clientes me dijeron exactamente eso en la primera llamada. Solo te pido una cosa: si en algun momento notais que os cuesta conseguir clientes o que vuestra web no os trae negocio, me llamas. Te dejo mi email: hola@pacameagencia.com. Sin agobios."

Si dice "Estoy ocupado":
- "Totalmente, no te robo ni un segundo mas. Solo una pregunta rapida de 10 segundos: si os pudiera garantizar 10-15 contactos cualificados al mes sin que vosotros movierais un dedo, os interesaria? Si la respuesta es si, te llamo manana 2 minutitos y lo vemos. Si no, te dejo tranquilo para siempre."

Si dice "Ya trabajo con alguien":
- "Genial, eso quiere decir que ya sabeis lo importante que es esto. Del 1 al 10, como de contento estas con los resultados? ... Entiendo. Y si pudierais mejorar eso sin cambiar nada de vuestro dia a dia, os mereceria la pena echarle un ojo? Solo una reunion rapida."

Si dice "No tengo presupuesto":
- "Te entiendo. Mira, precisamente por eso trabajamos con un modelo donde si no te sale rentable, no pagas. Asi de simple. Vale la pena que lo hableis con Pablo en 15 min y decidis vosotros. Sin ningun compromiso."

== REGLAS ABSOLUTAS ==
- NUNCA inventes datos, clientes ni resultados.
- NUNCA des precios concretos. Di: "Eso lo ve Pablo contigo, porque depende de lo que necesiteis."
- NUNCA presiones. Si no quieren, dejalo con elegancia.
- NUNCA hables mas de 30 segundos seguidos sin hacer una pregunta.
- Si el prospecto es grosero, mantente profesional: "Entiendo, no hay problema. Te dejo el email por si cambias de opinion: hola@pacameagencia.com. Un saludo."
- Email de contacto: hola@pacameagencia.com
- WhatsApp de contacto: +34 722 669 381`;

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
              voiceId: process.env.ELEVENLABS_VOICE_ID || "oHMibLgDqXK3fjgFVtJ6",
            },
            firstMessage: `Hola, ¿${contactName}? Oye, soy Sage de PACAME. Te soy sincera, no nos conocemos, pero he visto vuestro negocio y creo que os podemos echar una mano. ¿Te pillo en buen momento o prefieres que te llame en otro rato?`,
            endCallMessage: "Genial, pues nada, encantada de hablar contigo. Te mando toda la info por email. Un saludo!",
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

require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const twilio = require("twilio");
const pino = require("pino");

const log = pino({ level: "info" });

// --- Config ---
const PORT = process.env.PORT || 8080;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "YXGHKitgIMeIV5gGeQvP";
// Turbo v2.5 = multilingue + ~250ms TTFB (vs ~450ms v2). Mucho mejor para llamadas.
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// Voces Realtime 2024-12-17+: alloy, ash, ballad, coral, echo, sage, shimmer, verse
// "ballad" = femenina cálida/natural para español, mejor turn-taking que coral.
const OPENAI_VOICE = process.env.OPENAI_VOICE || "ballad";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-realtime-preview-2024-12-17";

// VAD tuning — valores calibrados para conversación natural en español:
//   threshold 0.6       → menos falsos positivos con ruido de fondo
//   prefix_padding 500  → captura arranques de palabra completos
//   silence_duration 400 → fin-de-turno más rápido (humano, no robot)
const VAD_THRESHOLD = parseFloat(process.env.VAD_THRESHOLD || "0.6");
const VAD_PREFIX_PADDING_MS = parseInt(process.env.VAD_PREFIX_PADDING_MS || "500", 10);
const VAD_SILENCE_DURATION_MS = parseInt(process.env.VAD_SILENCE_DURATION_MS || "400", 10);

// Hybrid mode: OpenAI for brain + ElevenLabs for voice. Fallback to OpenAI audio if no ElevenLabs key.
const USE_ELEVENLABS = !!(ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID);

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// --- Sage System Prompt (optimized for spoken Spanish) ---
const SAGE_SYSTEM_PROMPT = `Eres Sage, asesora comercial de PACAME — agencia digital con IA para PYMEs en Espana.

== COMO HABLAS ==
Hablas espanol de Espana. Tutea SIEMPRE. Eres cercana, segura, natural.
Habla como una persona REAL al telefono. Usa muletillas: "mira...", "oye...", "a ver...", "bueno...", "eh...", "vale...".
Mete pausas naturales. Nunca suenes como un guion leido.
Tono: como si llamaras a un colega para contarle algo que le interesa.

== RESPUESTAS CORTAS (CRITICO) ==
MAXIMO 1-2 frases por turno. Es una conversacion, no un monologo.
Acaba SIEMPRE con una pregunta o dejando espacio para que hablen.
Si te enrollas mas de 15 palabras, PARA y pregunta.

== TECNICA DE VENTA (SPIN Selling adaptado) ==

PASO 1 — CONEXION (primeros 10 segundos):
- Presentate rapido y di POR QUE llamas, sin rodeos.
- Sondea si es buen momento. Si no, ofrece llamar otro dia.

PASO 2 — ESCUCHAR (70% de la llamada):
- Haz UNA pregunta cada vez. Espera la respuesta completa.
- Preguntas de situacion: "Cuentame, como conseguis clientes ahora?"
- Preguntas de problema: "Y que es lo que mas os cuesta?"
- Preguntas de implicacion: "Y eso como os afecta al dia a dia?"
- Preguntas de necesidad: "Si pudierais resolver eso, que cambiaria?"

PASO 3 — VALOR (maximo 20 segundos):
- Conecta SU problema con algo concreto que haceis.
- "Mira, justo eso es lo que hacemos. Montamos un sistema que te trae contactos cualificados cada semana. Sin que tengas que hacer nada."

PASO 4 — CIERRE (natural, sin presion):
- "Oye, creo que Pablo, nuestro fundador, te puede ayudar. Suele quedar 15 minutos para ver tu caso. Esta semana podrias?"
- Si dicen que si: "Genial. Te cuadra mejor manana por la manana o el jueves por la tarde?"
- Si dicen que no: "Sin problema. Te dejo nuestro email por si cambias de idea."

== OBJECIONES (responde con empatia, nunca insistas) ==

"Mandame info por email":
→ "Claro. Pero te soy honesta: lo que hacemos cambia mucho segun el negocio. 15 minutos con Pablo te ahorra leer un PDF generico. Sin compromiso, eh."

"No me interesa":
→ "Entendido. Si algun dia os veis apurados de clientes, tienes mi email: hola@pacameagencia.com. Un saludo."

"Estoy ocupado":
→ "Te pillo en mal momento. Te llamo manana a esta hora o por la tarde, que te viene mejor?"

"Ya tengo agencia/alguien":
→ "Bien. Y del 1 al 10, que tal los resultados? ... Es que muchos clientes nuestros venian de ahi."

"Es caro / no tengo presupuesto":
→ "Lo entiendo. Mira, tenemos planes desde 197 al mes. Lo mejor es que hables con Pablo y vea que os encaja. Sin compromiso."

== REGLAS ABSOLUTAS ==
- NUNCA inventes datos, cifras ni clientes.
- NUNCA des precios exactos. Di: "Eso lo ve Pablo contigo."
- NUNCA hables mas de 2 frases seguidas SIN hacer una pregunta.
- Si no entiendes algo, pide que lo repitan: "Perdona, no te he pillado bien."
- Si el ambiente es relajado, mete alguna broma suave o risa.
- Datos de contacto: hola@pacameagencia.com | WhatsApp: +34 722 669 381`;

// --- Active calls state ---
const activeCalls = new Map();

// --- Express + HTTP server ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const server = http.createServer(app);

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    activeCalls: activeCalls.size,
    engine: USE_ELEVENLABS ? "openai-realtime+elevenlabs" : "openai-realtime",
    model: OPENAI_MODEL,
    voice: USE_ELEVENLABS ? `elevenlabs:${ELEVENLABS_VOICE_ID}` : OPENAI_VOICE,
  });
});

// --- TwiML: connect call to media stream ---
app.post("/twiml/stream", (req, res) => {
  const callSid = req.body.CallSid;
  log.info({ callSid }, "TwiML stream requested");

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.pause({ length: 1 });
  const connect = twiml.connect();
  connect.stream({ url: `wss://${new URL(PUBLIC_URL).host}/media` });

  res.type("text/xml");
  res.send(twiml.toString());
});

// --- Initiate outbound call ---
app.post("/call/outbound", async (req, res) => {
  const { phone_number, contact_name, contact_context, lead_id, client_id, purpose } = req.body;
  if (!phone_number) return res.status(400).json({ error: "phone_number required" });

  try {
    const call = await twilioClient.calls.create({
      to: phone_number,
      from: TWILIO_PHONE_NUMBER,
      url: `${PUBLIC_URL}/twiml/stream`,
      statusCallback: `${PUBLIC_URL}/call-status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    });

    activeCalls.set(call.sid, {
      phone_number,
      contact_name: contact_name || "Lead",
      contact_context: contact_context || "",
      lead_id: lead_id || null,
      client_id: client_id || null,
      purpose: purpose || "discovery",
      startedAt: new Date(),
      transcript: [],
    });

    log.info({ callSid: call.sid, phone_number }, "Outbound call initiated");
    res.json({ ok: true, call_sid: call.sid });
  } catch (err) {
    log.error({ err: err.message }, "Failed to create call");
    res.status(500).json({ error: err.message });
  }
});

// --- Call status webhook ---
app.post("/call-status", (req, res) => {
  const { CallSid, CallStatus } = req.body;
  log.info({ CallSid, CallStatus }, "Call status update");
  if (["completed", "failed", "no-answer", "busy"].includes(CallStatus)) {
    const meta = activeCalls.get(CallSid);
    if (meta) handleCallEnd(CallSid, meta, CallStatus);
  }
  res.sendStatus(200);
});

// --- WebSocket server for Twilio Media Streams ---
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === "/media") {
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
  } else {
    socket.destroy();
  }
});

wss.on("connection", (twilioWs) => {
  let streamSid = null;
  let callSid = null;
  let callMeta = null;
  let openaiWs = null;
  let elevenWs = null;
  let elevenReady = false;
  let textBuffer = [];

  log.info("Media stream connected");

  // =============================================
  // OpenAI Realtime API (STT + LLM)
  // =============================================
  function connectOpenAI() {
    const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_MODEL}`;
    openaiWs = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    openaiWs.on("open", () => log.info("OpenAI Realtime connected"));

    openaiWs.on("message", (data) => {
      try {
        handleOpenAIEvent(JSON.parse(data.toString()));
      } catch (err) {
        log.error({ err: err.message }, "Error parsing OpenAI event");
      }
    });

    openaiWs.on("error", (err) => log.error({ err: err.message }, "OpenAI WS error"));
    openaiWs.on("close", (code, reason) => log.info({ code }, "OpenAI WS closed"));
  }

  function handleOpenAIEvent(event) {
    switch (event.type) {

      // --- Session lifecycle ---
      case "session.created":
        log.info("Session created — configuring");
        break;

      case "session.updated":
        log.info("Session configured — sending greeting");
        sendGreeting();
        break;

      // --- HYBRID MODE: text output → ElevenLabs TTS ---
      case "response.created":
        if (USE_ELEVENLABS) {
          startElevenLabsStream();
        }
        break;

      case "response.text.delta":
        if (USE_ELEVENLABS) {
          sendTextToElevenLabs(event.delta || "");
        }
        break;

      case "response.text.done":
        if (USE_ELEVENLABS) {
          flushElevenLabs();
          // Track transcript
          if (callMeta && event.text) {
            callMeta.transcript.push({ role: "assistant", text: event.text, ts: new Date() });
            log.info({ text: event.text.slice(0, 100) }, "Sage said");
          }
        }
        break;

      // --- FALLBACK MODE: OpenAI audio → Twilio ---
      case "response.audio.delta":
        if (!USE_ELEVENLABS && twilioWs.readyState === WebSocket.OPEN && streamSid) {
          twilioWs.send(JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: event.delta },
          }));
        }
        break;

      case "response.audio.done":
        if (!USE_ELEVENLABS && twilioWs.readyState === WebSocket.OPEN && streamSid) {
          twilioWs.send(JSON.stringify({
            event: "mark",
            streamSid,
            mark: { name: `done_${Date.now()}` },
          }));
        }
        break;

      // --- Transcript tracking ---
      case "response.audio_transcript.done":
        if (!USE_ELEVENLABS && callMeta && event.transcript) {
          callMeta.transcript.push({ role: "assistant", text: event.transcript, ts: new Date() });
          log.info({ text: event.transcript.slice(0, 100) }, "Sage said");
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (callMeta && event.transcript) {
          callMeta.transcript.push({ role: "user", text: event.transcript, ts: new Date() });
          log.info({ text: event.transcript.slice(0, 100) }, "User said");
        }
        break;

      // --- Interruption handling (soft) ---
      // En conversacion real la gente se solapa un instante sin que el otro
      // corte de golpe. Antes cerrabamos el WS de ElevenLabs → reconexion
      // 300-500ms cada turno. Ahora cancelamos la respuesta en vuelo,
      // paramos la TTS con una senal, y limpiamos solo el buffer de Twilio.
      // El WS de TTS queda vivo y listo para el siguiente turno (~0ms).
      case "input_audio_buffer.speech_started":
        log.info("User speaking — soft interrupt");

        // Cancel LLM response in flight
        if (openaiWs?.readyState === WebSocket.OPEN) {
          openaiWs.send(JSON.stringify({ type: "response.cancel" }));
        }
        // Soft stop TTS (no cerrar WS)
        stopElevenLabsSoft();
        // Clear Twilio playback buffer
        if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
          twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
        }
        break;

      // --- Errors ---
      case "error":
        log.error({ error: event.error }, "OpenAI error");
        break;

      default:
        break;
    }
  }

  // --- Send session config ---
  function configureSession() {
    const contactContext = callMeta?.contact_context || "Sin informacion previa.";
    const contactName = callMeta?.contact_name || "el contacto";

    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        modalities: USE_ELEVENLABS ? ["text"] : ["text", "audio"],
        instructions: SAGE_SYSTEM_PROMPT +
          `\n\nCONTEXTO DEL CONTACTO:\nNombre: ${contactName}\n${contactContext}`,
        voice: OPENAI_VOICE,
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: VAD_THRESHOLD,
          prefix_padding_ms: VAD_PREFIX_PADDING_MS,
          silence_duration_ms: VAD_SILENCE_DURATION_MS,
          create_response: true,
          interrupt_response: true,
        },
      },
    }));
  }

  // --- Generate greeting ---
  function sendGreeting() {
    const name = callMeta?.contact_name || "";
    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: USE_ELEVENLABS ? ["text"] : ["text", "audio"],
        instructions: `Saluda brevemente. Eres Sage de PACAME. Presentate en 1-2 frases cortas y naturales. Di que has visto su negocio y que crees que les podeis echar una mano con el tema digital. Acaba preguntando si te pilla en buen momento. Se MUY natural — como si llamaras a alguien que no conoces pero con confianza.${name ? ` Se llama ${name}.` : ""}`,
      },
    }));
  }

  // =============================================
  // ElevenLabs Streaming TTS
  // =============================================
  function startElevenLabsStream() {
    elevenReady = false;
    textBuffer = [];

    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=${ELEVENLABS_MODEL}&output_format=ulaw_8000`;
    elevenWs = new WebSocket(url);

    elevenWs.on("open", () => {
      log.info("ElevenLabs stream connected");

      // BOS (Beginning of Stream) — calibrado para Turbo v2.5 en llamada real.
      //   stability 0.45 → timbre consistente (0.18 producia voz temblona)
      //   style 0.55     → expresivo sin exagerar (0.75 sonaba actuado)
      //   chunk_length 50..220 → arranca audio antes (mejor latencia turn-taking)
      elevenWs.send(JSON.stringify({
        text: " ",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.55,
          use_speaker_boost: true,
        },
        xi_api_key: ELEVENLABS_API_KEY,
        generation_config: {
          chunk_length_schedule: [50, 100, 160, 220],
        },
      }));

      elevenReady = true;

      // Flush any buffered text
      if (textBuffer.length > 0) {
        const buffered = textBuffer.join("");
        textBuffer = [];
        if (buffered.trim()) {
          elevenWs.send(JSON.stringify({ text: buffered }));
        }
      }
    });

    elevenWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio && twilioWs.readyState === WebSocket.OPEN && streamSid) {
          // Forward ElevenLabs audio directly to Twilio (both are base64 ulaw 8kHz)
          twilioWs.send(JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: msg.audio },
          }));
        }
        if (msg.isFinal) {
          log.info("ElevenLabs chunk complete");
          // Send mark to track playback
          if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
            twilioWs.send(JSON.stringify({
              event: "mark",
              streamSid,
              mark: { name: `tts_done_${Date.now()}` },
            }));
          }
        }
      } catch (err) {
        log.error({ err: err.message }, "ElevenLabs message error");
      }
    });

    elevenWs.on("error", (err) => log.error({ err: err.message }, "ElevenLabs WS error"));
    elevenWs.on("close", () => {
      log.info("ElevenLabs stream closed");
      elevenReady = false;
    });
  }

  function sendTextToElevenLabs(text) {
    if (!text) return;

    if (elevenReady && elevenWs?.readyState === WebSocket.OPEN) {
      elevenWs.send(JSON.stringify({ text }));
    } else {
      textBuffer.push(text);
    }
  }

  function flushElevenLabs() {
    if (elevenWs?.readyState === WebSocket.OPEN) {
      // Send EOS to flush remaining text and close stream
      elevenWs.send(JSON.stringify({ text: "" }));
    }
  }

  function closeElevenLabs() {
    elevenReady = false;
    textBuffer = [];
    if (elevenWs?.readyState === WebSocket.OPEN) {
      try { elevenWs.close(); } catch {}
    }
    elevenWs = null;
  }

  // Soft stop: vacia el buffer de texto pendiente y manda EOS al WS de TTS
  // para que pare de generar. El WS queda vivo para la siguiente respuesta.
  function stopElevenLabsSoft() {
    textBuffer = [];
    if (elevenWs?.readyState === WebSocket.OPEN) {
      try {
        // EOS → termina el turno de TTS en ElevenLabs sin cerrar conexion
        elevenWs.send(JSON.stringify({ text: "" }));
      } catch {}
    }
  }

  // =============================================
  // Twilio WebSocket message handling
  // =============================================
  twilioWs.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.event) {
        case "connected":
          log.info("Twilio stream connected");
          break;

        case "start":
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          callMeta = activeCalls.get(callSid);
          log.info({ streamSid, callSid }, "Stream started");
          connectOpenAI();
          // Wait for OpenAI connection, then configure
          const waitForOpen = setInterval(() => {
            if (openaiWs?.readyState === WebSocket.OPEN) {
              clearInterval(waitForOpen);
              configureSession();
            }
          }, 50);
          setTimeout(() => clearInterval(waitForOpen), 5000); // Safety timeout
          break;

        case "media":
          // Forward user audio to OpenAI for transcription
          if (openaiWs?.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.media.payload,
            }));
          }
          break;

        case "mark":
          log.info({ mark: msg.mark?.name }, "Playback mark");
          break;

        case "stop":
          log.info({ streamSid }, "Stream stopped");
          cleanup();
          break;
      }
    } catch (err) {
      log.error({ err: err.message }, "Twilio message error");
    }
  });

  twilioWs.on("close", () => { log.info("Twilio WS closed"); cleanup(); });
  twilioWs.on("error", (err) => { log.error({ err: err.message }, "Twilio WS error"); cleanup(); });

  function cleanup() {
    closeElevenLabs();
    if (openaiWs?.readyState === WebSocket.OPEN) openaiWs.close();
  }
});

// --- Handle call end: analyze + save ---
async function handleCallEnd(callSid, meta, status) {
  log.info({ callSid, status, transcriptLength: meta.transcript.length }, "Call ended");

  const fullTranscript = meta.transcript
    .map((t) => `${t.role === "user" ? "Cliente" : "Sage"}: ${t.text}`)
    .join("\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !fullTranscript) {
    activeCalls.delete(callSid);
    return;
  }

  try {
    let summary = "", sentiment = "neutral", outcome = "", nextAction = "";

    // Analyze call with OpenAI Chat (cheap, fast)
    if (OPENAI_API_KEY && meta.transcript.length > 1) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{
              role: "user",
              content: `Analiza esta llamada comercial. JSON:\n\nTRANSCRIPCION:\n${fullTranscript}\n\n{"summary":"resumen 2-3 frases","sentiment":"positive|neutral|negative","outcome":"resultado","next_action":"siguiente paso","interested":true}`,
            }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const p = JSON.parse(data.choices?.[0]?.message?.content || "{}");
          summary = p.summary || "";
          sentiment = p.sentiment || "neutral";
          outcome = p.outcome || "";
          nextAction = p.next_action || "";
          log.info({ summary, sentiment }, "Call analyzed");
        }
      } catch (e) {
        log.error({ err: e.message }, "Analysis failed");
      }
    }

    // Save to Supabase
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/voice_calls`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        lead_id: meta.lead_id,
        client_id: meta.client_id,
        direction: "outbound",
        purpose: meta.purpose,
        transcript: fullTranscript,
        summary, sentiment, outcome, next_action: nextAction,
        duration_seconds: Math.round((Date.now() - meta.startedAt.getTime()) / 1000),
      }),
    });

    log.info({ callSid, saved: saveRes.ok }, "Call record saved");
  } catch (err) {
    log.error({ err: err.message }, "Failed to save call");
  }

  activeCalls.delete(callSid);
}

// --- Start server ---
server.listen(PORT, () => {
  log.info({
    port: PORT,
    url: PUBLIC_URL,
    engine: USE_ELEVENLABS ? "openai-realtime + elevenlabs" : "openai-realtime",
    model: OPENAI_MODEL,
    ttsVoice: USE_ELEVENLABS ? `${ELEVENLABS_VOICE_ID} (${ELEVENLABS_MODEL})` : OPENAI_VOICE,
  }, "PACAME Voice Server v3 running");
});

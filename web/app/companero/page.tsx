/**
 * /companero — Compañero IA PACAME (modo conversación continua tipo Siri).
 *
 * Flujo:
 *   - 1 click en el botón grande → entra en modo conversación
 *   - Loop: escucha → procesa → habla → escucha de nuevo (auto)
 *   - Click otra vez → sale del modo
 *   - Si el usuario habla mientras el avatar habla → barge-in (corta y escucha)
 *
 * Voz: /api/tts (ElevenLabs). Avatar: SVG character con expresiones reales.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AvatarHolograma from "./AvatarHolograma";
import "./companero.css";

type Message = { role: "user" | "assistant"; text: string; ts: number };
type AvatarState = "idle" | "listening" | "thinking" | "speaking";

const VOICE_PRESETS = [
  { id: "onyx", label: "Brian (grave)" },
  { id: "ash", label: "Adam (firme)" },
  { id: "echo", label: "George (cálido)" },
  { id: "ballad", label: "Eric (cercano)" },
  { id: "nova", label: "Jessica (vital)" },
  { id: "shimmer", label: "Sarah (pro)" },
];

export default function CompaneroPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<AvatarState>("idle");
  const [convMode, setConvMode] = useState(false);
  const [voice, setVoice] = useState("onyx");
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showText, setShowText] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [interim, setInterim] = useState(""); // texto parcial mientras hablas

  // refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const convModeRef = useRef(convMode);
  const stateRef = useRef(state);
  const voiceRef = useRef(voice);
  const isListeningRef = useRef(false);
  const recogStopByMeRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { convModeRef.current = convMode; }, [convMode]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // --- Audio graph (AudioContext + Analyser) inicializado al primer click ---
  const ensureAudioGraph = useCallback(() => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        const src = ctx.createMediaElementSource(audioRef.current);
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        an.smoothingTimeConstant = 0.65;
        src.connect(an);
        an.connect(ctx.destination);
        audioCtxRef.current = ctx;
        sourceRef.current = src;
        analyserRef.current = an;
        setAnalyser(an);
      } catch (e) {
        console.error("[companero] audio graph", e);
      }
    }
    audioCtxRef.current?.resume().catch(() => {});
  }, []);

  // --- Inicializar SpeechRecognition (con auto-restart en convMode) ---
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.continuous = false;       // 1 frase por turno (más fiable)
    recog.interimResults = true;     // muestra texto mientras hablas
    recog.lang = "es-ES";
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      isListeningRef.current = true;
      setState("listening");
    };

    recog.onresult = (e: any) => {
      let finalText = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else partial += r[0].transcript;
      }
      setInterim(partial);
      if (finalText.trim()) {
        setInterim("");
        recogStopByMeRef.current = true;
        try { recog.stop(); } catch {}
        sendMessage(finalText.trim());
      }
    };

    recog.onerror = (e: any) => {
      isListeningRef.current = false;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setPermissionDenied(true);
        setConvMode(false);
        setState("idle");
        return;
      }
      // no-speech / aborted: si seguimos en convMode, reintentar tras pausa breve
      if (convModeRef.current && stateRef.current === "listening") {
        setTimeout(() => {
          if (convModeRef.current) startListening();
        }, 400);
      }
    };

    recog.onend = () => {
      isListeningRef.current = false;
      // Si se paró sola y seguimos en convMode → reabrir (a menos que estemos pensando/hablando)
      if (
        convModeRef.current &&
        !recogStopByMeRef.current &&
        stateRef.current === "listening"
      ) {
        setTimeout(() => {
          if (convModeRef.current && stateRef.current === "listening") startListening();
        }, 200);
      }
      recogStopByMeRef.current = false;
    };

    recognitionRef.current = recog;
  }, []);

  const startListening = () => {
    const recog = recognitionRef.current;
    if (!recog) return;
    if (isListeningRef.current) return;
    try {
      recog.start();
    } catch (e) {
      // a veces "InvalidStateError" si aún no se cerró el anterior
      setTimeout(() => {
        try { recog.start(); } catch {}
      }, 250);
    }
  };

  const stopListening = () => {
    const recog = recognitionRef.current;
    if (!recog) return;
    recogStopByMeRef.current = true;
    try { recog.stop(); } catch {}
    isListeningRef.current = false;
  };

  // --- TTS (devuelve promesa que resuelve al terminar el audio) ---
  const speak = (text: string): Promise<void> =>
    new Promise(async (resolve) => {
      const audio = audioRef.current;
      if (!audio) { setState("idle"); resolve(); return; }
      setState("speaking");

      try {
        ensureAudioGraph();
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: voiceRef.current }),
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audio.src = url;
        const cleanup = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onended = cleanup;
        audio.onerror = cleanup;
        await audio.play();
      } catch (err) {
        console.error("[companero] speak", err);
        // fallback browser TTS
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "es-ES";
          u.rate = 1.05;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
        } else {
          setTimeout(resolve, 1500);
        }
      }
    });

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages((m) => [...m, { role: "user", text: content, ts: Date.now() }]);
    setInput("");
    setState("thinking");

    try {
      const res = await fetch("/api/neural/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: content,
          source: "user",
          channel: "companero",
          mode: "answer",
        }),
      });
      const json = await res.json();
      const reply: string = json.reply || json.error || "Hubo un problema procesando tu mensaje.";
      setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]);
      await speak(reply);

      // Volvemos a escuchar si el usuario sigue en modo conversación
      if (convModeRef.current) {
        setState("listening");
        setTimeout(() => {
          if (convModeRef.current) startListening();
        }, 250);
      } else {
        setState("idle");
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Error de conexión. Inténtalo de nuevo.", ts: Date.now() },
      ]);
      setState("idle");
    }
  };

  // --- Toggle modo conversación (botón principal grande) ---
  const toggleConversation = async () => {
    ensureAudioGraph();

    if (convMode) {
      setConvMode(false);
      stopListening();
      // Si está hablando, callar
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      setState("idle");
      return;
    }

    // Pide permiso explícito de micrófono primero (UX clara)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setPermissionDenied(true);
      return;
    }

    setPermissionDenied(false);
    setConvMode(true);
    setState("listening");
    startListening();
  };

  const sendText = () => {
    if (!input.trim()) return;
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendText();
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <main className="comp-root" onClick={ensureAudioGraph}>
      <div className="comp-bg-1" aria-hidden />
      <div className="comp-bg-2" aria-hidden />
      <div className="comp-bg-3" aria-hidden />

      <header className="comp-header">
        <div className="brand">
          <div className="brand-logo" />
          <div>
            <div className="brand-name">PACAME</div>
            <div className="brand-sub">tu compañero IA</div>
          </div>
        </div>

        <div className="header-right">
          <select
            className="voice-pick"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            aria-label="Voz"
          >
            {VOICE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button
            className={`pill ${showText ? "pill-on" : ""}`}
            onClick={() => setShowText(!showText)}
            title="Mostrar/ocultar texto"
          >
            {showText ? "💬 texto" : "🔇 sin texto"}
          </button>
        </div>
      </header>

      <section className="stage">
        <AvatarHolograma state={state} analyser={analyser} />

        <div className={`status-pill status-${state}`}>
          {state === "idle" && (convMode ? "listo, dime" : "tócame para hablar")}
          {state === "listening" && (interim ? `«${interim}…»` : "te escucho…")}
          {state === "thinking" && "pensando…"}
          {state === "speaking" && "hablando"}
        </div>

        {showText && lastAssistant && (
          <div className="speech-bubble">
            <p>{lastAssistant.text}</p>
          </div>
        )}

        {permissionDenied && (
          <div className="warn-banner">
            ⚠️ Necesito permiso del micrófono. Haz click en el candado del navegador → Microphone → Allow → recarga.
          </div>
        )}
      </section>

      {/* Botón principal — el "Pou" se toca aquí */}
      <div className="main-controls">
        <button
          className={`talk-btn ${convMode ? "talk-active" : ""} talk-${state}`}
          onClick={toggleConversation}
          aria-label={convMode ? "Detener conversación" : "Empezar conversación"}
        >
          <div className="talk-rings">
            <span /><span /><span />
          </div>
          {convMode ? (
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>
        <p className="talk-hint">
          {convMode ? "Estoy en conversación contigo · toca para parar" : "Toca para iniciar conversación"}
        </p>
      </div>

      {/* Input texto opcional (siempre disponible) */}
      <div className="text-input-bar">
        <input
          className="text-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="…o escríbeme aquí"
          disabled={state === "thinking"}
        />
        <button className="send" onClick={sendText} disabled={state === "thinking" || !input.trim()}>
          ➤
        </button>
      </div>

      {showText && messages.length > 1 && (
        <details className="history">
          <summary>Conversación ({messages.length} mensajes)</summary>
          <div className="history-list">
            {messages.map((m, i) => (
              <div key={i} className={`hist-msg hist-${m.role}`}>{m.text}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </details>
      )}

      <audio ref={audioRef} hidden preload="auto" playsInline />
    </main>
  );
}

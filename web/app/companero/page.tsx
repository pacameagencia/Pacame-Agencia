/**
 * /companero — Compañero IA PACAME (versión inmersiva pública).
 *
 * - Voz: /api/tts con ElevenLabs (fallback OpenAI tts-1-hd). Audio real, no SpeechSynthesis.
 * - Avatar: Canvas 2D reactivo a AnalyserNode (lipsync por FFT).
 * - UI: fullscreen, pensada para demo/Instagram.
 * - Cerebro: /api/neural/execute con contexto PACAME (identidad Pablo embebida).
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AvatarHolograma from "./AvatarHolograma";
import "./companero.css";

type Message = { role: "user" | "assistant"; text: string; ts: number };
type AvatarState = "idle" | "listening" | "thinking" | "speaking";
type VoicePreset = { id: string; label: string; api: "elevenlabs" | "openai"; voice?: string };

const VOICE_PRESETS: VoicePreset[] = [
  { id: "onyx", label: "PACAME · Grave masculina", api: "elevenlabs", voice: "onyx" },
  { id: "ash", label: "Firme masculina", api: "elevenlabs", voice: "ash" },
  { id: "echo", label: "Cálida narrador", api: "elevenlabs", voice: "echo" },
  { id: "ballad", label: "Cercana masculina", api: "elevenlabs", voice: "ballad" },
  { id: "nova", label: "Vital femenina", api: "elevenlabs", voice: "nova" },
  { id: "shimmer", label: "Profesional femenina", api: "elevenlabs", voice: "shimmer" },
];

export default function CompaneroPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<AvatarState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [voice, setVoice] = useState<string>("onyx");
  const [chatOpen, setChatOpen] = useState(true);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reconocimiento de voz (Web Speech API — entrada)
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = false;
    recog.lang = "es-ES";
    recog.interimResults = false;
    recog.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMessage(transcript), 80);
    };
    recog.onend = () => setIsListening(false);
    recog.onerror = () => setIsListening(false);
    recognitionRef.current = recog;
  }, []);

  // Setup del AudioContext + Analyser una sola vez, cuando el elemento audio existe
  const setupAudioGraph = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx: AudioContext = new Ctx();
      const src = ctx.createMediaElementSource(audioRef.current);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0.7;
      src.connect(an);
      an.connect(ctx.destination);
      audioCtxRef.current = ctx;
      sourceRef.current = src;
      analyserRef.current = an;
      setAnalyser(an);
    } catch (err) {
      console.error("[companero] Audio graph error:", err);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari móvil.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setState("idle");
    } else {
      // Reanudar AudioContext si estaba suspendido (autoplay policy)
      audioCtxRef.current?.resume().catch(() => {});
      recognitionRef.current.start();
      setIsListening(true);
      setState("listening");
    }
  };

  const speak = async (text: string) => {
    setState("speaking");
    const audio = audioRef.current;
    if (!audio) { setState("idle"); return; }

    try {
      setupAudioGraph();
      audioCtxRef.current?.resume().catch(() => {});

      const preset = VOICE_PRESETS.find((p) => p.id === voice) || VOICE_PRESETS[0];
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: preset.voice || preset.id }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      audio.src = url;
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (err) {
      console.error("[companero] TTS error, fallback SpeechSynthesis:", err);
      // Fallback silencioso: Web Speech API
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-ES";
        u.rate = 1.05;
        u.onend = () => setState("idle");
        u.onerror = () => setState("idle");
        window.speechSynthesis.speak(u);
      } else {
        setTimeout(() => setState("idle"), 1500);
      }
    }
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages((prev) => [...prev, { role: "user", text: content, ts: Date.now() }]);
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
      const reply = json.reply || json.error || "Hubo un problema procesando tu mensaje.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply, ts: Date.now() }]);
      speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error de conexión con el cerebro. Inténtalo de nuevo.", ts: Date.now() },
      ]);
      setState("idle");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickAsk = (q: string) => {
    setInput(q);
    setTimeout(() => sendMessage(q), 40);
  };

  return (
    <main className="companero-root" onClick={setupAudioGraph}>
      {/* Fondo: grid + scanlines + starfield */}
      <div className="holo-grid" aria-hidden />
      <div className="holo-scanlines" aria-hidden />
      <div className="holo-stars" aria-hidden />

      {/* Header fijo */}
      <header className="companero-header">
        <div className="brand-tag">
          <span className="brand-dot" />
          <span>PACAME · ENTIDAD IA</span>
        </div>
        <div className="header-controls">
          <div className={`state-indicator state-${state}`}>
            {state === "idle" && "· disponible"}
            {state === "listening" && "· escuchando"}
            {state === "thinking" && "· procesando"}
            {state === "speaking" && "· hablando"}
          </div>
          <select
            className="voice-select"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            title="Cambiar voz"
          >
            {VOICE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Avatar ocupando todo el viewport */}
      <section className="avatar-stage">
        <AvatarHolograma state={state} analyser={analyser} />

        {/* Burbuja de último mensaje del asistente sobre el avatar */}
        {messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
          <div className="assistant-bubble">
            <div className="bubble-tag">PACAME</div>
            <p>{messages[messages.length - 1].text}</p>
          </div>
        )}

        {/* Sugerencias rápidas cuando no hay conversación aún */}
        {messages.length === 0 && (
          <div className="quick-prompts">
            <p className="qp-title">Dime algo. Te entiendo en español.</p>
            <div className="qp-row">
              <button onClick={() => quickAsk("Preséntate en 3 frases")}>Preséntate</button>
              <button onClick={() => quickAsk("¿Qué puedes hacer por mi negocio?")}>¿Qué haces?</button>
              <button onClick={() => quickAsk("Dame una idea de negocio online rentable hoy")}>Dame una idea</button>
            </div>
          </div>
        )}
      </section>

      {/* Barra inferior: mic + chat colapsable */}
      <div className="bottom-bar">
        <button
          type="button"
          className={`mic-btn ${isListening ? "mic-btn-active" : ""}`}
          onClick={toggleListening}
          title="Pulsa para hablar"
          aria-label="Hablar"
        >
          <span className="mic-ring" />
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>

        <div className={`chat-dock ${chatOpen ? "chat-open" : "chat-closed"}`}>
          <button
            className="chat-toggle"
            onClick={() => setChatOpen((o) => !o)}
            aria-label="Abrir/cerrar chat"
          >
            {chatOpen ? "▼" : "▲"}
          </button>

          {chatOpen && (
            <div className="chat-messages">
              {messages.length === 0 && (
                <p className="chat-empty">Dale al micro 🎙 o escribe. Conectado al cerebro PACAME.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg chat-msg-${m.role}`}>{m.text}</div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="chat-input-bar">
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escríbele algo…"
              disabled={state === "thinking"}
            />
            <button
              type="button"
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={state === "thinking" || !input.trim()}
              aria-label="Enviar"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Audio oculto — fuente real para AnalyserNode */}
      <audio ref={audioRef} hidden preload="auto" playsInline />

      <footer className="companero-footer">
        <span>Cerebro PACAME · Claude Sonnet 4.6 · {analyser ? "audio-reactive" : "waiting audio"} · pacameagencia.com</span>
      </footer>
    </main>
  );
}

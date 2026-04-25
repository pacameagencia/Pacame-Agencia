/**
 * /companero — JARVIS de PACAME · interfaz comando holográfico.
 * Layout grid HUD: panel izq (estado/conversación) | avatar central | log stream derecho.
 * Mobile: stack vertical, avatar protagonista, panel y logs colapsados.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarHolograma from "./AvatarHolograma";
import LogStream from "./LogStream";
import "./companero.css";

type Message = { role: "user" | "assistant"; text: string; ts: number };
type AvatarState = "idle" | "listening" | "thinking" | "speaking";

const GREETING = "Hola, soy Jarvis, el asistente de PACAME. Cuéntame, ¿a qué te dedicas?";

export default function CompaneroPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<AvatarState>("idle");
  const [convMode, setConvMode] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [interim, setInterim] = useState("");
  const [greeted, setGreeted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const convModeRef = useRef(convMode);
  const stateRef = useRef(state);
  const isListeningRef = useRef(false);
  const recogStopByMeRef = useRef(false);

  useEffect(() => { convModeRef.current = convMode; }, [convMode]);
  useEffect(() => { stateRef.current = state; }, [state]);

  // === Auto-petición de permiso de micrófono al cargar ===
  useEffect(() => {
    let cancelled = false;
    const ask = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        const perms: any = (navigator as any).permissions;
        if (perms?.query) {
          try {
            const status = await perms.query({ name: "microphone" as PermissionName });
            if (status.state === "granted") { if (!cancelled) setPermissionGranted(true); return; }
            if (status.state === "denied") { if (!cancelled) setPermissionDenied(true); return; }
          } catch {}
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) { setPermissionGranted(true); setPermissionDenied(false); }
      } catch (e: any) {
        if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
          if (!cancelled) setPermissionDenied(true);
        }
      }
    };
    const t = setTimeout(ask, 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // === Audio graph ===
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
        analyserRef.current = an;
        setAnalyser(an);
      } catch {}
    }
    audioCtxRef.current?.resume().catch(() => {});
  }, []);

  // === Speech Recognition ===
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "es-ES";
    recog.maxAlternatives = 1;

    recog.onstart = () => { isListeningRef.current = true; setState("listening"); };
    recog.onresult = (e: any) => {
      let finalText = "", partial = "";
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
        setPermissionDenied(true); setConvMode(false); setState("idle"); return;
      }
      if (convModeRef.current && stateRef.current === "listening") {
        setTimeout(() => { if (convModeRef.current) startListening(); }, 400);
      }
    };
    recog.onend = () => {
      isListeningRef.current = false;
      if (convModeRef.current && !recogStopByMeRef.current && stateRef.current === "listening") {
        setTimeout(() => { if (convModeRef.current && stateRef.current === "listening") startListening(); }, 200);
      }
      recogStopByMeRef.current = false;
    };
    recognitionRef.current = recog;
  }, []);

  const startListening = () => {
    const recog = recognitionRef.current;
    if (!recog || isListeningRef.current) return;
    try { recog.start(); }
    catch { setTimeout(() => { try { recog.start(); } catch {} }, 250); }
  };

  const stopListening = () => {
    const recog = recognitionRef.current;
    if (!recog) return;
    recogStopByMeRef.current = true;
    try { recog.stop(); } catch {}
    isListeningRef.current = false;
  };

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
          body: JSON.stringify({ text, voice: "onyx" }),
        });
        if (!res.ok) throw new Error("tts");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audio.src = url;
        const cleanup = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onended = cleanup;
        audio.onerror = cleanup;
        await audio.play();
      } catch {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "es-ES"; u.rate = 1.05;
          u.onend = () => resolve(); u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
        } else { setTimeout(resolve, 1200); }
      }
    });

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const userMsg = { role: "user" as const, text: content, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setState("thinking");
    try {
      const history = newMessages.slice(-7, -1).map((m) => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/companero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: content, history }),
      });
      const json = await res.json();
      const reply: string = json.reply || "Disculpa, no te he entendido. ¿Me lo repites?";
      setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]);
      await speak(reply);
      if (convModeRef.current) {
        setState("listening");
        setTimeout(() => { if (convModeRef.current) startListening(); }, 250);
      } else { setState("idle"); }
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Ahora mismo no te oigo bien. Vuelve a intentarlo.", ts: Date.now() }]);
      setState("idle");
    }
  };

  const greet = async () => {
    if (greeted) return;
    setGreeted(true);
    setMessages([{ role: "assistant", text: GREETING, ts: Date.now() }]);
    await speak(GREETING);
  };

  const toggleConversation = async () => {
    ensureAudioGraph();
    if (convMode) {
      setConvMode(false); stopListening();
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      setState("idle"); return;
    }
    if (!permissionGranted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissionGranted(true);
      } catch { setPermissionDenied(true); return; }
    }
    setPermissionDenied(false);
    if (!greeted) await greet();
    setConvMode(true);
    setState("listening");
    startListening();
  };

  const sendText = () => {
    if (!input.trim()) return;
    ensureAudioGraph();
    if (!greeted) setGreeted(true);
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); sendText(); }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const stateText = {
    idle: convMode ? "LISTO" : (greeted ? "PAUSA" : permissionGranted ? "ON · STANDBY" : permissionDenied ? "MIC DENEGADO" : "ARRANCANDO"),
    listening: interim ? "TRANSCRIBIENDO" : "ESCUCHANDO",
    thinking: "PROCESANDO",
    speaking: "RESPONDIENDO",
  }[state];

  const btnHint = convMode
    ? (state === "speaking" ? "respondiendo…" : state === "thinking" ? "pensando…" : "te escucho · habla")
    : (greeted ? "tocar para continuar" : "tocar y empezamos");

  return (
    <main className="jcomp">
      {/* Background layers */}
      <div className="jcomp-bg" aria-hidden>
        <div className="jcomp-grid" />
        <div className="jcomp-vignette" />
        <div className="jcomp-noise" />
      </div>

      {/* Top bar HUD */}
      <header className="jcomp-topbar">
        <div className="jcomp-brand">
          <div className="jcomp-brand-mark" />
          <div className="jcomp-brand-text">
            <span className="jcomp-brand-1">PACAME · JARVIS</span>
            <span className="jcomp-brand-2">comando asistente · v1.0</span>
          </div>
        </div>
        <div className="jcomp-status">
          <motion.span
            key={state}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`jcomp-status-pill jcomp-st-${state}`}
          >
            <span className="jcomp-status-dot" />
            {stateText}
          </motion.span>
          <a href="/" className="jcomp-back" aria-label="Volver al inicio">← inicio</a>
        </div>
      </header>

      {/* Main grid: avatar centro · panel izq · logs der */}
      <section className="jcomp-grid-main">
        {/* Panel izquierdo — info última respuesta + transcript */}
        <aside className="jcomp-panel jcomp-panel-left">
          <div className="jcomp-panel-header">
            <span className="jcomp-panel-tag">RESPUESTA</span>
            <span className="jcomp-panel-meta">canal · web</span>
          </div>
          <div className="jcomp-panel-body">
            <AnimatePresence mode="wait">
              {lastAssistant ? (
                <motion.div
                  key={lastAssistant.ts}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="jcomp-bubble"
                >
                  <p>{lastAssistant.text}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="jcomp-bubble jcomp-bubble-empty"
                >
                  <p>Esperando tu primera pregunta. Toca el botón inferior para empezar a hablar, o escribe abajo.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {interim && state === "listening" && (
              <div className="jcomp-interim">«{interim}…»</div>
            )}
          </div>

          {permissionDenied && (
            <div className="jcomp-warn">
              <strong>Micrófono bloqueado.</strong>
              <p>Pulsa el candado del navegador → Microphone → Permitir → recarga.</p>
            </div>
          )}

          <div className="jcomp-panel-footer">
            <span>cifrado · stateless</span>
            <span>v1.0</span>
          </div>
        </aside>

        {/* Avatar central — protagonista */}
        <div className="jcomp-stage">
          <AvatarHolograma state={state} analyser={analyser} />
        </div>

        {/* Logs derecho */}
        <aside className="jcomp-panel jcomp-panel-right">
          <LogStream state={state} />
        </aside>
      </section>

      {/* Bottom bar: botón principal + input texto + nota legal */}
      <footer className="jcomp-bottombar" onClick={ensureAudioGraph}>
        <div className="jcomp-control">
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            className={`jcomp-talk jcomp-talk-${state} ${convMode ? "is-active" : ""}`}
            onClick={toggleConversation}
            aria-label={btnHint}
          >
            <span className="jcomp-talk-glow" />
            <span className="jcomp-talk-pulse" />
            {convMode ? (
              <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </motion.button>
          <span className="jcomp-talk-hint">{btnHint}</span>
        </div>

        <div className="jcomp-text-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="…o escríbeme aquí si prefieres"
            disabled={state === "thinking"}
          />
          <button onClick={sendText} disabled={state === "thinking" || !input.trim()} aria-label="Enviar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        <p className="jcomp-legal">
          stateless · no guardo conversaciones · ¿prefieres hablar con un humano?{" "}
          <a href="https://wa.me/34722669381?text=Hola%20PACAME">WhatsApp</a>{" · "}
          <a href="mailto:hola@pacameagencia.com">email</a>
        </p>
      </footer>

      <audio ref={audioRef} hidden preload="auto" playsInline />
    </main>
  );
}

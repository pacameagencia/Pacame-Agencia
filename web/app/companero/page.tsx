/**
 * /companero — JARVIS de PACAME (mobile-first, abuela-friendly).
 *
 * Diseño:
 *   - Mobile principal (la mayoría del tráfico): avatar arriba, bocadillo enorme,
 *     botón mega con texto claro, tipografía grande, colores cálidos.
 *   - Desktop: misma jerarquía, más respiro lateral, panel discreto opcional.
 *   - SIN logs técnicos. SIN jerga. Que lo entienda mi abuela.
 *
 * Flujo conversación: 1 toque → loop continuo escuchar→pensar→hablar→escuchar.
 * Voz Brian (ElevenLabs). Endpoint público sanitizado /api/companero.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarHolograma from "./AvatarHolograma";
import "./companero.css";

type Message = { role: "user" | "assistant"; text: string; ts: number };
type AvatarState = "idle" | "listening" | "thinking" | "speaking";

const GREETING = "Hola, soy Jarvis. Cuéntame, ¿a qué te dedicas?";

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

  // === Auto-petición de permiso de mic al cargar ===
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

  // Cleanup AudioContext + recognition + audio cuando se desmonta la página
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      const a = audioRef.current;
      if (a) { try { a.pause(); a.src = ""; } catch {} }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== "closed") { ctx.close().catch(() => {}); }
    };
  }, []);

  // Trim mensajes a últimos 30 (evita crecer indefinido en sesiones largas)
  useEffect(() => {
    if (messages.length > 30) {
      setMessages((m) => m.slice(-30));
    }
  }, [messages.length]);

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
        // Pausa cualquier audio anterior antes de cambiar src — previene AbortError en iOS Safari
        try { audio.pause(); } catch {}
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

  // Texto en HUMANO — nada de jerga
  const statusText: Record<AvatarState, string> = {
    idle: convMode ? "Listo, dime" :
          greeted ? "Pulsa para seguir" :
          permissionGranted ? "Pulsa el botón de abajo" :
          permissionDenied ? "Activa el micro para hablar" :
          "Hola, ¿hablamos?",
    listening: interim ? `“${interim}…”` : "Te estoy escuchando",
    thinking: "Pensando…",
    speaking: "Hablando contigo",
  };

  // Texto del botón
  const btnText = convMode
    ? (state === "speaking" ? "Te respondo…" :
       state === "thinking" ? "Pensando…" :
       "Habla, te escucho")
    : "Pulsa para hablar";

  return (
    <main className="jc">
      {/* Fondo cálido */}
      <div className="jc-bg" aria-hidden>
        <div className="jc-blob jc-blob-1" />
        <div className="jc-blob jc-blob-2" />
        <div className="jc-blob jc-blob-3" />
      </div>

      {/* Top simple */}
      <header className="jc-top">
        <a href="/" className="jc-back" aria-label="Volver">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="jc-brand">
          <span className="jc-brand-name">JARVIS</span>
          <span className="jc-brand-sub">tu asistente PACAME</span>
        </div>
        <div className="jc-spacer" />
      </header>

      {/* Avatar protagonista */}
      <section className="jc-avatar">
        <AvatarHolograma state={state} analyser={analyser} />
      </section>

      {/* Bocadillo grande con la última respuesta o saludo */}
      <section className="jc-message">
        <AnimatePresence mode="wait">
          {lastAssistant ? (
            <motion.div
              key={lastAssistant.ts}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="jc-bubble"
            >
              <p>{lastAssistant.text}</p>
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="jc-bubble jc-bubble-welcome"
            >
              <p>Hola, soy <strong>Jarvis</strong>. Te ayudo con tu negocio. Pulsa el botón grande de abajo y cuéntame qué necesitas.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {interim && state === "listening" && (
          <div className="jc-interim">“{interim}…”</div>
        )}

        {permissionDenied && (
          <div className="jc-warn">
            Para hablar necesito permiso del micrófono. Pulsa el candado de la barra del navegador → Microphone → Permitir.
          </div>
        )}
      </section>

      {/* Status humano (aria-live para lectores de pantalla) */}
      <p className={`jc-status jc-st-${state}`} role="status" aria-live="polite">{statusText[state]}</p>

      {/* Botón gigante con TEXTO claro */}
      <div className="jc-action" onClick={ensureAudioGraph}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className={`jc-talk jc-talk-${state} ${convMode ? "is-active" : ""}`}
          onClick={toggleConversation}
          aria-label={btnText}
        >
          <span className="jc-talk-pulse" aria-hidden />
          <span className="jc-talk-pulse jc-talk-pulse-2" aria-hidden />
          <span className="jc-talk-icon">
            {convMode ? (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </span>
          <span className="jc-talk-text">{btnText}</span>
        </motion.button>
      </div>

      {/* Input de texto opcional */}
      <div className="jc-input-row">
        <input
          className="jc-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="…o escribe aquí si prefieres"
          disabled={state === "thinking"}
        />
        <button className="jc-send" onClick={sendText} disabled={state === "thinking" || !input.trim()} aria-label="Enviar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      <p className="jc-foot">
        Si prefieres a un humano:{" "}
        <a href="https://wa.me/34722669381?text=Hola%20PACAME">WhatsApp</a>{" o "}
        <a href="mailto:hola@pacameagencia.com">email</a>
      </p>

      <audio ref={audioRef} hidden preload="auto" playsInline />
    </main>
  );
}

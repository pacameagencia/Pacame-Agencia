/**
 * /companero — JARVIS de PACAME (asistente IA público).
 *
 * Diseñado para que CUALQUIER usuario lo use sin instrucciones:
 * - Un solo botón grande con texto claro
 * - Saludo automático al entrar
 * - Voz fija (Brian) — sin opciones que confundan
 * - Conversación continua tipo Siri tras tocar el botón
 * - Cero jerga técnica ni info interna PACAME
 *
 * Endpoint: /api/companero (público, sanitizado, NO neural/execute)
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AvatarHolograma from "./AvatarHolograma";
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
  const [audioReady, setAudioReady] = useState(false);
  const [greeted, setGreeted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const convModeRef = useRef(convMode);
  const stateRef = useRef(state);
  const isListeningRef = useRef(false);
  const recogStopByMeRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { convModeRef.current = convMode; }, [convMode]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // === Auto-petición de permiso de micrófono al cargar la página ===
  // - Si el navegador soporta Permissions API, comprobamos primero el estado:
  //   · 'granted' → ya está concedido, listos
  //   · 'denied'  → mostramos banner explicativo
  //   · 'prompt'  → pedimos auto-mente con getUserMedia (Chrome/Edge/Firefox lo permiten;
  //                 iOS Safari requiere gesto, fallará silencioso → se pedirá al primer click)
  // - Si no hay Permissions API, intentamos getUserMedia directamente.
  useEffect(() => {
    let cancelled = false;
    const requestMicPermission = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        // Intenta consultar estado actual primero (no dispara prompt)
        const perms: any = (navigator as any).permissions;
        if (perms?.query) {
          try {
            const status = await perms.query({ name: "microphone" as PermissionName });
            if (status.state === "granted") {
              if (!cancelled) setPermissionGranted(true);
              return;
            }
            if (status.state === "denied") {
              if (!cancelled) setPermissionDenied(true);
              return;
            }
            // 'prompt' → seguimos abajo y pedimos
          } catch {
            // algunos navegadores no soportan { name: 'microphone' } — caemos abajo
          }
        }

        // Pedimos permiso (esto dispara el prompt nativo del navegador)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // No retenemos el stream — solo era para forzar el prompt
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) {
          setPermissionGranted(true);
          setPermissionDenied(false);
        }
      } catch (err: any) {
        // En iOS Safari sin gesto → NotAllowedError. Lo silenciamos y dejamos
        // que el botón principal lo pida de nuevo en el primer click.
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          // Solo marca denied si NO es por falta de gesto (esos casos no tienen 'denied' en Permissions API)
          // En la práctica: si Permissions devolvió 'prompt' y aquí falla = denegó manualmente.
          if (!cancelled) setPermissionDenied(true);
        }
      }
    };
    // Pequeño retraso para no chocar con el "permission prompt" durante el loadingScreen
    const t = setTimeout(requestMicPermission, 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Audio graph init al primer click
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
        setAudioReady(true);
      } catch {}
    }
    audioCtxRef.current?.resume().catch(() => {});
  }, []);

  // SpeechRecognition
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
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
      if (convModeRef.current && stateRef.current === "listening") {
        setTimeout(() => {
          if (convModeRef.current) startListening();
        }, 400);
      }
    };

    recog.onend = () => {
      isListeningRef.current = false;
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
    if (!recog || isListeningRef.current) return;
    try { recog.start(); }
    catch {
      setTimeout(() => { try { recog.start(); } catch {} }, 250);
    }
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
          u.onend = () => resolve();
          u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
        } else {
          setTimeout(resolve, 1200);
        }
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
      // Historial corto para contexto del LLM (max 6 turnos previos)
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
      } else {
        setState("idle");
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Ahora mismo no te oigo bien. Vuelve a intentarlo.", ts: Date.now() },
      ]);
      setState("idle");
    }
  };

  // Saludo automático al primer click (incluso antes de hablar)
  const greet = async () => {
    if (greeted) return;
    setGreeted(true);
    setMessages([{ role: "assistant", text: GREETING, ts: Date.now() }]);
    await speak(GREETING);
  };

  // Botón principal: si no ha saludado, saluda + activa modo. Si está activo, para.
  const toggleConversation = async () => {
    ensureAudioGraph();

    if (convMode) {
      setConvMode(false);
      stopListening();
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      setState("idle");
      return;
    }

    // Si aún no tenemos permiso, lo pedimos (al haber gesto del usuario funciona en iOS también)
    if (!permissionGranted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissionGranted(true);
      } catch {
        setPermissionDenied(true);
        return;
      }
    }
    setPermissionDenied(false);

    // Si no ha saludado, saluda primero
    if (!greeted) {
      await greet();
    }

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
    if (e.key === "Enter") {
      e.preventDefault();
      sendText();
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  // Texto del botón según estado (claro para abuelos)
  const btnLabel = convMode
    ? (state === "speaking" ? "Te respondo..." : state === "thinking" ? "Pensando..." : "Te escucho. Habla.")
    : (greeted ? "Tócame para hablar" : "Tócame y empezamos");

  return (
    <main className="comp-root" onClick={ensureAudioGraph}>
      <div className="comp-bg-1" aria-hidden />
      <div className="comp-bg-2" aria-hidden />
      <div className="comp-bg-3" aria-hidden />

      <header className="comp-header">
        <div className="brand">
          <div className="brand-logo" />
          <div>
            <div className="brand-name">JARVIS</div>
            <div className="brand-sub">tu asistente PACAME</div>
          </div>
        </div>
        <a href="/" className="home-link" aria-label="Volver al inicio">← inicio</a>
      </header>

      <section className="stage">
        <AvatarHolograma state={state} analyser={analyser} />

        <div className={`status-pill status-${state}`}>
          {state === "idle" && (
            convMode ? "Listo, dime" :
            greeted ? "Toca el botón abajo" :
            permissionGranted ? "Micro listo · toca el botón" :
            permissionDenied ? "Falta permiso del micro" :
            "Bienvenido"
          )}
          {state === "listening" && (interim ? `«${interim}…»` : "Te escucho…")}
          {state === "thinking" && "Pensando…"}
          {state === "speaking" && "Hablando contigo"}
        </div>

        {lastAssistant && (
          <div className="speech-bubble" key={lastAssistant.ts}>
            <p>{lastAssistant.text}</p>
          </div>
        )}

        {permissionDenied && (
          <div className="warn-banner">
            ⚠️ Para hablar necesito permiso de tu micro. Pulsa el candado del navegador → Microphone → Permitir, y recarga la página.
          </div>
        )}
      </section>

      {/* Botón principal — el que toca un usuario sin instrucciones */}
      <div className="main-controls">
        <button
          className={`talk-btn ${convMode ? "talk-active" : ""} talk-${state}`}
          onClick={toggleConversation}
          aria-label={btnLabel}
        >
          <div className="talk-rings">
            <span /><span /><span />
          </div>
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
        </button>
        <p className="talk-hint">{btnLabel}</p>
      </div>

      {/* Input texto: alternativa para quien no quiere hablar (móvil ruidoso, sin permiso de mic, etc) */}
      <div className="text-input-bar">
        <input
          className="text-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="…o escríbeme aquí si prefieres"
          disabled={state === "thinking"}
        />
        <button className="send" onClick={sendText} disabled={state === "thinking" || !input.trim()} aria-label="Enviar">
          ➤
        </button>
      </div>

      <p className="legal-note">
        Tu conversación no se guarda. Respondo solo sobre PACAME y tu negocio. ¿Prefieres a un humano? <a href="https://wa.me/34722669381?text=Hola%20PACAME">WhatsApp</a> o <a href="mailto:hola@pacameagencia.com">email</a>.
      </p>

      <audio ref={audioRef} hidden preload="auto" playsInline />
    </main>
  );
}

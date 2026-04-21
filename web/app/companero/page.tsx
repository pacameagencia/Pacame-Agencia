/**
 * /companero — Avatar visual PACAME
 *
 * Asistente IA visual + voz conectado al cerebro PACAME.
 * Stack zero-dependency-new: SVG + CSS shaders + Web Speech API + /api/neural/execute.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import AvatarHolograma from "./AvatarHolograma";
import "./companero.css";

type Message = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

export default function CompaneroPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<AvatarState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  // SpeechRecognition es web API opcional, usamos any para evitar issue TS
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll auto al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Inicializar reconocimiento de voz (webkitSpeechRecognition)
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
      setTimeout(() => sendMessage(transcript), 100);
    };
    recog.onend = () => setIsListening(false);
    recog.onerror = () => setIsListening(false);
    recognitionRef.current = recog;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setState("idle");
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setState("listening");
    }
  };

  const speak = async (text: string) => {
    setState("speaking");
    // Web Speech API (fallback gratuito)
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      // Elegir voz española disponible (mejor voz masculina española)
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice =
        voices.find((v) => v.lang.startsWith("es") && v.name.toLowerCase().includes("male")) ||
        voices.find((v) => v.lang.startsWith("es-ES")) ||
        voices.find((v) => v.lang.startsWith("es"));
      if (spanishVoice) utterance.voice = spanishVoice;

      // Simular lipsync: oscilar amplitud mientras habla
      const interval = setInterval(() => {
        setAudioAmplitude(0.3 + Math.random() * 0.7);
      }, 120);

      utterance.onend = () => {
        clearInterval(interval);
        setAudioAmplitude(0);
        setState("idle");
      };
      utterance.onerror = () => {
        clearInterval(interval);
        setAudioAmplitude(0);
        setState("idle");
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // No hay TTS, vuelta a idle
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;

    setMessages((prev) => [...prev, { role: "user", text: content, timestamp: Date.now() }]);
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

      setMessages((prev) => [...prev, { role: "assistant", text: reply, timestamp: Date.now() }]);
      speak(reply);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error de conexión con el cerebro. Inténtalo de nuevo.", timestamp: Date.now() },
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

  return (
    <main className="companero-root">
      {/* Background pattern holográfico */}
      <div className="holo-grid" aria-hidden />
      <div className="holo-scanlines" aria-hidden />

      <div className="companero-container">
        <header className="companero-header">
          <div className="brand-tag">
            <span className="brand-dot" />
            <span>PACAME · COMPAÑERO IA</span>
          </div>
          <div className={`state-indicator state-${state}`}>
            {state === "idle" && "En escucha"}
            {state === "listening" && "Te escucho..."}
            {state === "thinking" && "Pensando..."}
            {state === "speaking" && "Hablando..."}
          </div>
        </header>

        <section className="avatar-section">
          <AvatarHolograma state={state} amplitude={audioAmplitude} />
        </section>

        <section className="chat-section">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>Pulsa el micro o escribe abajo para hablar con tu compañero.</p>
                <p className="muted">Conectado al cerebro PACAME · responde con tu visión</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                <div className="chat-msg-text">{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-bar">
            <button
              type="button"
              className={`mic-btn ${isListening ? "mic-btn-active" : ""}`}
              onClick={toggleListening}
              title="Pulsa para hablar"
            >
              {isListening ? "⏹" : "🎙"}
            </button>
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe o pulsa el micro..."
              disabled={state === "thinking"}
            />
            <button
              type="button"
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={state === "thinking" || !input.trim()}
            >
              Enviar
            </button>
          </div>
        </section>

        <footer className="companero-footer">
          <span>⚡ Cerebro PACAME · Claude Sonnet 4.6 · 1.862 nodos · identidad Pablo</span>
        </footer>
      </div>
    </main>
  );
}

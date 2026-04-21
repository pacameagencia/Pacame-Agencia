"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, User, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hola! Soy Sage, la estratega de PACAME. Cuentame sobre tu negocio y lo que necesitas, y te oriento sobre como podemos ayudarte. Sin compromiso.",
};

const LEAD_CAPTURE_THRESHOLD = 3; // Show form after N user messages

export default function SageChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          agent: "sage",
          context: "public_web_visitor",
        }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json();
      const assistantText =
        data.content?.[0]?.text ||
        data.message ||
        "Disculpa, ha habido un error. Escribenos a hola@pacameagencia.com y te respondemos directamente.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantText },
      ]);

      // Show lead form after enough engagement and not yet captured
      const newUserCount = updatedMessages.filter((m) => m.role === "user").length;
      if (newUserCount >= LEAD_CAPTURE_THRESHOLD && !leadCaptured) {
        setShowLeadForm(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Parece que hay un problema tecnico. Escribenos directamente a hola@pacameagencia.com o por WhatsApp al +34 722 669 381 y te respondemos enseguida.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim()) return;
    setLeadSubmitting(true);

    // Build conversation summary for context
    const conversationSummary = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" | ");

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          source: "chat_sage",
          message: conversationSummary.slice(0, 500),
        }),
      });

      setLeadCaptured(true);
      setShowLeadForm(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Perfecto ${leadName.split(" ")[0]}! Te hemos registrado. Pablo revisara tu caso y te contactara pronto. Mientras, puedes seguir preguntandome lo que necesites.`,
        },
      ]);
    } catch {
      // Silently fail — don't break the chat experience
      setShowLeadForm(false);
    } finally {
      setLeadSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir chat con Sage"
        className="fixed bottom-6 right-24 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/30 hover:scale-105 hover:shadow-xl hover:shadow-brand-primary/40 transition-all duration-200 font-body text-sm font-medium"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline">Habla con Sage</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl bg-paper-soft border border-ink/[0.08] shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-ink/[0.06] bg-paper-deep">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-heading font-semibold text-ink">
            Sage
          </div>
          <div className="text-xs text-ink/40 font-body flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            Estratega de PACAME
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "assistant"
                  ? "bg-brand-primary/20"
                  : "bg-mint/20"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-3.5 h-3.5 text-brand-primary" />
              ) : (
                <User className="w-3.5 h-3.5 text-mint" />
              )}
            </div>
            <div
              className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm font-body leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-paper-deep text-ink/80 rounded-tl-sm"
                  : "bg-brand-primary/15 text-ink rounded-tr-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-brand-primary" />
            </div>
            <div className="bg-paper-deep px-4 py-3 rounded-xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
            </div>
          </div>
        )}

        {/* Lead capture form — inline in chat after engagement */}
        {showLeadForm && !leadCaptured && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-mint/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-mint" />
            </div>
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-paper-deep border border-mint/20 p-3.5">
              <p className="text-xs text-ink/70 font-body mb-3">
                Me encanta tu proyecto! Dejame tu nombre y email para que Pablo pueda prepararte algo personalizado:
              </p>
              <form onSubmit={handleLeadSubmit} className="space-y-2">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                  className="w-full h-8 px-3 rounded-lg bg-paper-soft border border-ink/[0.08] text-xs text-ink font-body placeholder:text-ink/30 focus:border-mint/50 outline-none"
                />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  required
                  className="w-full h-8 px-3 rounded-lg bg-paper-soft border border-ink/[0.08] text-xs text-ink font-body placeholder:text-ink/30 focus:border-mint/50 outline-none"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint text-ink text-xs font-heading font-semibold hover:bg-mint/90 transition-colors disabled:opacity-50"
                  >
                    {leadSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="text-[10px] text-ink/30 hover:text-ink/50 transition-colors font-body"
                  >
                    Ahora no
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-ink/[0.06] bg-paper-deep">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1 h-10 px-3.5 rounded-xl bg-paper-soft border border-ink/[0.06] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-ink/20 font-body mt-1.5 text-center">
          Sage es una IA. Pablo supervisa las conversaciones.
        </p>
      </div>
    </div>
  );
}

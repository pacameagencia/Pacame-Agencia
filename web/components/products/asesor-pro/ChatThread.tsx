"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Message {
  id: string;
  sender_user_id: string;
  body: string;
  attachments: unknown;
  read_at: string | null;
  created_at: string;
}

interface Props {
  asesorClientId: string;
  currentUserId: string;
  /** Etiqueta del 'otro' lado (mostrar header). Ej: "Casa Marisol" o "Asesor Flow" */
  counterpartName: string;
  /** Texto bajo nombre. Ej: "Cliente · NIF B12..." o "Tu asesor" */
  counterpartSubtitle?: string;
}

export default function ChatThread({
  asesorClientId,
  currentUserId,
  counterpartName,
  counterpartSubtitle,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al fondo cuando cambian los mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Carga inicial + suscripción Realtime
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/asesor-pro/messages?asesor_client_id=${asesorClientId}`);
        const json = await res.json();
        if (!cancelled && json.messages) setMessages(json.messages);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel(`asesorpro:thread:${asesorClientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "asesorpro_messages",
          filter: `asesor_client_id=eq.${asesorClientId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Evitar duplicado si ya lo añadimos optimistic-mente
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [asesorClientId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_user_id: currentUserId,
      body,
      attachments: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch("/api/products/asesor-pro/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asesor_client_id: asesorClientId, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error enviando");
      // Reemplazar el optimistic por el real
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (json.message as Message) : m))
      );
    } catch (err) {
      // Marcar como fallido y dejar que el user reintente (devuelve el body al input)
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body);
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  // Agrupar por día
  const grouped: { day: string; messages: Message[] }[] = [];
  for (const m of messages) {
    const day = new Date(m.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) last.messages.push(m);
    else grouped.push({ day, messages: [m] });
  }

  return (
    <div className="bg-paper border-2 border-ink flex flex-col h-[600px]" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
      {/* Header */}
      <header className="px-5 py-4 border-b-2 border-ink bg-sand-100">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block">Chat</span>
        <h3 className="font-display text-ink text-lg" style={{ fontWeight: 500 }}>{counterpartName}</h3>
        {counterpartSubtitle && (
          <span className="font-mono text-[11px] text-ink-mute">{counterpartSubtitle}</span>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-ink-mute animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-ink-mute font-sans text-sm">
            Sin mensajes aún. Empieza la conversación.
          </div>
        ) : (
          grouped.map((group, gi) => (
            <div key={gi} className="space-y-2">
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-ink/15" />
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">{group.day}</span>
                <div className="flex-1 h-px bg-ink/15" />
              </div>
              {group.messages.map((m) => {
                const mine = m.sender_user_id === currentUserId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] ${mine ? "bg-ink text-paper" : "bg-sand-100 text-ink border border-ink/15"} px-4 py-2`}>
                      <p className="font-sans text-[14px] leading-snug whitespace-pre-wrap break-words">{m.body}</p>
                      <span className={`block mt-1 font-mono text-[9px] tracking-[0.1em] ${mine ? "text-paper/50" : "text-ink-mute"}`}>
                        {formatTime(m.created_at)}
                        {mine && m.read_at && " · leído"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t-2 border-ink p-3 flex items-end gap-2 bg-paper">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Escribe un mensaje · Enter envía, Shift+Enter salto de línea"
          rows={1}
          maxLength={4000}
          className="flex-1 px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink resize-none max-h-32"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          style={{ boxShadow: "3px 3px 0 #B54E30" }}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquare, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useToast } from "@/components/ui/toast";

interface Message {
  id: string;
  sender: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(async (markRead = false) => {
    try {
      const res = await fetch("/api/client-messages");
      if (!res.ok) throw new Error("Error al cargar mensajes");
      const result = (await res.json()) as { messages: Message[] };
      setMessages(result.messages);

      // Mark unread as read
      if (markRead) {
        const hasUnread = result.messages.some((m) => !m.read && m.sender !== "client");
        if (hasUnread) {
          await fetch("/api/client-messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "mark_read" }),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/client-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", message: text }),
      });
      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error ?? "Error al enviar");
      }
      setNewMessage("");
      await fetchMessages(false);
      inputRef.current?.focus();
      toast({ variant: "success", title: "Mensaje enviado", description: "El equipo de PACAME lo verá en breve." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar";
      setError(msg);
      toast({ variant: "error", title: "No se pudo enviar", description: msg });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function getSenderInfo(sender: string): { label: string; isClient: boolean; isAgent: boolean } {
    if (sender === "client") return { label: "Tu", isClient: true, isAgent: false };
    if (sender === "team") return { label: "Equipo PACAME", isClient: false, isAgent: false };
    if (sender.startsWith("agent:")) {
      const agentName = sender.replace("agent:", "");
      return { label: agentName, isClient: false, isAgent: true };
    }
    return { label: sender, isClient: false, isAgent: false };
  }

  const primaryColor =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--client-primary").trim() || "#7C3AED"
      : "#7C3AED";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
          <div>
            <h1 className="font-heading font-bold text-2xl text-ink">Mensajes</h1>
            <p className="text-xs text-ink/40 font-body">
              Comunicate con tu equipo PACAME
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Messages area */}
      <div className="flex-1 bg-paper-deep border border-ink/[0.06] rounded-2xl flex flex-col overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MessageSquare className="w-12 h-12 text-ink/10 mb-3" />
              <p className="text-sm text-ink/30 font-body">
                Aun no hay mensajes. Envia el primero.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const { label, isClient, isAgent } = getSenderInfo(msg.sender);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[65%] ${
                        isClient ? "order-2" : "order-1"
                      }`}
                    >
                      {/* Sender name */}
                      <div
                        className={`flex items-center gap-1.5 mb-1 ${
                          isClient ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isClient && (
                          isAgent ? (
                            <Bot className="w-3 h-3 text-cyan-spark" />
                          ) : (
                            <User className="w-3 h-3 text-brand-primary" />
                          )
                        )}
                        <span className="text-[10px] text-ink/30 font-body">
                          {label}
                        </span>
                        <span className="text-[10px] text-ink/20 font-body">
                          {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                          isClient
                            ? "rounded-br-md text-white"
                            : "rounded-bl-md bg-white/[0.06] text-ink/80 border border-ink/[0.06]"
                        }`}
                        style={isClient ? { backgroundColor: primaryColor } : undefined}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-accent-burgundy-soft/10 border-t border-accent-burgundy-soft/20">
            <p className="text-xs text-accent-burgundy-soft font-body">{error}</p>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="border-t border-ink/[0.06] p-3 sm:p-4 flex items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors min-h-[44px] max-h-[120px]"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            variant="gradient"
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

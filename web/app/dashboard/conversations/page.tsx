"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  MessageCircle, Send, User, Bot, Clock, Phone,
  ArrowDownUp, Search, Loader2, CheckCheck, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  channel: string;
  direction: "inbound" | "outbound";
  sender: string;
  message: string;
  message_type: string;
  mode: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: "lead" | "client";
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();

    // Real-time subscription
    const channel = supabase
      .channel("wa-conversations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => {
        const newMsg = payload.new as Conversation;
        setConversations((prev) => [...prev, newMsg]);
        updateContactList(newMsg);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedContact]);

  async function loadConversations() {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("channel", "whatsapp")
      .order("created_at", { ascending: true })
      .limit(500);

    const msgs = data || [];
    setConversations(msgs);

    // Build contact list from messages
    const contactMap = new Map<string, Contact>();

    for (const msg of msgs) {
      const contactId = msg.lead_id || msg.client_id || msg.sender;
      const contactName = (msg.metadata?.contact_name as string) || msg.sender;

      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          id: contactId,
          name: contactName,
          phone: msg.direction === "inbound" ? msg.sender : "",
          type: msg.client_id ? "client" : "lead",
          lastMessage: msg.message,
          lastMessageAt: msg.created_at,
          unread: 0,
        });
      } else {
        const existing = contactMap.get(contactId)!;
        if (new Date(msg.created_at) > new Date(existing.lastMessageAt)) {
          existing.lastMessage = msg.message;
          existing.lastMessageAt = msg.created_at;
        }
        if (!existing.phone && msg.direction === "inbound") {
          existing.phone = msg.sender;
        }
      }
    }

    setContacts(
      Array.from(contactMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )
    );
    setLoading(false);
  }

  function updateContactList(msg: Conversation) {
    setContacts((prev) => {
      const contactId = msg.lead_id || msg.client_id || msg.sender;
      const existing = prev.find((c) => c.id === contactId);
      if (existing) {
        return prev
          .map((c) =>
            c.id === contactId
              ? { ...c, lastMessage: msg.message, lastMessageAt: msg.created_at }
              : c
          )
          .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      }
      return [
        {
          id: contactId,
          name: (msg.metadata?.contact_name as string) || msg.sender,
          phone: msg.direction === "inbound" ? msg.sender : "",
          type: msg.client_id ? "client" : "lead",
          lastMessage: msg.message,
          lastMessageAt: msg.created_at,
          unread: 0,
        },
        ...prev,
      ];
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selectedContact) return;

    const contact = contacts.find((c) => c.id === selectedContact);
    if (!contact?.phone) return;

    setSending(true);
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          phone: contact.phone,
          message: message.trim(),
          lead_id: contact.type === "lead" ? contact.id : undefined,
          client_id: contact.type === "client" ? contact.id : undefined,
        }),
      });
      setMessage("");
    } catch {
      // Non-blocking
    }
    setSending(false);
  }

  const selectedMessages = conversations.filter((c) => {
    const contactId = c.lead_id || c.client_id || c.sender;
    return contactId === selectedContact;
  });

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const selectedContactData = contacts.find((c) => c.id === selectedContact);

  // Stats
  const totalConversations = contacts.length;
  const inboundToday = conversations.filter(
    (c) => c.direction === "inbound" && new Date(c.created_at).toDateString() === new Date().toDateString()
  ).length;
  const outboundToday = conversations.filter(
    (c) => c.direction === "outbound" && new Date(c.created_at).toDateString() === new Date().toDateString()
  ).length;
  const aiResponses = conversations.filter((c) => c.metadata?.ai_generated).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-ink">Conversaciones WhatsApp</h1>
        <p className="text-sm text-ink/40 font-body mt-1">
          {loading ? "Cargando..." : `${totalConversations} contactos · ${conversations.length} mensajes`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-4 text-center">
          <MessageCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <div className="font-heading font-bold text-xl text-ink">{totalConversations}</div>
          <div className="text-[11px] text-ink/40 font-body">Contactos</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-4 text-center">
          <ArrowDownUp className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
          <div className="font-heading font-bold text-xl text-ink">{inboundToday}</div>
          <div className="text-[11px] text-ink/40 font-body">Recibidos hoy</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-4 text-center">
          <Send className="w-5 h-5 text-brand-primary mx-auto mb-2" />
          <div className="font-heading font-bold text-xl text-ink">{outboundToday}</div>
          <div className="text-[11px] text-ink/40 font-body">Enviados hoy</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-4 text-center">
          <Bot className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <div className="font-heading font-bold text-xl text-ink">{aiResponses}</div>
          <div className="text-[11px] text-ink/40 font-body">Respuestas IA</div>
        </div>
      </div>

      {/* Chat layout */}
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden flex" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
        {/* Contact list */}
        <div className="w-80 border-r border-ink/[0.06] flex flex-col">
          <div className="p-3 border-b border-ink/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input
                type="text"
                placeholder="Buscar contacto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-ink/[0.06] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-8 h-8 text-ink/10 mx-auto mb-2" />
                <p className="text-sm text-ink/30 font-body">
                  {search ? "Sin resultados" : "No hay conversaciones"}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left border-b border-white/[0.03] transition-colors ${
                    selectedContact === contact.id
                      ? "bg-brand-primary/10"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-body text-ink font-medium truncate">
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-ink/30 font-body flex-shrink-0 ml-2">
                        {timeAgo(contact.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {contact.type === "client" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-primary font-body">
                          cliente
                        </span>
                      )}
                      <p className="text-xs text-ink/40 font-body truncate">
                        {contact.lastMessage.length > 50
                          ? contact.lastMessage.slice(0, 50) + "..."
                          : contact.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedContact && selectedContactData ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-ink/[0.06] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-ink">
                    {selectedContactData.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {selectedContactData.phone && (
                      <span className="text-[11px] text-ink/40 font-body flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        +{selectedContactData.phone}
                      </span>
                    )}
                    <span className="text-[11px] text-ink/30 font-body">
                      {selectedContactData.type === "client" ? "Cliente" : "Lead"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-ink/30 font-body">Sin mensajes</p>
                  </div>
                ) : (
                  selectedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          msg.direction === "outbound"
                            ? "bg-brand-primary/20 border border-brand-primary/10"
                            : "bg-white/[0.06] border border-white/[0.04]"
                        }`}
                      >
                        <p className="text-sm text-ink/90 font-body whitespace-pre-line">
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-ink/30 font-body">
                            {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {msg.direction === "outbound" && (
                            <CheckCheck className="w-3 h-3 text-cyan-400/60" />
                          )}
                          {(msg.metadata?.ai_generated as boolean) && (
                            <span title="Respuesta IA"><Bot className="w-3 h-3 text-amber-400/60" /></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-ink/[0.06] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!selectedContactData.phone}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-ink/[0.06] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none disabled:opacity-40"
                />
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={sending || !message.trim() || !selectedContactData.phone}
                  className="gap-1.5"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>

              {!selectedContactData.phone && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 text-amber-400/70 text-xs font-body">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Este contacto no tiene numero de WhatsApp
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-ink/10 mx-auto mb-3" />
                <p className="text-sm text-ink/30 font-body">
                  Selecciona un contacto para ver la conversacion
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  Pencil, Send, Bot, Loader2, ChevronDown, MessageSquare, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const agents = [
  { id: "DIOS", name: "DIOS", role: "Orquestador", icon: Sparkles, color: "#FFFFFF" },
  { id: "SAGE", name: "Sage", role: "Estrategia", icon: Compass, color: "#D97706" },
  { id: "NOVA", name: "Nova", role: "Branding", icon: Sparkles, color: "#B54E30" },
  { id: "ATLAS", name: "Atlas", role: "SEO", icon: Globe, color: "#2563EB" },
  { id: "NEXUS", name: "Nexus", role: "Growth", icon: TrendingUp, color: "#EA580C" },
  { id: "PIXEL", name: "Pixel", role: "Frontend", icon: Layout, color: "#283B70" },
  { id: "CORE", name: "Core", role: "Backend", icon: Terminal, color: "#16A34A" },
  { id: "PULSE", name: "Pulse", role: "Social Media", icon: Heart, color: "#EC4899" },
  { id: "COPY", name: "Copy", role: "Copywriting", icon: Pencil, color: "#F59E0B" },
  { id: "LENS", name: "Lens", role: "Analytics", icon: Bot, color: "#8B5CF6" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  timestamp: Date;
}

interface ConversationRow {
  id: string;
  metadata: {
    type?: string;
    agent_id?: string;
    title?: string;
    messages?: Array<{ role: string; content: string; agent?: string; ts?: string }>;
  };
  created_at: string;
}

export default function ChatPage() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load agent chat conversations
  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, metadata, created_at")
      .eq("channel", "web_chat")
      .filter("metadata->>type", "eq", "agent_chat")
      .order("created_at", { ascending: false })
      .limit(50);
    setConversations((data as ConversationRow[]) || []);
    setLoadingConversations(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages from a conversation's metadata
  function loadConversation(conv: ConversationRow) {
    setActiveConversationId(conv.id);
    const agentId = conv.metadata?.agent_id;
    const agent = agents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);

    const storedMsgs = conv.metadata?.messages || [];
    setMessages(
      storedMsgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        agent: m.agent,
        timestamp: m.ts ? new Date(m.ts) : new Date(conv.created_at),
      }))
    );
  }

  function newConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    await dbCall({ table: "conversations", op: "delete", filter: { column: "id", value: convId } });
    if (activeConversationId === convId) {
      newConversation();
    }
    fetchConversations();
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: selectedAgent.id,
          message: text,
          history,
          conversation_id: activeConversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error || "Error desconocido"}`, agent: selectedAgent.id, timestamp: new Date() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, agent: selectedAgent.id, timestamp: new Date() },
        ]);
        if (data.conversation_id && !activeConversationId) {
          setActiveConversationId(data.conversation_id);
        }
        fetchConversations();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexion. Verifica que el servidor esta activo.", agent: selectedAgent.id, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  const AgentIcon = selectedAgent.icon;

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden">
        <div className="p-3 border-b border-ink/[0.06]">
          <button
            onClick={newConversation}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-body font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva conversacion
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-ink/30" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-6 h-6 text-ink/15 mx-auto mb-2" />
              <p className="text-xs text-ink/30 font-body">Sin conversaciones</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const agentId = conv.metadata?.agent_id;
              const agent = agents.find((a) => a.id === agentId);
              const title = conv.metadata?.title || "Chat sin titulo";
              const msgCount = conv.metadata?.messages?.length || 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={`group flex items-start gap-2 w-full px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive ? "bg-white/[0.08] border border-ink/[0.1]" : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${agent?.color || "#666"}20` }}
                  >
                    <MessageSquare className="w-3 h-3" style={{ color: agent?.color || "#666" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ink/80 font-body truncate">{title}</div>
                    <div className="text-[10px] text-ink/30 font-body mt-0.5">
                      {agent?.name || agentId} · {msgCount} msgs
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3 text-red-400/60" />
                  </button>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading font-bold text-2xl text-ink">Chat con Agentes</h1>
            <p className="text-sm text-ink/40 font-body mt-1">
              Conversa directamente con el equipo PACAME
            </p>
          </div>
        </div>

        {/* Agent selector */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowAgentPicker(!showAgentPicker)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 transition-all w-full"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedAgent.color}20` }}>
              <AgentIcon className="w-4 h-4" style={{ color: selectedAgent.color }} />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-heading font-semibold" style={{ color: selectedAgent.color }}>{selectedAgent.name}</div>
              <div className="text-xs text-ink/40 font-body">{selectedAgent.role}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-ink/30 transition-transform ${showAgentPicker ? "rotate-180" : ""}`} />
          </button>

          {showAgentPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-paper-deep border border-ink/[0.08] shadow-2xl z-20 overflow-hidden">
              {agents.map((agent) => {
                const Icon = agent.icon;
                const isSelected = agent.id === selectedAgent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => { setSelectedAgent(agent); setShowAgentPicker(false); }}
                    className={`flex items-center gap-3 px-4 py-2.5 w-full hover:bg-white/[0.04] transition-colors ${isSelected ? "bg-white/[0.06]" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-heading font-medium" style={{ color: agent.color }}>{agent.name}</span>
                      <span className="text-xs text-ink/40 font-body ml-2">{agent.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-paper-deep border border-ink/[0.06] p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${selectedAgent.color}15` }}>
                <AgentIcon className="w-8 h-8" style={{ color: selectedAgent.color }} />
              </div>
              <h3 className="font-heading font-semibold text-ink mb-1">{selectedAgent.name}</h3>
              <p className="text-sm text-ink/40 font-body max-w-md">
                {selectedAgent.id === "DIOS"
                  ? "Soy el orquestador del sistema. Preguntame cualquier cosa y coordinare al equipo adecuado."
                  : `Soy ${selectedAgent.name}, especialista en ${selectedAgent.role.toLowerCase()}. Cuentame, ¿que necesitas?`}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const msgAgent = !isUser ? agents.find((a) => a.id === msg.agent) || selectedAgent : null;

            return (
              <div key={i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && msgAgent && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: `${msgAgent.color}20` }}>
                    <Bot className="w-3.5 h-3.5" style={{ color: msgAgent.color }} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? "bg-brand-primary/20 border border-brand-primary/30"
                      : "bg-white/[0.04] border border-ink/[0.06]"
                  }`}
                >
                  {!isUser && msgAgent && (
                    <div className="text-[10px] font-heading font-semibold mb-1" style={{ color: msgAgent.color }}>
                      {msgAgent.name}
                    </div>
                  )}
                  <p className="text-sm text-ink/80 font-body whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <div className="text-[10px] text-ink/20 font-body mt-1.5">
                    {msg.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${selectedAgent.color}20` }}>
                <Bot className="w-3.5 h-3.5" style={{ color: selectedAgent.color }} />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-ink/[0.06]">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: selectedAgent.color }} />
                  <span className="text-xs text-ink/40 font-body">{selectedAgent.name} esta pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="mt-4 flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Escribe a ${selectedAgent.name}...`}
              rows={1}
              className="w-full px-4 py-3 rounded-xl bg-paper-deep border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none resize-none"
            />
          </div>
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={loading || !input.trim()}
            className="h-[46px] px-5 gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

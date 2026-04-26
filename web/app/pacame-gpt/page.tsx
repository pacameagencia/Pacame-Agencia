/**
 * /pacame-gpt — Pantalla principal de PACAME GPT (Lucía).
 *
 * Modos:
 *   - Anónimo: storage local (localStorage), rate limit por IP.
 *   - Autenticado: storage Supabase, rate limit por user (20 msg/día free,
 *     ilimitado trial/premium), tabla pacame_gpt_daily_usage.
 *
 * El switch es transparente para el usuario: useAuth() hace una llamada inicial
 * a /api/pacame-gpt/me y a partir de su resultado todo lo demás se ajusta.
 *
 * Plan completo: .claude/plans/piensa-como-seria-un-tranquil-cerf.md
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@/lib/lucia/useChat";
import { useAuth } from "@/lib/lucia/useAuth";
import { useConversationsList } from "@/lib/lucia/useConversationsList";
import {
  deleteConversation as localDelete,
} from "@/lib/lucia/storage";
import type { ChatMessage, Conversation } from "@/lib/lucia/types";
import "./pacame-gpt.css";

const TASKS = [
  { emoji: "✉️", title: "Escríbeme un email", sub: "Formal o cercano, tú eliges", prompt: "Tengo que escribir un email a {¿a quién?} sobre {¿de qué?}. Tono {formal/cercano}. ¿Me lo redactas?" },
  { emoji: "💬", title: "Redacta un WhatsApp", sub: "Para que no suene raro", prompt: "Necesito mandar un WhatsApp a {¿a quién?} para decirle {¿qué?}. Que suene natural." },
  { emoji: "📄", title: "Resumir un texto", sub: "En 3 puntos, sin paja", prompt: "Resúmeme esto en 3 viñetas:\n\n{pega aquí tu texto}" },
  { emoji: "🌍", title: "Traducir esto", sub: "Manteniendo el tono", prompt: "Tradúceme al {idioma}: {tu frase}. Que mantenga el tono original." },
];

export default function PacameGPTPage() {
  const { me, refresh: refreshAuth } = useAuth();
  const authenticated = !!me?.user;

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const { convs, refresh: refreshConvs } = useConversationsList(authenticated);

  const { messages, sending, send, conversationId } = useChat({
    conversationId: activeConvId,
    authenticated,
    onConversationCreated: (id) => {
      setActiveConvId(id);
      refreshConvs();
    },
    onLimitReached: ({ upgradeUrl }) => {
      setLimitNotice(
        `Has llegado a los 20 mensajes gratis de hoy. Pásate a Premium en ${upgradeUrl} para seguir.`
      );
    },
  });

  // Mantener sincronizado activeConvId cuando useChat lo crea solo (modo auth).
  useEffect(() => {
    if (conversationId && conversationId !== activeConvId) {
      setActiveConvId(conversationId);
      refreshConvs();
    }
  }, [conversationId, activeConvId, refreshConvs]);

  // Refresh conversations + auth (para actualizar contador) cuando termina envío.
  useEffect(() => {
    if (!sending) {
      refreshConvs();
      if (authenticated) refreshAuth();
    }
  }, [sending, authenticated, refreshConvs, refreshAuth]);

  // Auto-scroll al final cuando llega un mensaje nuevo o stream actualiza.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea hasta 200px.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  function handleSubmit() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setLimitNotice(null);
    send(text);
    setSidebarOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleNewConversation() {
    setActiveConvId(null);
    setInput("");
    setLimitNotice(null);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  async function handleDelete(id: string) {
    if (authenticated) {
      await fetch(`/api/pacame-gpt/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } else {
      localDelete(id);
    }
    if (activeConvId === id) setActiveConvId(null);
    refreshConvs();
  }

  function handleTask(task: (typeof TASKS)[number]) {
    setInput(task.prompt);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const match = task.prompt.match(/\{[^}]+\}/);
      if (match && typeof match.index === "number") {
        ta.setSelectionRange(match.index, match.index + match[0].length);
      }
    });
  }

  const isHome = messages.length === 0 && !sending;
  const grouped = useMemo(() => groupByDate(convs), [convs]);

  // Etiqueta del plan en el sidebar.
  const planLabel = (() => {
    if (!me) return "Sin cuenta";
    if (me.subscription?.active) {
      return me.subscription.status === "trialing"
        ? `Trial · ${me.subscription.days_left_in_trial}d`
        : "Premium";
    }
    return `${me.dailyUsed}/${me.limit}`;
  })();

  // Estado en línea para la cabecera (nombre del avatar grande).
  const headerStatus = sending ? "escribiendo…" : "en línea";

  return (
    <main className="pg" id="main-content">
      {/* Sidebar */}
      <aside className={`pg-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="pg-sidebar-top">
          <LuciaAvatar size="md" />
          <div className="pg-sidebar-brand">
            <span>PACAME GPT</span>
            <small>con Lucía</small>
          </div>
        </div>

        <button className="pg-new-btn" onClick={handleNewConversation}>
          <PlusIcon /> Nueva conversación
        </button>

        <div className="pg-conv-list">
          {convs.length === 0 ? (
            <p style={{ color: "#6e6858", fontSize: 13, padding: "16px 12px" }}>
              {authenticated
                ? "Aún no tienes conversaciones. Empieza por escribir algo abajo."
                : "Estás como invitado. Tus conversaciones se guardan en este móvil. Crea cuenta para sincronizarlas."}
            </p>
          ) : (
            grouped.map(([label, list]) => (
              <div key={label}>
                <div className="pg-conv-group">{label}</div>
                {list.map((c) => (
                  <ConvItem
                    key={c.id}
                    conv={c}
                    active={c.id === activeConvId}
                    onClick={() => {
                      setActiveConvId(c.id);
                      setSidebarOpen(false);
                    }}
                    onDelete={() => handleDelete(c.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <SidebarFooter
          authenticated={authenticated}
          email={me?.user.email}
          planLabel={planLabel}
        />
      </aside>

      {sidebarOpen && (
        <div
          className="pg-sidebar-overlay is-visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <section className="pg-main">
        <header className="pg-header">
          <button
            className="pg-burger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <BurgerIcon />
          </button>
          <LuciaAvatar size="md" typing={sending} />
          <div className="pg-header-info">
            <span className="pg-header-name">Lucía</span>
            <span className="pg-header-status">
              <span className="pg-status-dot" /> {headerStatus}
            </span>
          </div>
          <div className="pg-header-spacer" />
          <HeaderPlanPill me={me} />
        </header>

        {limitNotice && (
          <div
            style={{
              margin: "12px 18px 0",
              padding: "12px 16px",
              background: "rgba(232,183,48,0.18)",
              border: "1px solid rgba(232,183,48,0.4)",
              borderRadius: 12,
              color: "#7a2e18",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>{limitNotice}</span>
            <Link
              href="/pacame-gpt/cuenta"
              style={{
                background: "#1a1813",
                color: "#f4efe3",
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Ver Premium
            </Link>
          </div>
        )}

        {isHome ? (
          <div className="pg-home">
            <LuciaAvatar size="lg" />
            <div className="pg-home-greeting">
              <h1>Hola, soy Lucía. ¿Qué hacemos?</h1>
              <p>
                Te ayudo con emails, WhatsApps, traducciones, resúmenes, ideas, lo
                que necesites. En español de calle, sin liarte.
              </p>
            </div>
            <div className="pg-tasks">
              {TASKS.map((t) => (
                <button key={t.title} className="pg-task" onClick={() => handleTask(t)}>
                  <span className="pg-task-title">
                    <span className="pg-task-emoji">{t.emoji}</span>
                    {t.title}
                  </span>
                  <span className="pg-task-sub">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pg-thread" ref={threadRef}>
            <div className="pg-thread-inner">
              {messages.map((m) => (
                <MessageRow key={m.id} msg={m} />
              ))}
              {sending && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="pg-row">
                  <LuciaAvatar size="sm" typing />
                  <div className="pg-typing" aria-label="Lucía está escribiendo">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pg-input-area">
          <div className="pg-input-wrap">
            <textarea
              ref={textareaRef}
              className="pg-textarea"
              placeholder="Pregúntame lo que sea…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={sending}
            />
            <button
              className="pg-send"
              onClick={handleSubmit}
              disabled={!input.trim() || sending}
              aria-label="Enviar"
            >
              <SendIcon />
            </button>
          </div>
          <p className="pg-input-foot">
            Lucía es una IA. Pablo la supervisa.{" "}
            {authenticated
              ? "Tu conversación se guarda en tu cuenta."
              : "Como invitado, tu conversación se guarda solo en este móvil."}
          </p>
        </div>
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                         Subcomponents                       */
/* ─────────────────────────────────────────────────────────── */

function MessageRow({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`pg-row ${isUser ? "pg-row-user" : ""}`}>
      {!isUser && <LuciaAvatar size="sm" typing={!!msg.pending && msg.content.length === 0} />}
      <div className={`pg-bubble ${isUser ? "is-user" : "is-bot"}`}>
        {msg.pending && msg.content.length === 0 ? (
          <span className="pg-typing-inline" aria-label="Lucía está escribiendo">
            <span /><span /><span />
          </span>
        ) : (
          <>{msg.content}</>
        )}
        <div className="pg-meta">
          {new Date(msg.ts).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function ConvItem({
  conv,
  active,
  onClick,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      className={`pg-conv-item ${active ? "is-active" : ""}`}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (confirm(`¿Borrar "${conv.title}"?`)) onDelete();
      }}
      title="Click para abrir · clic derecho para borrar"
    >
      {conv.title}
    </button>
  );
}

function SidebarFooter({
  authenticated,
  email,
  planLabel,
}: {
  authenticated: boolean;
  email?: string;
  planLabel: string;
}) {
  if (!authenticated) {
    return (
      <Link
        href="/pacame-gpt/login"
        className="pg-sidebar-foot"
        style={{ textDecoration: "none", color: "#1a1813" }}
      >
        <span style={{ flex: 1, fontWeight: 600 }}>Iniciar sesión</span>
        <span style={{ fontSize: 11, color: "#9b7714" }}>14 días gratis</span>
      </Link>
    );
  }
  return (
    <Link
      href="/pacame-gpt/cuenta"
      className="pg-sidebar-foot"
      style={{ textDecoration: "none", color: "#1a1813" }}
      title={email}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {email}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#9b7714" }}>{planLabel}</span>
    </Link>
  );
}

function HeaderPlanPill({ me }: { me: ReturnType<typeof useAuth>["me"] }) {
  if (!me) {
    return (
      <Link
        href="/pacame-gpt/login"
        className="pg-plan-pill"
        style={{ textDecoration: "none" }}
      >
        Iniciar sesión
      </Link>
    );
  }
  if (me.subscription?.active && me.subscription.status === "active") {
    return <span className="pg-plan-pill" style={{ background: "rgba(107,117,53,0.18)", color: "#555f28" }}>Premium</span>;
  }
  if (me.subscription?.active && me.subscription.status === "trialing") {
    return <span className="pg-plan-pill">Trial · {me.subscription.days_left_in_trial}d</span>;
  }
  return <Link href="/pacame-gpt/cuenta" className="pg-plan-pill" style={{ textDecoration: "none" }}>Gratis</Link>;
}

/**
 * Avatar de Lucía con fallback automático:
 *   - Si /asistente/lucia.png existe (Pablo lo cargó), lo muestra.
 *   - Si no, renderiza monograma "L" sobre gradiente terracota → mostaza.
 */
function LuciaAvatar({
  size = "md",
  typing = false,
}: {
  size?: "sm" | "md" | "lg";
  typing?: boolean;
}) {
  const [imgOk, setImgOk] = useState(true);
  const cls = `pg-av ${size === "sm" ? "sm" : size === "lg" ? "lg" : ""} ${typing ? "is-typing" : ""}`;
  return (
    <div className={cls} aria-label="Lucía">
      {imgOk ? (
        <img
          src="/asistente/lucia.png"
          alt=""
          onError={() => setImgOk(false)}
          loading="eager"
        />
      ) : (
        <span>L</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                            Icons                            */
/* ─────────────────────────────────────────────────────────── */

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                          Helpers                            */
/* ─────────────────────────────────────────────────────────── */

function groupByDate(convs: Conversation[]): [string, Conversation[]][] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const groups: Record<string, Conversation[]> = {
    Hoy: [],
    Ayer: [],
    "Esta semana": [],
    Anteriores: [],
  };
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  for (const c of convs) {
    const age = now - c.updatedAt;
    if (c.updatedAt >= todayMs) groups["Hoy"].push(c);
    else if (c.updatedAt >= todayMs - day) groups["Ayer"].push(c);
    else if (age < 7 * day) groups["Esta semana"].push(c);
    else groups["Anteriores"].push(c);
  }
  return Object.entries(groups).filter(([, list]) => list.length > 0);
}

/**
 * useChat — hook React para PACAME GPT (Lucía).
 *
 * Dos modos transparentes para el caller:
 *   - Anónimo (sin cookie de sesión): conversaciones en localStorage.
 *   - Autenticado: conversaciones en Supabase, sincronizadas vía API.
 *
 * El hook decide solo qué backend usa según la prop `authenticated`. El front
 * pasa `useAuth().me?.user` para saberlo.
 *
 * API pública estable (no cambiar entre Sprint 2 y Sprint 3):
 *   { messages, sending, error, send, stop, conversationId }
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendMessage as localAppend,
  createConversation as localCreate,
  getConversation as localGet,
} from "./storage";
import type { ChatMessage, Conversation } from "./types";

interface UseChatOptions {
  conversationId?: string | null;
  /** Si true, usamos backend Supabase. Si false/omitido, localStorage. */
  authenticated?: boolean;
  onConversationCreated?: (id: string) => void;
  /** Llamado cuando el endpoint nos dice que el user agotó la cuota diaria. */
  onLimitReached?: (info: { upgradeUrl: string; resetIn?: string }) => void;
}

export function useChat({
  conversationId,
  authenticated,
  onConversationCreated,
  onLimitReached,
}: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId || null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cargar conversación cuando cambia el id o el modo de auth.
  useEffect(() => {
    setActiveConvId(conversationId || null);
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (authenticated) {
      // Cargar de Supabase
      let cancelled = false;
      fetch(`/api/pacame-gpt/conversations/${conversationId}`, {
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !json?.ok) {
            if (!cancelled) setMessages([]);
            return;
          }
          const msgs: ChatMessage[] = (json.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            ts: new Date(m.created_at).getTime(),
          }));
          setMessages(msgs);
        })
        .catch(() => !cancelled && setMessages([]));
      return () => {
        cancelled = true;
      };
    }

    // localStorage
    const c = localGet(conversationId);
    setMessages(c ? c.messages : []);
  }, [conversationId, authenticated]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setError(null);
      setSending(true);

      // 1) Asegurar que existe una conversación local (solo modo anónimo).
      let convIdLocal = activeConvId;
      let isNewLocal = false;
      if (!authenticated && !convIdLocal) {
        const created = localCreate(trimmed);
        convIdLocal = created.id;
        isNewLocal = true;
      }

      // 2) Optimistic UI: pintar user message + placeholder assistant.
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        ts: Date.now(),
      };
      const assistantId = crypto.randomUUID();
      const placeholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        ts: Date.now(),
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, placeholder]);

      if (!authenticated && convIdLocal) {
        localAppend(convIdLocal, "user", trimmed);
      }

      // 3) Construir mensajes a enviar al backend.
      const baseHistory = (() => {
        if (authenticated) {
          // Reutilizamos los messages que ya tenemos en estado.
          return [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        }
        const c = convIdLocal ? localGet(convIdLocal) : null;
        return (c?.messages || []).map((m) => ({ role: m.role, content: m.content }));
      })();

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch("/api/pacame-gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            messages: baseHistory,
            conversationId: authenticated ? activeConvId : undefined,
          }),
          signal: ac.signal,
        });

        if (res.status === 402) {
          // Límite diario alcanzado.
          const json = await res.json().catch(() => ({} as any));
          placeholder.content =
            json.reply ||
            "Has llegado al límite gratis de hoy. Pásate a Premium para seguir hablando conmigo.";
          placeholder.pending = false;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...placeholder } : m))
          );
          if (onLimitReached) {
            onLimitReached({
              upgradeUrl: json.upgradeUrl || "/pacame-gpt/cuenta",
              resetIn: json.resetIn,
            });
          }
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (ct.includes("text/event-stream") && res.body) {
          await consumeStream(
            res.body,
            (delta) => {
              placeholder.content += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...placeholder } : m))
              );
            },
            (meta) => {
              if (
                authenticated &&
                meta.conversationId &&
                meta.conversationId !== activeConvId
              ) {
                // El backend creó una conversación nueva por nosotros.
                setActiveConvId(meta.conversationId);
                if (onConversationCreated) onConversationCreated(meta.conversationId);
              }
            }
          );
          placeholder.pending = false;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...placeholder } : m))
          );
          // Persistencia local solo si modo anónimo (en modo auth lo guarda el server).
          if (!authenticated && convIdLocal) {
            localAppend(convIdLocal, "assistant", placeholder.content);
          }
        } else {
          // Modo non-streaming JSON.
          const json = await res.json();
          const reply: string =
            json.reply || "Disculpa, no te he entendido. ¿Me lo repites?";
          placeholder.content = reply;
          placeholder.pending = false;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...placeholder } : m))
          );
          if (authenticated && json.conversationId && json.conversationId !== activeConvId) {
            setActiveConvId(json.conversationId);
            if (onConversationCreated) onConversationCreated(json.conversationId);
          }
          if (!authenticated && convIdLocal) {
            localAppend(convIdLocal, "assistant", reply);
          }
        }

        if (!authenticated && isNewLocal && convIdLocal && onConversationCreated) {
          onConversationCreated(convIdLocal);
        }
      } catch (err) {
        if (ac.signal.aborted) return;
        setError("No he podido conectar. Inténtalo de nuevo en un momento.");
        placeholder.content =
          "Vaya, ahora mismo no te puedo responder. Inténtalo otra vez en un momento.";
        placeholder.pending = false;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...placeholder } : m))
        );
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [activeConvId, authenticated, messages, sending, onConversationCreated, onLimitReached]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setSending(false);
  }, []);

  return {
    messages,
    sending,
    error,
    send,
    stop,
    conversationId: activeConvId,
  };
}

/**
 * Consume el SSE simplificado del endpoint /api/pacame-gpt.
 * Eventos:
 *   meta  → contexto inicial (conversationId, tier, remaining)
 *   text  → delta de texto a concatenar
 *   drift → reemplazo (canned ES) cuando el modelo se va al inglés
 *   done  → fin
 *   error → algo falló
 */
async function consumeStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: string) => void,
  onMeta: (meta: { conversationId: string | null; tier: string; remaining: number | null }) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const json = dataLine.slice(6).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json) as {
          type: string;
          delta?: string;
          fullText?: string;
          message?: string;
          replacement?: string;
          conversationId?: string | null;
          tier?: string;
          remaining?: number | null;
        };
        if (evt.type === "meta") {
          onMeta({
            conversationId: evt.conversationId ?? null,
            tier: evt.tier ?? "anonymous",
            remaining: evt.remaining ?? null,
          });
        } else if (evt.type === "text" && typeof evt.delta === "string") {
          onDelta(evt.delta);
        } else if (evt.type === "drift" && typeof evt.replacement === "string") {
          onDelta("\n\n" + evt.replacement);
        } else if (evt.type === "done") {
          return;
        } else if (evt.type === "error") {
          throw new Error(evt.message || "stream_error");
        }
      } catch {
        /* línea malformada → seguir */
      }
    }
  }
}

// Reexport para compatibilidad con imports antiguos (storage helpers).
export type { Conversation };

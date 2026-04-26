/**
 * Persistencia local de conversaciones de PACAME GPT.
 *
 * Sprint 2 vive en localStorage del navegador. Sprint 3 se sustituye por
 * Supabase + auth. La API pública de este módulo no debe cambiar al hacer
 * esa migración: las páginas/componentes seguirán llamando a las mismas
 * funciones, solo cambiará la implementación interna.
 *
 * Clave única: PACAME_GPT_CONVS_V1. El sufijo _V1 nos permite hacer breaking
 * changes en el formato más adelante con un migrador.
 */

import type { Conversation, ChatMessage, Role } from "./types";

const KEY = "PACAME_GPT_CONVS_V1";

function readAll(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Conversation[];
  } catch {
    return [];
  }
}

function writeAll(convs: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(convs));
  } catch {
    // localStorage lleno → ignorar silenciosamente. En Sprint 3 va a DB.
  }
}

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | null {
  return readAll().find((c) => c.id === id) || null;
}

export function createConversation(firstUserText: string): Conversation {
  const conv: Conversation = {
    id: crypto.randomUUID(),
    title: deriveTitle(firstUserText),
    updatedAt: Date.now(),
    messages: [],
  };
  const all = readAll();
  all.push(conv);
  writeAll(all);
  return conv;
}

export function appendMessage(
  conversationId: string,
  role: Role,
  content: string
): ChatMessage {
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    role,
    content,
    ts: Date.now(),
  };
  const all = readAll();
  const conv = all.find((c) => c.id === conversationId);
  if (!conv) return msg;
  conv.messages.push(msg);
  conv.updatedAt = msg.ts;
  // Si seguía con título "Conversación nueva" y este es el 1er user → re-titular.
  if (conv.title === "Conversación nueva" && role === "user") {
    conv.title = deriveTitle(content);
  }
  writeAll(all);
  return msg;
}

export function updateMessage(
  conversationId: string,
  messageId: string,
  newContent: string
) {
  const all = readAll();
  const conv = all.find((c) => c.id === conversationId);
  if (!conv) return;
  const m = conv.messages.find((x) => x.id === messageId);
  if (!m) return;
  m.content = newContent;
  conv.updatedAt = Date.now();
  writeAll(all);
}

export function deleteConversation(id: string) {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function clearAll() {
  writeAll([]);
}

/**
 * Crea un título corto (máx 48 chars) a partir de la 1ª frase del usuario.
 * Si no hay nada decente, devuelve "Conversación nueva".
 */
function deriveTitle(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length === 0) return "Conversación nueva";
  // Cortar por primera puntuación o por 48 chars.
  const m = cleaned.match(/^([^.!?¿¡\n]{4,48})/);
  const candidate = m ? m[1] : cleaned.slice(0, 48);
  return candidate.length > 0 ? candidate : "Conversación nueva";
}

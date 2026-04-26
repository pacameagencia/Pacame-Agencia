/**
 * Tipos compartidos del producto PACAME GPT (Lucía).
 * Se usan en el front (UI) y libs auxiliares (storage, useChat).
 */

export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** ms epoch */
  ts: number;
  /** Si la asistente está en streaming, el último delta no terminado. */
  pending?: boolean;
}

export interface Conversation {
  id: string;
  /** Título corto autogenerado del primer mensaje. */
  title: string;
  /** ms epoch del último mensaje, para ordenar. */
  updatedAt: number;
  messages: ChatMessage[];
}

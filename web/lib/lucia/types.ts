/**
 * Tipos compartidos del producto PACAME GPT (Lucía).
 * Se usan en el front (UI) y libs auxiliares (storage, useChat).
 */

export type Role = "user" | "assistant";

export interface ChatMessage {
  /** Id local inmutable (React key). Generado en cliente. */
  id: string;
  /** Id real en pacame_gpt_messages cuando el server persistió. Necesario
   *  para acciones (PDF, email, recordatorio) que referencian el mensaje. */
  serverId?: string;
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

/**
 * Helper cliente para migrar conversaciones de localStorage a Supabase tras
 * un login/signup fresco. Llamar en la página /pacame-gpt/login después de
 * recibir 200 OK y ANTES de hacer router.push().
 *
 * No bloquea: si el endpoint falla, devolvemos sin error y dejamos
 * localStorage tal cual (las convs siguen visibles en modo invitado si el
 * user vuelve a cerrar sesión).
 *
 * Tras un import exitoso, limpiamos localStorage para que no salga
 * duplicado en sesiones futuras.
 */

import { listConversations, clearAll } from "./storage";

export async function migrateLocalConversationsIfAny(): Promise<{
  attempted: number;
  imported: number;
}> {
  if (typeof window === "undefined") return { attempted: 0, imported: 0 };
  const local = listConversations();
  if (local.length === 0) return { attempted: 0, imported: 0 };

  // Compactar al formato del endpoint.
  const payload = {
    conversations: local.map((c) => ({
      title: c.title,
      messages: c.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ts: m.ts,
      })),
    })),
  };

  try {
    const res = await fetch("/api/pacame-gpt/conversations/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { attempted: local.length, imported: 0 };
    const json = await res.json();
    if (json.ok && (json.imported ?? 0) > 0) {
      // Solo limpiamos si al menos 1 conv se importó OK; si todas fallaron,
      // dejamos localStorage para no perder datos.
      clearAll();
    }
    return { attempted: local.length, imported: json.imported ?? 0 };
  } catch {
    return { attempted: local.length, imported: 0 };
  }
}

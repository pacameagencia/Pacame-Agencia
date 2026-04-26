/**
 * useConversationsList — lista de conversaciones del sidebar.
 *
 * Backend según `authenticated`:
 *   - true  → /api/pacame-gpt/conversations (Supabase)
 *   - false → localStorage
 *
 * Expone refresh() para que el caller force recarga después de un send().
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { listConversations as listLocal } from "./storage";
import type { Conversation } from "./types";

export function useConversationsList(authenticated: boolean) {
  const [convs, setConvs] = useState<Conversation[]>([]);

  const refresh = useCallback(async () => {
    if (authenticated) {
      try {
        const res = await fetch("/api/pacame-gpt/conversations", {
          credentials: "include",
        });
        if (!res.ok) {
          setConvs([]);
          return;
        }
        const json = await res.json();
        const list: Conversation[] = (json.conversations || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          updatedAt: new Date(c.updated_at).getTime(),
          messages: [], // se cargan al abrir cada conversación
        }));
        setConvs(list);
      } catch {
        setConvs([]);
      }
      return;
    }
    setConvs(listLocal());
  }, [authenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { convs, refresh };
}

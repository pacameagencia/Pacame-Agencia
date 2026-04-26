/**
 * useAuth — hook ligero de cliente para PACAME GPT.
 *
 * Llama una sola vez a /api/pacame-gpt/me al montar (y cuando se invoca refresh()).
 * Devuelve user/sub/usage o null si anónimo (401).
 *
 * No usa SWR ni react-query a propósito: el estado es simple, una llamada al
 * inicio + refresh manual cuando hace falta (post-login, post-checkout, etc.).
 */

"use client";

import { useCallback, useEffect, useState } from "react";

export interface LuciaSubscription {
  id: string;
  tier: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  trial_ends_at: string | null;
  days_left_in_trial: number | null;
  active: boolean;
}

export interface LuciaMe {
  user: { id: string; email: string; full_name: string | null };
  subscription: LuciaSubscription | null;
  dailyUsed: number;
  limit: number; // -1 = ilimitado
  remaining: number; // -1 = ilimitado
}

interface UseAuthState {
  me: LuciaMe | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthState {
  const [me, setMe] = useState<LuciaMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/pacame-gpt/me", { credentials: "include" });
      if (res.status === 401) {
        setMe(null);
        return;
      }
      if (!res.ok) {
        setMe(null);
        return;
      }
      const json = await res.json();
      if (json.ok) setMe(json as LuciaMe);
      else setMe(null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { me, loading, refresh };
}

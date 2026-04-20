"use client";

import { useEffect } from "react";

/**
 * Cliente-side setter: si la URL trae ?ref=CODE, lo guarda en cookie
 * `pacame_ref` 30 dias. El checkout puede leerlo con getReferralCode() para
 * enviarlo como metadata a Stripe. No bloquea renderizado.
 */
export default function ReferralCookieTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (!ref) return;
      const clean = ref.trim().toUpperCase().slice(0, 32);
      if (!/^[A-Z0-9_-]{3,32}$/.test(clean)) return;
      // Guardar cookie 30 dias
      const d = new Date();
      d.setDate(d.getDate() + 30);
      document.cookie = `pacame_ref=${encodeURIComponent(
        clean
      )}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);
  return null;
}

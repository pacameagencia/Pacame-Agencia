/**
 * Capturador de ?ref=CODE para PACAME GPT.
 *
 * Se monta en /lucia y subpáginas. Al cargar, lee `?ref=CODE` y guarda
 * la cookie `pgpt_ref` 60 días. La cookie se lee server-side en el endpoint
 * de signup-trial para atribuir el referrer.
 */

"use client";

import { useEffect } from "react";

const COOKIE = "pgpt_ref";
const DAYS = 60;

export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (!ref) return;
      // Validar formato (7 chars base32 sin 0/1/I/O).
      if (!/^[2-9A-HJ-NP-Z]{7}$/i.test(ref)) return;
      const expires = new Date(Date.now() + DAYS * 24 * 3600 * 1000).toUTCString();
      document.cookie = `${COOKIE}=${ref.toUpperCase()}; Path=/; Expires=${expires}; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);
  return null;
}

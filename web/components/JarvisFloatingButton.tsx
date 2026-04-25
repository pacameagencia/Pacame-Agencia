/**
 * Botón flotante para abrir Jarvis desde cualquier página.
 *
 * Visible bottom-right, con burbuja invitando a hablar la primera visita.
 * Click → navega a /companero (página dedicada full screen).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const HINT_KEY = "pacame_jarvis_hint_seen";

export default function JarvisFloatingButton() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const seen = typeof window !== "undefined" ? window.localStorage.getItem(HINT_KEY) : "1";
    if (!seen) {
      const t = setTimeout(() => setShowHint(true), 2500);
      const t2 = setTimeout(() => {
        setShowHint(false);
        window.localStorage.setItem(HINT_KEY, "1");
      }, 12000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, []);

  return (
    <div className="jarvis-fab">
      {showHint && (
        <div className="jarvis-fab-hint">
          <strong>¡Hola! Soy Jarvis</strong>
          <span>Te ayudo con tu negocio. Tócame.</span>
          <button className="jarvis-fab-hint-close" onClick={() => setShowHint(false)} aria-label="Cerrar">×</button>
        </div>
      )}
      <Link href="/companero" className="jarvis-fab-btn" aria-label="Abrir Jarvis, asistente IA">
        <span className="jarvis-fab-pulse" />
        <span className="jarvis-fab-pulse jarvis-fab-pulse-2" />
        <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden>
          <defs>
            <radialGradient id="fab-grad" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </radialGradient>
          </defs>
          {/* Cara mini-Jarvis */}
          <circle cx="32" cy="32" r="24" fill="url(#fab-grad)" />
          <circle cx="24" cy="28" r="3.5" fill="#0c4a6e" />
          <circle cx="40" cy="28" r="3.5" fill="#0c4a6e" />
          <circle cx="22.5" cy="26.8" r="1.2" fill="#fff" opacity="0.95" />
          <circle cx="38.5" cy="26.8" r="1.2" fill="#fff" opacity="0.95" />
          <path d="M 24,40 Q 32,46 40,40" fill="none" stroke="#0c4a6e" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="20" cy="36" rx="3" ry="1.8" fill="#fb7185" opacity="0.5" />
          <ellipse cx="44" cy="36" rx="3" ry="1.8" fill="#fb7185" opacity="0.5" />
        </svg>
        <span className="jarvis-fab-label">Habla con Jarvis</span>
      </Link>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function TrialCTA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/darkroom/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? `Error ${res.status}`);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
      setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: "#CFFF00",
          color: "#0A0A0A",
          padding: "16px 40px",
          border: 0,
          borderRadius: 4,
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 0.5,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "'Space Grotesk', sans-serif",
          textTransform: "uppercase",
        }}
      >
        {loading ? "Cargando…" : "Empezar prueba · 2 días"}
      </button>
      {error && (
        <p style={{ color: "#FF3B3B", marginTop: 12, fontSize: 13 }}>
          {error}
        </p>
      )}
    </div>
  );
}

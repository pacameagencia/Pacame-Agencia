"use client";

import { useState } from "react";

export default function CopyRefLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://darkroomcreative.cloud?ref=${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #CFFF00",
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 240px", minWidth: 240 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#888",
            marginBottom: 6,
          }}
        >
          Tu link para compartir
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: "#CFFF00",
            wordBreak: "break-all",
          }}
        >
          {url}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          background: copied ? "#CFFF00" : "transparent",
          color: copied ? "#0A0A0A" : "#CFFF00",
          border: "1px solid #CFFF00",
          padding: "10px 20px",
          borderRadius: 4,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 1,
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {copied ? "✓ Copiado" : "Copiar link"}
      </button>
    </div>
  );
}

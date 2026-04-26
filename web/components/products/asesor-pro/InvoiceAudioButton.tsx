"use client";

import { useRef, useState } from "react";
import { Volume2, Loader2, Pause } from "lucide-react";

export function InvoiceAudioButton({ invoiceId }: { invoiceId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const url = `/api/products/asesor-pro/invoices/${invoiceId}/audio`;

  async function play() {
    if (state === "playing") {
      audioRef.current?.pause();
      audioRef.current = null;
      setState("idle");
      return;
    }
    setState("loading");
    const audio = new Audio(url);
    audio.onended = () => setState("idle");
    audio.onpause = () => {
      if (audio.currentTime < audio.duration) setState("idle");
    };
    audio.onerror = () => setState("idle");
    audio.onplaying = () => setState("playing");
    try {
      await audio.play();
      audioRef.current = audio;
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={play}
      aria-label={state === "playing" ? "Pausar audio" : "Escuchar resumen de la factura"}
      className="inline-flex items-center gap-1 text-[12px] font-mono uppercase tracking-[0.15em] text-ink hover:text-terracotta-500 disabled:opacity-60"
      disabled={state === "loading"}
    >
      {state === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
      {state === "playing" && <Pause className="w-3 h-3" />}
      {state === "idle" && <Volume2 className="w-3 h-3" />}
      {state === "playing" ? "Pausar" : "Escuchar"}
    </button>
  );
}

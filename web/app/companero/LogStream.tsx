/**
 * Terminal log stream — decorativo. Logs públicos genéricos, NO filtra arquitectura interna.
 * Lee el estado del avatar y emite líneas correspondientes con timestamps falsos pero realistas.
 */
"use client";

import { useEffect, useRef, useState } from "react";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface Props { state: AvatarState; }

const TEMPLATES: Record<AvatarState, string[]> = {
  idle: [
    "[SYS] standby · idle loop",
    "[NET] uplink stable · 28 ms",
    "[VIS] tracking ambient",
    "[AUD] noise floor -52 dB",
    "[CTX] waiting for input",
  ],
  listening: [
    "[MIC] capture begin",
    "[VAD] voice activity detected",
    "[STT] transcribing es-ES",
    "[TOKENS] streaming…",
    "[NLP] parsing intent",
  ],
  thinking: [
    "[NLU] intent classified",
    "[CTX] composing response",
    "[POLICY] safety filters · ok",
    "[REASONING] depth=2",
    "[SYNTH] preparing output",
  ],
  speaking: [
    "[TTS] stream open",
    "[VOICE] phoneme alignment",
    "[FRAME] viseme=ah",
    "[FRAME] viseme=oh",
    "[OUT] audio playing",
  ],
};

function ts(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${(d.getMilliseconds() % 1000).toString().padStart(3, "0")}`;
}

export default function LogStream({ state }: Props) {
  const [lines, setLines] = useState<{ ts: string; text: string; key: number }[]>([
    { ts: ts(), text: "[BOOT] jarvis.online", key: 0 },
    { ts: ts(), text: "[NEURAL] interface ready", key: 1 },
  ]);
  const counterRef = useRef(2);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      const pool = TEMPLATES[stateRef.current];
      const text = pool[Math.floor(Math.random() * pool.length)];
      const next = { ts: ts(), text, key: counterRef.current++ };
      setLines((prev) => [...prev.slice(-12), next]);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="logstream">
      <div className="logstream-header">
        <span className="logstream-dot" /> jarvis.log
      </div>
      <div className="logstream-body">
        {lines.map((l) => (
          <div key={l.key} className="logstream-line">
            <span className="logstream-ts">{l.ts}</span>
            <span className="logstream-text">{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

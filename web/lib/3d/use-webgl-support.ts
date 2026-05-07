"use client";

import { useEffect, useState } from "react";

export type WebGLFallback = "video" | "html" | null;

export interface WebGLSupport {
  /** Si WebGL2 está disponible. */
  supported: boolean;
  /** Estrategia de fallback cuando supported=false. */
  fallback: WebGLFallback;
  /** Si ya se evaluó (evita flicker SSR). */
  ready: boolean;
}

/**
 * Detecta soporte WebGL2 en el navegador.
 *
 * Estrategia: si WebGL2 NO está disponible, sirve fallback tipo "video"
 * (MP4 pre-renderizado del hero). Si el dispositivo no soporta canvas
 * en absoluto (raro), cae a "html" (NoScriptContent puro).
 *
 * NO se usa para distinguir mobile/desktop — esa decisión la toma
 * useDeviceTier() para LOD. Aquí solo importa: ¿puedo levantar Canvas
 * R3F sin que el navegador rompa?
 */
export function useWebGLSupport(): WebGLSupport {
  const [state, setState] = useState<WebGLSupport>({
    supported: false,
    fallback: null,
    ready: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        (canvas.getContext("experimental-webgl2") as WebGL2RenderingContext | null);

      if (gl && typeof gl.getParameter === "function") {
        setState({ supported: true, fallback: null, ready: true });
        return;
      }

      // WebGL2 no disponible — fallback a video
      setState({ supported: false, fallback: "video", ready: true });
    } catch {
      // Canvas API no disponible — fallback HTML puro
      setState({ supported: false, fallback: "html", ready: true });
    }
  }, []);

  return state;
}

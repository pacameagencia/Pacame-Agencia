"use client";

/**
 * UnityLoader — embebe un build Unity WebGL dentro de un canvas responsive.
 *
 * Unity export genera 4 archivos principales:
 *   - {build}.loader.js    → UnityLoader bootstrapper
 *   - {build}.data         → asset bundle
 *   - {build}.framework.js → runtime
 *   - {build}.wasm         → binario
 *
 * Este componente:
 *  1. Valida WebGL2 support (grace fallback si no)
 *  2. Carga UnityLoader.js dinamico con <script>
 *  3. Instancia el game via createUnityInstance()
 *  4. Muestra progress bar real durante download/decompress
 *  5. Cleanup onunmount (QuitUnity + remove scripts)
 *
 * Events: onReady / onProgress / onError / onQuit
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

interface Props {
  loaderUrl: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  /** "16:9" | "4:3" | "1:1" | "21:9" ... */
  aspectRatio?: string;
  /** MB — Unity hint para allocar memoria antes del runtime */
  memorySizeMb?: number;
  companyName?: string;
  productName?: string;
  productVersion?: string;
  onReady?: () => void;
  onProgress?: (pct: number) => void;
  onError?: (message: string) => void;
}

interface UnityConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string;
  companyName: string;
  productName: string;
  productVersion: string;
}

type UnityInstance = {
  Quit: () => Promise<void>;
  SetFullscreen?: (full: 0 | 1) => void;
};

type CreateUnityInstance = (
  canvas: HTMLCanvasElement,
  config: UnityConfig,
  onProgress?: (p: number) => void
) => Promise<UnityInstance>;

declare global {
  interface Window {
    createUnityInstance?: CreateUnityInstance;
  }
}

function aspectToPadding(ratio: string): string {
  const [w, h] = ratio.split(":").map(Number);
  if (!w || !h) return "56.25%"; // 16:9 fallback
  return `${(h / w) * 100}%`;
}

function detectWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function UnityLoader({
  loaderUrl,
  dataUrl,
  frameworkUrl,
  codeUrl,
  aspectRatio = "16:9",
  companyName = "PACAME",
  productName = "PACAME Game",
  productVersion = "1.0",
  onReady,
  onProgress,
  onError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<UnityInstance | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webglOk] = useState(detectWebGL2());

  useEffect(() => {
    if (!webglOk) {
      const msg = "Tu navegador no soporta WebGL. Actualiza o prueba Chrome/Firefox/Edge.";
      setError(msg);
      onError?.(msg);
      return;
    }
    if (!canvasRef.current) return;

    let cancelled = false;

    const script = document.createElement("script");
    script.src = loaderUrl;
    script.async = true;
    scriptRef.current = script;

    script.onload = async () => {
      if (cancelled) return;
      if (!window.createUnityInstance) {
        const msg = "UnityLoader.js no expone createUnityInstance";
        setError(msg);
        onError?.(msg);
        return;
      }
      try {
        const inst = await window.createUnityInstance(
          canvasRef.current!,
          {
            dataUrl,
            frameworkUrl,
            codeUrl,
            streamingAssetsUrl: "StreamingAssets",
            companyName,
            productName,
            productVersion,
          },
          (p: number) => {
            if (cancelled) return;
            const pct = Math.round(p * 100);
            setLoadPct(pct);
            onProgress?.(pct);
          }
        );
        if (cancelled) {
          await inst.Quit();
          return;
        }
        instanceRef.current = inst;
        setReady(true);
        onReady?.();
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Error cargando juego Unity";
        setError(msg);
        onError?.(msg);
      }
    };

    script.onerror = () => {
      if (cancelled) return;
      const msg = `Fallo al cargar UnityLoader.js (${loaderUrl})`;
      setError(msg);
      onError?.(msg);
    };

    document.body.appendChild(script);

    return () => {
      cancelled = true;
      if (instanceRef.current) {
        instanceRef.current.Quit().catch(() => {});
        instanceRef.current = null;
      }
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
    // Only re-mount if URLs change
  }, [
    loaderUrl,
    dataUrl,
    frameworkUrl,
    codeUrl,
    companyName,
    productName,
    productVersion,
    webglOk,
    onReady,
    onError,
    onProgress,
  ]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-ink shadow-2xl"
      style={{ paddingTop: aspectToPadding(aspectRatio) }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        tabIndex={-1}
      />

      {/* Loading overlay */}
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/95 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
          <div className="text-paper/80 font-body text-sm mb-4">
            Cargando experiencia...
          </div>
          <div className="w-64 h-1.5 bg-paper/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-400 transition-all duration-200"
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <div className="text-paper/40 font-mono text-[11px] mt-2">
            {loadPct}%
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/95 backdrop-blur-sm p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-accent-burgundy mb-4" />
          <div className="text-paper font-heading font-semibold mb-2">
            No se puede cargar el juego
          </div>
          <p className="text-paper/70 font-body text-sm max-w-md">{error}</p>
        </div>
      )}
    </div>
  );
}

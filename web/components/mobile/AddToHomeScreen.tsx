"use client";

/**
 * AddToHomeScreen — Custom A2HS prompt para PWA.
 *
 * Aparece tras 30s en mobile no-PWA, una vez por dispositivo (localStorage flag).
 * Detecta `beforeinstallprompt` (Chrome/Edge/Android) y muestra UI editorial Spanish Modernism.
 * En iOS Safari, instrucciones manuales (no soporta beforeinstallprompt).
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Plus, Share, MoreVertical } from "lucide-react";

const STORAGE_KEY = "pacame_a2hs_dismissed_v1";
const DELAY_MS = 30_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isMobile() || isStandalone()) return;
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const timer = setTimeout(() => {
      if (installEvent) {
        setShow(true);
      } else if (isIOS()) {
        setIosMode(true);
        setShow(true);
      }
    }, DELAY_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [installEvent]);

  const dismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      dismiss();
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed left-3 right-3 bottom-20 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-labelledby="a2hs-title"
      aria-describedby="a2hs-desc"
    >
      <div
        className="relative bg-paper border border-ink/10 rounded-md shadow-xl overflow-hidden"
        style={{ boxShadow: "4px 4px 0 #B54E30" }}
      >
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1.5 text-ink/45 hover:text-ink active:scale-90"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 p-4 pr-10">
          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden border border-ink/10">
            <Image
              src="/generated/mobile/pwa-icon-512.png"
              alt="PACAME app icon"
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              id="a2hs-title"
              className="font-display italic text-[18px] text-ink leading-tight mb-0.5"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              Instala PACAME
            </p>
            <p
              id="a2hs-desc"
              className="text-[12px] font-sans text-ink/65 leading-snug"
            >
              {iosMode
                ? "Toca el botón Compartir y luego \"Añadir a pantalla de inicio\"."
                : "Pantalla completa, accesos rápidos y sensación de app nativa."}
            </p>
          </div>
        </div>

        {iosMode ? (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-ink/10 bg-sand-50">
            <Share className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink/60">
              compartir
            </span>
            <span className="text-ink/40">→</span>
            <Plus className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink/60">
              añadir a inicio
            </span>
          </div>
        ) : (
          <div className="flex items-stretch border-t border-ink/10">
            <button
              onClick={dismiss}
              className="flex-1 px-4 py-3 text-[13px] font-mono uppercase tracking-wider text-ink/55 active:bg-ink/5"
            >
              Ahora no
            </button>
            <button
              onClick={install}
              className="flex-1 px-4 py-3 text-[13px] font-sans font-medium text-paper bg-terracotta-500 active:bg-terracotta-600"
            >
              Instalar app
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

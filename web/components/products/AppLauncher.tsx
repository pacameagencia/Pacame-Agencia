"use client";

import { useState, useTransition, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface OverlayProps {
  open: boolean;
  name: string;
  color: string;
  accentColor?: string;
  badge?: string;
  tagline?: string;
  duration?: number;
}

/**
 * Overlay imperativo: úsalo cuando el splash se dispara desde un side-effect
 * (ej. tras un fetch exitoso) y no desde un click.
 */
export function AppLaunchOverlay({
  open,
  name,
  color,
  accentColor = "#FAF6EE",
  badge,
  tagline = "Abriendo tu panel…",
  duration = 700,
}: OverlayProps) {
  const initial = badge ?? name.slice(0, 1).toUpperCase();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: color }}
          role="status"
          aria-live="polite"
          aria-label={`Abriendo ${name}`}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <div
              className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center font-display text-4xl lg:text-5xl"
              style={{
                color,
                background: accentColor,
                fontWeight: 500,
                boxShadow: `8px 8px 0 rgba(0,0,0,0.15)`,
              }}
            >
              {initial}
            </div>
            <span
              className="mt-6 font-display text-2xl lg:text-3xl"
              style={{ color: accentColor, fontWeight: 500, letterSpacing: "-0.02em" }}
            >
              {name}
            </span>
            <span
              className="mt-2 font-mono text-[11px] tracking-[0.25em] uppercase"
              style={{ color: accentColor, opacity: 0.7 }}
            >
              {tagline}
            </span>
            <div className="mt-8 w-44 h-0.5 bg-white/15 overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: duration / 1000, ease: "easeInOut" }}
                className="h-full w-full"
                style={{ background: accentColor }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Props {
  /** Slug del SaaS (asesor-pro, promptforge…) — sólo para identificar */
  productId: string;
  /** Nombre legible que aparece bajo el logo */
  name: string;
  /** Color primario del SaaS (background del splash) */
  color: string;
  /** Color de acento opcional para el progress bar (default: blanco) */
  accentColor?: string;
  /** URL a la que navegar tras el splash */
  href: string;
  /** Inicial o emoji que aparece en el cuadro grande del logo */
  badge?: string;
  /** Texto bajo el nombre — default: "Cargando tu panel…" */
  tagline?: string;
  /** Duración total del splash en ms — default: 700 */
  duration?: number;
  /** Children (botón/Link) que se interceptará al click */
  children: ReactNode;
  /** Class extra para el wrapper */
  className?: string;
}

/**
 * Wrapper que intercepta el click del CTA y muestra un splash full-screen
 * con la identidad del SaaS antes de navegar. Da la sensación de "abrir
 * una app" en vez de "ir a otra página".
 */
export function AppLauncher({
  productId,
  name,
  color,
  accentColor = "#FAF6EE",
  href,
  badge,
  tagline = "Abriendo tu panel…",
  duration = 700,
  children,
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const initial = badge ?? name.slice(0, 1).toUpperCase();

  function launch(e: MouseEvent<HTMLDivElement>) {
    // Permitir cmd/ctrl+click y middle click para abrir en pestaña nueva
    const me = e as unknown as MouseEvent & { metaKey: boolean; ctrlKey: boolean; button: number };
    if (me.metaKey || me.ctrlKey || me.button === 1) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    // Prefetch + navigate dentro de un transition
    router.prefetch(href);
    window.setTimeout(() => {
      startTransition(() => router.push(href));
    }, duration);
  }

  return (
    <>
      <div
        onClickCapture={launch}
        className={className}
        data-app-launcher={productId}
        role="presentation"
      >
        {children}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: color }}
            role="status"
            aria-live="polite"
            aria-label={`Abriendo ${name}`}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <div
                className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center font-display text-4xl lg:text-5xl"
                style={{
                  color,
                  background: accentColor,
                  fontWeight: 500,
                  boxShadow: `8px 8px 0 rgba(0,0,0,0.15)`,
                }}
              >
                {initial}
              </div>
              <span
                className="mt-6 font-display text-2xl lg:text-3xl"
                style={{ color: accentColor, fontWeight: 500, letterSpacing: "-0.02em" }}
              >
                {name}
              </span>
              <span
                className="mt-2 font-mono text-[11px] tracking-[0.25em] uppercase"
                style={{ color: accentColor, opacity: 0.7 }}
              >
                {tagline}
              </span>

              <div className="mt-8 w-44 h-0.5 bg-white/15 overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: duration / 1000, ease: "easeInOut" }}
                  className="h-full w-full"
                  style={{ background: accentColor }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

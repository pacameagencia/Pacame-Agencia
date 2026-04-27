"use client";

/**
 * PACAME — ThemeBodyClass (Sprint 25)
 *
 * Aplica una clase al <body> mientras la página está montada.
 * Usado por las 5 páginas core para activar `body.theme-tech` (paleta dark
 * tech-IA) sin romper las páginas legacy que mantienen Spanish Modernism.
 *
 * @example
 *   <ThemeBodyClass className="theme-tech" />
 */

import { useEffect } from "react";

interface ThemeBodyClassProps {
  className: string;
}

export default function ThemeBodyClass({ className }: ThemeBodyClassProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const classes = className.split(" ").filter(Boolean);
    classes.forEach((c) => document.body.classList.add(c));
    return () => {
      classes.forEach((c) => document.body.classList.remove(c));
    };
  }, [className]);

  return null;
}

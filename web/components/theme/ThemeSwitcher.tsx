"use client";

/**
 * PACAME — Theme switcher dark/light (Sprint 25)
 *
 * Toggle estilo Raycast con icon morph (sun ↔ moon).
 * Persiste vía next-themes. Mounted-guard para evitar hydration mismatch.
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

interface ThemeSwitcherProps {
  className?: string;
}

export default function ThemeSwitcher({ className = "" }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const toggle = () => {
    const current = resolvedTheme || theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        aria-label="Cambiar tema"
        className={`relative h-9 w-9 rounded-full border border-tech-border bg-tech-surface ${className}`}
      />
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      data-cursor="hover"
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-tech-border bg-tech-surface text-tech-text-soft transition-all duration-300 hover:border-tech-accent/40 hover:text-tech-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40 ${className}`}
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark
            ? "scale-0 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
        strokeWidth={1.8}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 -rotate-90 opacity-0"
        }`}
        strokeWidth={1.8}
      />
    </button>
  );
}

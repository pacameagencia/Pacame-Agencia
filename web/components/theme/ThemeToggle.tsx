"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10" aria-hidden />;
  }

  const current = theme === "system" ? "system" : resolvedTheme || "dark";
  const nextTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <button
      onClick={nextTheme}
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-paper/5 transition text-ink/60 hover:text-ink"
      aria-label={`Cambiar tema (actual: ${current})`}
      title={`Tema: ${theme === "system" ? "auto (sistema)" : theme}`}
    >
      {theme === "system" ? (
        <Monitor className="w-4 h-4" />
      ) : current === "dark" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}

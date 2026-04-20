import type { Config } from "tailwindcss";
import { colors as tk, shadows as sh } from "./lib/design/tokens";

/**
 * PACAME Tailwind Config — Sprint 18
 * Semantic tokens desde web/lib/design/tokens.ts (base paletas @design.deb).
 * Legacy aliases preservados para compat durante migracion (script los limpia).
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════
        // PACAME semantic tokens (Sprint 18 — base paletas @design.deb)
        // ═══════════════════════════════════════════════════════════
        brand: {
          primary: tk.brand.primary,
          "primary-soft": tk.brand.primary_soft,
          50: tk.brand[50],
          100: tk.brand[100],
          200: tk.brand[200],
          300: tk.brand[300],
          400: tk.brand[400],
          500: tk.brand[500],
          600: tk.brand[600],
          700: tk.brand[700],
          800: tk.brand[800],
          900: tk.brand[900],
          950: tk.brand[950],
        },
        accent: {
          gold: tk.accent.gold,
          "gold-soft": tk.accent.gold_soft,
          "gold-deep": tk.accent.gold_deep,
          burgundy: tk.accent.burgundy,
          "burgundy-soft": tk.accent.burgundy_soft,
          "burgundy-mist": tk.accent.burgundy_mist,
        },
        mint: {
          DEFAULT: tk.success.DEFAULT,
          soft: tk.success.soft,
          50: tk.success[50],
          100: tk.success[100],
          500: tk.success[500],
          700: tk.success[700],
          900: tk.success[900],
        },
        violet: {
          DEFAULT: tk.creative.violet,
          soft: tk.creative.violet_soft,
          deep: tk.creative.violet_deep,
        },
        paper: {
          DEFAULT: tk.paper,
          soft: tk.paper_soft,
          deep: tk.paper_deep,
        },
        ink: {
          DEFAULT: tk.ink,
          soft: tk.ink_soft,
          mute: tk.ink_mute,
          subtle: tk.ink_subtle,
          faint: tk.ink_faint,
        },
        danger: {
          DEFAULT: tk.danger,
          soft: tk.danger_soft,
        },
        warning: {
          DEFAULT: tk.warning,
          soft: tk.warning_soft,
        },
        info: {
          DEFAULT: tk.info,
          soft: tk.info_soft,
        },

        // ═══════════════════════════════════════════════════════════
        // LEGACY ALIASES (compat — script migration los eliminara)
        // Mapeados a los nuevos tokens para no romper componentes existentes
        // ═══════════════════════════════════════════════════════════
        "pacame-black": tk.ink,                // → ink (dark navy)
        "pacame-white": tk.paper,              // → paper (light bg)
        "electric-violet": tk.brand.primary,   // → brand primary (Ocean Blue)
        "deep-indigo": tk.brand[700],
        "slate-brand": tk.ink_subtle,
        "soft-gray": tk.ink_faint,
        "neon-cyan": tk.success.DEFAULT,       // → mint
        "lime-pulse": tk.success.DEFAULT,
        "amber-signal": tk.accent.gold,
        "rose-alert": tk.accent.burgundy_soft,
        "agent-nova":  tk.brand.primary,
        "agent-atlas": tk.brand[700],
        "agent-nexus": tk.accent.burgundy,
        "agent-pixel": tk.success.DEFAULT,
        "agent-core":  tk.success[700],
        "agent-pulse": tk.accent.burgundy_soft,
        "agent-sage":  tk.accent.gold_deep,
        "olympus-gold": tk.accent.gold,
        "olympus-gold-light": tk.accent.gold_soft,
        "olympus-gold-dark":  tk.accent.gold_deep,
        "bronze-divine": tk.accent.gold_deep,
        "celestial-silver": tk.ink_subtle,
        "aether-blue": tk.brand[900],
        "void-purple": tk.ink,
        "aurora-pink": tk.accent.burgundy_soft,
        "aurora-teal": tk.success.DEFAULT,
        "dark-card": tk.paper_deep,            // mapped to light mode paper
        "dark-elevated": tk.paper_soft,
        "dark-surface": tk.paper,
      },
      fontFamily: {
        // New primary stack: Geist (del skill pack) + mono
        sans: [
          "var(--font-geist-sans)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-geist-sans)",
          "var(--font-space-grotesk)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "monospace",
        ],
        // Legacy aliases
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        accent: ["var(--font-playfair)", "serif"],
      },
      fontSize: {
        hero: [
          "clamp(3rem, 8vw, 7.5rem)",
          { lineHeight: "0.95", fontWeight: "700", letterSpacing: "-0.04em" },
        ],
        display: [
          "clamp(2.5rem, 6vw, 5rem)",
          { lineHeight: "1", fontWeight: "700", letterSpacing: "-0.03em" },
        ],
        section: [
          "clamp(2rem, 4vw, 3.5rem)",
          { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.02em" },
        ],
        subsection: [
          "clamp(1.5rem, 2.5vw, 2.25rem)",
          { lineHeight: "1.15", fontWeight: "600", letterSpacing: "-0.02em" },
        ],
        kicker: [
          "0.75rem",
          { lineHeight: "1.3", fontWeight: "500", letterSpacing: "0.18em" },
        ],
      },
      backgroundImage: {
        // Nuevos gradients basados en paletas @design.deb
        "brand-gradient": `linear-gradient(135deg, ${tk.brand.primary} 0%, ${tk.brand[700]} 100%)`,
        "ocean-gradient": `linear-gradient(180deg, ${tk.brand.primary_soft} 0%, ${tk.brand.primary} 100%)`,
        "gold-gradient": `linear-gradient(135deg, ${tk.accent.gold_soft} 0%, ${tk.accent.gold} 100%)`,
        "mint-gradient": `linear-gradient(135deg, ${tk.success.soft} 0%, ${tk.success.DEFAULT} 100%)`,
        "creative-gradient": `linear-gradient(135deg, ${tk.creative.violet_soft} 0%, ${tk.creative.violet} 100%)`,
        "hero-glow": `radial-gradient(ellipse at 50% 0%, ${tk.brand.primary_soft} 0%, transparent 70%)`,
        "paper-mesh": `radial-gradient(circle at 30% 20%, ${tk.brand[100]} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${tk.accent.gold_soft} 0%, transparent 50%)`,
        // Legacy compat
        "myth-gradient": `linear-gradient(135deg, ${tk.brand.primary} 0%, ${tk.accent.gold} 100%)`,
        "aurora-gradient": `linear-gradient(135deg, ${tk.brand.primary} 0%, ${tk.creative.violet} 50%, ${tk.success.DEFAULT} 100%)`,
        "olympus-radial": `radial-gradient(ellipse at 30% 20%, ${tk.accent.gold_soft} 0%, ${tk.brand[100]} 40%, transparent 70%)`,
        "gold-shimmer": `linear-gradient(90deg, transparent, ${tk.accent.gold_soft}, transparent)`,
        "card-glow-violet": `radial-gradient(circle at 50% 0%, ${tk.creative.violet_soft} 0%, transparent 60%)`,
      },
      boxShadow: {
        // Nuevos tokens shadow
        neumo: sh.neumo,
        pill: sh.pill,
        inset: sh.inset,
        glass: sh.glass,
        "glow-primary": sh.glow_primary,
        "glow-gold": sh.glow_gold,
        "glow-mint": sh.glow_mint,
        // Legacy
        "glow-violet": sh.glow_primary,
        "glow-cyan": sh.glow_mint,
        "glow-gold-lg": sh.glow_gold,
        "divine": sh.neumo,
        "apple-sm": sh.sm,
        "apple": sh.md,
        "apple-lg": sh.lg,
        "apple-xl": sh.xl,
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        breathe: "breathe 10s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        "golden-pulse": "golden-pulse 3s ease-in-out infinite",
        "divine-entrance": "divine-entrance 1s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "text-shimmer": "text-shimmer 3s ease-in-out infinite",
        "parallax-float": "parallax-float 12s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.23, 1, 0.32, 1)",
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;

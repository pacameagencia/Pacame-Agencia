import type { Config } from "tailwindcss";

/**
 * PACAME — Spanish Modernism Design System
 *
 * Paleta: inspirada en Cruz Novillo, Loewe, cerámica mediterránea.
 * Fondo: arena cálida (no blanco puro, no dark genérico).
 * Acentos: terracota, índigo profundo, mostaza.
 * Sin violeta/cyan (anti-AI-smell).
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
        // ── Neutros cálidos (base del sistema) ──
        paper: "#F4EFE3",        // fondo global (arena muy clara)
        sand: {
          50: "#F9F5EA",
          100: "#F4EFE3",
          200: "#EBE3D0",
          300: "#DFD3B8",
          400: "#C9B990",
          500: "#A89A72",
          600: "#7A6C4D",
        },
        ink: {
          DEFAULT: "#1A1813",    // texto (negro cálido, no #000)
          soft: "#3A362C",
          mute: "#6E6858",
        },

        // ── Acentos Spanish Modernism ──
        terracotta: {
          300: "#E08A6B",
          400: "#CB6B47",
          500: "#B54E30",        // primario accent
          600: "#9C3E24",
          700: "#7A2E18",
          900: "#3E1708",
        },
        indigo: {
          400: "#4A5FA0",
          500: "#374A8C",
          600: "#283B70",        // primario oscuro
          700: "#1E2D58",
          800: "#141E3C",
          900: "#0B1225",
        },
        mustard: {
          300: "#F5D478",
          400: "#F3C754",
          500: "#E8B730",        // accent brillante
          600: "#C69922",
          700: "#9B7714",
        },
        olive: {
          500: "#6B7535",        // accent secundario (verde oliva español)
          600: "#555F28",
        },

        // ── Backwards compat (SWAP intencional: bg-pacame-black era dark → ahora paper;
        //     text-pacame-white era claro → ahora ink. Invierte las secciones legacy a light.) ──
        "pacame-black": "#F4EFE3",   // ex-negro → ahora PAPER
        "pacame-white": "#1A1813",   // ex-blanco → ahora INK
        "electric-violet": "#B54E30",     // remapped a terracota
        "deep-indigo": "#283B70",
        "slate-brand": "#6E6858",
        "soft-gray": "#EBE3D0",
        "neon-cyan": "#E8B730",            // remapped a mostaza
        "lime-pulse": "#6B7535",
        "amber-signal": "#E8B730",
        "rose-alert": "#B54E30",

        // Agent colors — mapped al sistema Spanish Modernism
        "agent-nova": "#B54E30",          // terracota
        "agent-atlas": "#283B70",         // índigo
        "agent-nexus": "#CB6B47",         // terracota claro
        "agent-pixel": "#374A8C",         // índigo medio
        "agent-core": "#6B7535",          // oliva
        "agent-pulse": "#E8B730",         // mostaza
        "agent-sage": "#9C3E24",          // terracota oscuro

        // Legacy mythological — mapped
        "olympus-gold": "#E8B730",
        "olympus-gold-light": "#F5D478",
        "olympus-gold-dark": "#9B7714",
        "bronze-divine": "#B54E30",
        "celestial-silver": "#DFD3B8",
        "aether-blue": "#283B70",
        "void-purple": "#F4EFE3",          // ahora fondo arena, no oscuro
        "aurora-pink": "#CB6B47",
        "aurora-teal": "#6B7535",

        // UI surfaces — ahora claras, no dark
        "dark-card": "#F9F5EA",
        "dark-elevated": "#FFFFFF",
        "dark-surface": "#EBE3D0",
      },
      fontFamily: {
        // Fraunces: serif expressivo para titulares (estético mediterráneo)
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        heading: ["var(--font-fraunces)", "Georgia", "serif"],
        // Instrument Sans: humanista para cuerpo (nuevo, no Inter tópico)
        body: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        // Backcompat
        accent: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      fontSize: {
        // Spanish Modernism scale — grande, con personalidad
        hero: ["clamp(3rem, 8vw, 7.5rem)", { lineHeight: "0.95", fontWeight: "500", letterSpacing: "-0.035em" }],
        display: ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1.0", fontWeight: "500", letterSpacing: "-0.03em" }],
        section: ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.05", fontWeight: "500", letterSpacing: "-0.025em" }],
        subsection: ["clamp(1.5rem, 2.5vw, 2.25rem)", { lineHeight: "1.15", fontWeight: "500", letterSpacing: "-0.015em" }],
        kicker: ["0.75rem", { lineHeight: "1.2", fontWeight: "500", letterSpacing: "0.18em" }],
      },
      backgroundImage: {
        // Gradientes Spanish Modernism (sutiles, no neón)
        "brand-gradient": "linear-gradient(135deg, #B54E30 0%, #283B70 100%)",
        "hero-glow": "radial-gradient(ellipse at 50% 0%, rgba(232,183,48,0.12) 0%, transparent 70%)",
        "card-glow-violet": "radial-gradient(circle at 50% 0%, rgba(181,78,48,0.05) 0%, transparent 60%)",
        "myth-gradient": "linear-gradient(135deg, #B54E30 0%, #E8B730 50%, #283B70 100%)",
        "aurora-gradient": "linear-gradient(135deg, #B54E30 0%, #E8B730 40%, #283B70 100%)",
        "olympus-radial": "radial-gradient(ellipse at 30% 20%, rgba(232,183,48,0.08) 0%, rgba(181,78,48,0.04) 40%, transparent 70%)",
        "gold-shimmer": "linear-gradient(90deg, transparent, rgba(232,183,48,0.15), transparent)",
        "paper-grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.05 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        // Sombras orgánicas cálidas, no neón
        "glow-violet": "0 8px 24px rgba(181,78,48,0.12)",
        "glow-cyan": "0 8px 24px rgba(40,59,112,0.10)",
        "glow-gold": "0 8px 24px rgba(232,183,48,0.15)",
        "glow-gold-lg": "0 20px 50px rgba(232,183,48,0.18), 0 8px 20px rgba(181,78,48,0.08)",
        divine: "0 16px 40px rgba(26,24,19,0.08), 0 4px 12px rgba(26,24,19,0.04)",
        "apple-sm": "0 1px 3px rgba(26,24,19,0.08), 0 1px 2px rgba(26,24,19,0.04)",
        apple: "0 4px 12px rgba(26,24,19,0.06), 0 2px 4px rgba(26,24,19,0.04)",
        "apple-lg": "0 20px 40px rgba(26,24,19,0.08), 0 8px 16px rgba(26,24,19,0.04)",
        "apple-xl": "0 30px 60px rgba(26,24,19,0.10), 0 12px 24px rgba(26,24,19,0.06)",
        stamp: "2px 2px 0 rgba(26,24,19,1)",        // sello artesanal
        "stamp-lg": "4px 4px 0 rgba(26,24,19,1)",
      },
      animation: {
        "fade-up": "fadeUp 0.9s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in": "fadeIn 0.7s ease-out forwards",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        float: "float 10s ease-in-out infinite",
        breathe: "breathe 14s ease-in-out infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
        "golden-pulse": "golden-pulse 4s ease-in-out infinite",
        "divine-entrance": "divine-entrance 1.1s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "text-shimmer": "text-shimmer 4s ease-in-out infinite",
        "parallax-float": "parallax-float 14s ease-in-out infinite",
        "sun-rotate": "sun-rotate 60s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "sun-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      borderRadius: {
        // Spanish Modernism: formas rectas, esquinas mínimas
        none: "0",
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.23, 1, 0.32, 1)",
        editorial: "cubic-bezier(0.7, 0, 0.3, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "900": "900ms",
      },
    },
  },
  plugins: [],
};

export default config;

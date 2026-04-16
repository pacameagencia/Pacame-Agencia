import type { Config } from "tailwindcss";

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
        // PACAME Brand Colors — Apple-refined
        "pacame-black": "#0A0A0A",
        "pacame-white": "#F5F5F7",
        "electric-violet": "#7C3AED",
        "deep-indigo": "#4338CA",
        "slate-brand": "#86868B",
        "soft-gray": "#E2E8F0",
        "neon-cyan": "#06B6D4",
        "lime-pulse": "#84CC16",
        "amber-signal": "#F59E0B",
        "rose-alert": "#F43F5E",
        // Agent colors
        "agent-nova": "#7C3AED",
        "agent-atlas": "#2563EB",
        "agent-nexus": "#EA580C",
        "agent-pixel": "#06B6D4",
        "agent-core": "#16A34A",
        "agent-pulse": "#EC4899",
        "agent-sage": "#D97706",
        // Mythological palette — Olympus
        "olympus-gold": "#D4A853",
        "olympus-gold-light": "#F0D68A",
        "olympus-gold-dark": "#9E7B33",
        "bronze-divine": "#CD7F32",
        "celestial-silver": "#C0C7D4",
        "aether-blue": "#1B1F3B",
        "void-purple": "#0D0B21",
        "aurora-pink": "#FF6B9D",
        "aurora-teal": "#4ECDC4",
        // Dark UI colors — deeper, richer
        "dark-card": "#161617",
        "dark-elevated": "#1D1D1F",
        "dark-surface": "#2D2D2F",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        accent: ["var(--font-playfair)", "serif"],
      },
      fontSize: {
        // Apple-scale typography — big, bold, impactful
        "hero": ["clamp(2.75rem, 6vw, 5rem)", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.03em" }],
        "display": ["clamp(2.25rem, 4.5vw, 3.75rem)", { lineHeight: "1.08", fontWeight: "700", letterSpacing: "-0.03em" }],
        "section": ["clamp(1.875rem, 3.5vw, 3rem)", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
        "subsection": ["clamp(1.375rem, 2vw, 1.875rem)", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.02em" }],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7C3AED 0%, #4338CA 50%, #06B6D4 100%)",
        "hero-glow": "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)",
        "card-glow-violet": "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)",
        "myth-gradient": "linear-gradient(135deg, #7C3AED 0%, #D4A853 50%, #06B6D4 100%)",
        "aurora-gradient": "linear-gradient(135deg, #7C3AED 0%, #FF6B9D 25%, #D4A853 50%, #4ECDC4 75%, #06B6D4 100%)",
        "olympus-radial": "radial-gradient(ellipse at 30% 20%, rgba(212,168,83,0.08) 0%, rgba(124,58,237,0.05) 40%, transparent 70%)",
        "gold-shimmer": "linear-gradient(90deg, transparent, rgba(212,168,83,0.15), transparent)",
      },
      boxShadow: {
        // Apple-style shadows — deep, layered, natural
        "glow-violet": "0 0 40px rgba(124, 58, 237, 0.2)",
        "glow-cyan": "0 0 40px rgba(6, 182, 212, 0.2)",
        "glow-gold": "0 0 40px rgba(212, 168, 83, 0.2)",
        "glow-gold-lg": "0 0 80px rgba(212, 168, 83, 0.15), 0 0 160px rgba(212, 168, 83, 0.05)",
        "divine": "0 20px 60px rgba(212, 168, 83, 0.1), 0 4px 16px rgba(0, 0, 0, 0.3)",
        "apple-sm": "0 2px 8px rgba(0, 0, 0, 0.3)",
        "apple": "0 4px 16px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(0, 0, 0, 0.2)",
        "apple-lg": "0 8px 30px rgba(0, 0, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.25)",
        "apple-xl": "0 20px 80px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "float": "float 8s ease-in-out infinite",
        "breathe": "breathe 10s ease-in-out infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "golden-pulse": "golden-pulse 3s ease-in-out infinite",
        "divine-entrance": "divine-entrance 1s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "text-shimmer": "text-shimmer 3s ease-in-out infinite",
        "parallax-float": "parallax-float 12s ease-in-out infinite",
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
        "apple": "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
      },
    },
  },
  plugins: [],
};

export default config;

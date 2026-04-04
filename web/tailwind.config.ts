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
        // PACAME Brand Colors
        "pacame-black": "#0D0D0D",
        "pacame-white": "#F5F5F0",
        "electric-violet": "#7C3AED",
        "deep-indigo": "#4338CA",
        "slate-brand": "#64748B",
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
        // Dark UI colors
        "dark-card": "#1A1A2E",
        "dark-elevated": "#111118",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "hero": ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1.1", fontWeight: "700" }],
        "section": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.15", fontWeight: "700" }],
        "subsection": ["clamp(1.375rem, 2vw, 1.75rem)", { lineHeight: "1.2", fontWeight: "500" }],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7C3AED 0%, #4338CA 50%, #06B6D4 100%)",
        "hero-glow": "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, transparent 70%)",
        "card-glow-violet": "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)",
        "grid-pattern": "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.03)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },
      boxShadow: {
        "glow-violet": "0 0 30px rgba(124, 58, 237, 0.4)",
        "glow-cyan": "0 0 30px rgba(6, 182, 212, 0.4)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;

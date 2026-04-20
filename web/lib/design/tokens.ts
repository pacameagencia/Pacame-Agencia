/**
 * PACAME Design Tokens — Sprint 18
 *
 * Base de paleta: inspirada en @design.deb (4 combos referenciales),
 * adaptada a escala enterprise tier Hostinger/Microsoft.
 *
 * Source of truth. Tailwind config y globals.css importan de aqui.
 */

export const colors = {
  // ═══════════════════════════════════════════════════════════════
  // PRIMARY BRAND — Ocean (Combo 04-Ocean @design.deb)
  // Azul corporate que da confianza y seriedad
  // ═══════════════════════════════════════════════════════════════
  brand: {
    primary:      "#2872A1",   // Ocean Blue — accent primary
    primary_soft: "#CBDDE9",   // Cloudy Sky — soft fills / chip backgrounds
    50:  "#F1F6FA",
    100: "#DCE9F2",
    200: "#B3CFE2",
    300: "#80AFCC",
    400: "#4E8CB5",
    500: "#2872A1",
    600: "#1F5C86",
    700: "#18476B",
    800: "#123551",
    900: "#0B2538",
    950: "#071929",
  },

  // ═══════════════════════════════════════════════════════════════
  // ACCENT — Gold + Burgundy (Combo 01 @design.deb)
  // Lujo editorial. Featured items, ornamentos, plan Premium.
  // ═══════════════════════════════════════════════════════════════
  accent: {
    gold:          "#F1E194",   // Golden Sand
    gold_soft:     "#FAF2D1",
    gold_deep:     "#C9B666",
    burgundy:      "#5B0E14",   // Deep Burgundy
    burgundy_soft: "#A6333A",
    burgundy_mist: "#E8C5C8",
  },

  // ═══════════════════════════════════════════════════════════════
  // SUCCESS — Mint (Combo 04-Mint)
  // ═══════════════════════════════════════════════════════════════
  success: {
    DEFAULT: "#00A19B",
    soft:    "#E4DDD3",   // Ice Latte como fondo suave
    50:  "#E6F7F6",
    100: "#B3E6E3",
    500: "#00A19B",
    700: "#007570",
    900: "#004A46",
  },

  // ═══════════════════════════════════════════════════════════════
  // CREATIVE — Ultra Violet (Combo 05)
  // Secciones marketing, blog, contenido creativo
  // ═══════════════════════════════════════════════════════════════
  creative: {
    violet:      "#5F4A8B",
    violet_soft: "#FEFACD",   // Lemon Chiffon como soft pair
    violet_deep: "#3D2E5B",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEUTRALS — editorial warm cool (cercano al Cloudy Sky)
  // ═══════════════════════════════════════════════════════════════
  paper:       "#F4F6F8",   // primary light bg (sutil cool tint)
  paper_soft:  "#E8EEF3",
  paper_deep:  "#DAE3EB",   // cards, elevated surfaces en light mode

  ink:         "#0F1B2E",   // primary text dark-navy (complementa ocean blue)
  ink_soft:    "#2A3952",
  ink_mute:    "#6A7A94",
  ink_subtle:  "#A3B1C7",
  ink_faint:   "#D0D8E2",

  // ═══════════════════════════════════════════════════════════════
  // SEMANTIC STATES
  // ═══════════════════════════════════════════════════════════════
  danger:      "#B91C1C",   // rojo estandar (no burgundy — reservado editorial)
  danger_soft: "#FEE2E2",
  warning:     "#F59E0B",
  warning_soft:"#FEF3C7",
  info:        "#2872A1",   // mismo brand primary
  info_soft:   "#DCE9F2",
} as const;

// ═══════════════════════════════════════════════════════════════
// RADII — radio consistente por tamaño
// ═══════════════════════════════════════════════════════════════
export const radii = {
  none: "0",
  xs:   "4px",
  sm:   "6px",
  md:   "10px",
  lg:   "14px",
  xl:   "20px",
  "2xl":"28px",
  "3xl":"36px",
  pill: "9999px",
} as const;

// ═══════════════════════════════════════════════════════════════
// SHADOWS — 6-layer neumorphic + glassmorphic + glow
// Del skill pack 3d-scroll-website (battle-tested)
// ═══════════════════════════════════════════════════════════════
export const shadows = {
  // Shadows normales (usando ink como tint)
  sm:   "0 1px 2px rgba(15,27,46,0.04)",
  md:   "0 2px 6px rgba(15,27,46,0.06), 0 4px 12px rgba(15,27,46,0.04)",
  lg:   "0 6px 18px rgba(15,27,46,0.08), 0 12px 40px rgba(15,27,46,0.06)",
  xl:   "0 16px 48px rgba(15,27,46,0.12)",
  "2xl":"0 24px 80px rgba(15,27,46,0.16)",

  // Neumorphic (del skill pack) — 6 outer + 1 inset highlight
  neumo:
    "0px 0.7px 0.7px -0.67px rgba(15,27,46,0.08), " +
    "0px 1.8px 1.8px -1.33px rgba(15,27,46,0.08), " +
    "0px 3.6px 3.6px -2px rgba(15,27,46,0.07), " +
    "0px 6.9px 6.9px -2.67px rgba(15,27,46,0.07), " +
    "0px 13.6px 13.6px -3.33px rgba(15,27,46,0.05), " +
    "0px 30px 30px -4px rgba(15,27,46,0.02), " +
    "inset 0px 3px 1px 0px rgba(255,255,255,1)",

  // Pill shadow (mas suave, para badges flotantes)
  pill:
    "0px 0.7px 0.7px -0.67px rgba(15,27,46,0.08), " +
    "0px 1.8px 1.8px -1.33px rgba(15,27,46,0.08), " +
    "0px 3.6px 3.6px -2px rgba(15,27,46,0.07), " +
    "0px 6.9px 6.9px -2.67px rgba(15,27,46,0.07), " +
    "inset 0px 2px 1px 0px rgba(255,255,255,1)",

  // Inset (para elementos pressed/sunken)
  inset: "inset 2px 2px 5px rgba(15,27,46,0.06), inset -2px -2px 5px rgba(255,255,255,0.8)",

  // Glassmorphic (para navbar, floating cards)
  glass: "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 40px rgba(40,114,161,0.08)",

  // Glow — para CTAs hero y featured
  glow_primary: "0 0 0 1px rgba(40,114,161,0.15), 0 20px 60px -20px rgba(40,114,161,0.35)",
  glow_gold:    "0 0 0 1px rgba(241,225,148,0.3), 0 20px 60px -20px rgba(241,225,148,0.5)",
  glow_mint:    "0 0 0 1px rgba(0,161,155,0.2), 0 20px 60px -20px rgba(0,161,155,0.35)",
} as const;

// ═══════════════════════════════════════════════════════════════
// MOTION — easings + durations consistentes
// ═══════════════════════════════════════════════════════════════
export const motion = {
  ease: {
    // Apple-style (del skill pack)
    apple:    "cubic-bezier(0.23, 1, 0.32, 1)",
    spring:   "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    smooth:   "cubic-bezier(0.4, 0, 0.2, 1)",
    expo_out: "cubic-bezier(0.16, 1, 0.3, 1)",
    back:     "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  duration: {
    fast:       150,
    base:       240,
    slow:       400,
    deliberate: 640,
  },
  // Framer Motion spring presets
  spring: {
    soft:  { stiffness: 100, damping: 20 },
    bouncy:{ stiffness: 150, damping: 15 },
    tight: { stiffness: 300, damping: 30 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════
export const typography = {
  fontFamily: {
    display: "var(--font-geist-sans), var(--font-space-grotesk), system-ui, sans-serif",
    body:    "var(--font-geist-sans), var(--font-inter), system-ui, sans-serif",
    mono:    "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace",
  },
  fontSize: {
    // Responsive clamp (del skill pack)
    hero:       "clamp(3rem, 8vw, 7.5rem)",
    display:    "clamp(2.5rem, 6vw, 5rem)",
    section:    "clamp(2rem, 4vw, 3.5rem)",
    subsection: "clamp(1.5rem, 2.5vw, 2.25rem)",
    kicker:     "0.75rem",
  },
  lineHeight: {
    hero:       0.95,
    display:    1.0,
    section:    1.05,
    subsection: 1.15,
    body:       1.6,
    tight:      1.1,
  },
  letterSpacing: {
    tighter: "-0.04em",
    tight:   "-0.02em",
    normal:  "0",
    wide:    "0.05em",
    wider:   "0.1em",
    kicker:  "0.18em",
  },
} as const;

// Type exports for IDE autocomplete
export type Colors = typeof colors;
export type Shadows = typeof shadows;
export type Motion = typeof motion;

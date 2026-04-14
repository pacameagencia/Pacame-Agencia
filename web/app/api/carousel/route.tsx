import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/* ═══════════════════════════════════════════════════════════════
   PACAME CAROUSEL ENGINE v2 — Motor de carruseles profesionales
   para Instagram (1080×1080). Nivel agencia premium.

   Slide types: cover, content, tip, stat, quote, cta, list, highlight
   10 paletas visuales. Elementos decorativos. Texto destacado.
   ═══════════════════════════════════════════════════════════════ */

interface SlideInput {
  title: string;
  body?: string;
  type?: "cover" | "content" | "tip" | "stat" | "quote" | "cta" | "list" | "highlight";
  number?: string;
  icon?: string;
  stat?: string;
  statLabel?: string;
  items?: string[];      // for "list" type: bullet points
  highlight?: string;    // word(s) to highlight in title with accent color
}

interface CarouselRequest {
  slides: SlideInput[];
  style?: string;
  colors?: { primary?: string; accent?: string; bg?: string; text?: string };
  brandName?: string;
  handle?: string;
  slideIndex?: number;
}

interface Colors {
  primary: string;
  accent: string;
  bg: string;
  text: string;
  textSub: string;
}

// ─── 10 PALETTES — nivel agencia premium ───────────────
const PALETTES: Record<string, Colors> = {
  dark: {
    primary: "#7C3AED", accent: "#22D3EE",
    bg: "#09090F", text: "#FFFFFF", textSub: "rgba(255,255,255,0.65)",
  },
  midnight: {
    primary: "#6366F1", accent: "#F472B6",
    bg: "#0C0A1D", text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  gradient: {
    primary: "#8B5CF6", accent: "#A3E635",
    bg: "#110C24", text: "#FFFFFF", textSub: "rgba(255,255,255,0.65)",
  },
  clean: {
    primary: "#7C3AED", accent: "#06B6D4",
    bg: "#FAFAFA", text: "#111111", textSub: "#6B7280",
  },
  neon: {
    primary: "#E040FB", accent: "#00E5FF",
    bg: "#0A0A14", text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  earth: {
    primary: "#D97706", accent: "#059669",
    bg: "#1A1714", text: "#FEFCE8", textSub: "rgba(254,252,232,0.6)",
  },
  ocean: {
    primary: "#0EA5E9", accent: "#34D399",
    bg: "#0B1120", text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  coral: {
    primary: "#F43F5E", accent: "#FB923C",
    bg: "#1A0A10", text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  mono: {
    primary: "#FFFFFF", accent: "#A1A1AA",
    bg: "#111111", text: "#FFFFFF", textSub: "rgba(255,255,255,0.5)",
  },
  cream: {
    primary: "#92400E", accent: "#7C3AED",
    bg: "#FEF3C7", text: "#1C1917", textSub: "#78716C",
  },
};

function isLight(bg: string): boolean {
  return bg.startsWith("#F") || bg.startsWith("#E") || bg.startsWith("#D") || bg === "#FAFAFA" || bg === "#FFFFFF";
}

// ─── DECORATIVE ELEMENTS ───────────────────────────────

/** Grid of small dots as background texture */
function renderGridDots(colors: Colors, opacity = "06") {
  const dots = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      dots.push(
        <div key={`${row}-${col}`} style={{
          position: "absolute", display: "flex",
          top: 120 + row * 110, left: 120 + col * 110,
          width: 4, height: 4, borderRadius: "50%",
          background: `${colors.primary}${opacity}`,
        }} />
      );
    }
  }
  return dots;
}

/** Diagonal decorative lines */
function renderCornerAccent(colors: Colors, position: "top-right" | "bottom-left") {
  const isTopRight = position === "top-right";
  return (
    <div style={{
      position: "absolute", display: "flex",
      top: isTopRight ? 40 : undefined,
      bottom: isTopRight ? undefined : 40,
      right: isTopRight ? 40 : undefined,
      left: isTopRight ? undefined : 40,
      width: 80, height: 80,
      borderTop: isTopRight ? `2px solid ${colors.primary}30` : "none",
      borderRight: isTopRight ? `2px solid ${colors.primary}30` : "none",
      borderBottom: isTopRight ? "none" : `2px solid ${colors.primary}30`,
      borderLeft: isTopRight ? "none" : `2px solid ${colors.primary}30`,
      borderRadius: isTopRight ? "0 16px 0 0" : "0 0 0 16px",
    }} />
  );
}

/** Glow orb */
function renderGlow(color: string, x: number, y: number, size = 500, opacity = "10") {
  return (
    <div style={{
      position: "absolute", display: "flex",
      top: y, left: x, width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${color}${opacity}, transparent 70%)`,
    }} />
  );
}

/** Brand badge — small consistent brand marker */
function renderBrandBadge(brandName: string, handle: string, colors: Colors, compact = false) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: compact ? 10 : 14,
    }}>
      <div style={{
        display: "flex", width: compact ? 34 : 42, height: compact ? 34 : 42,
        borderRadius: compact ? 9 : 11,
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        alignItems: "center", justifyContent: "center",
        fontSize: compact ? 15 : 19, fontWeight: 800, color: "#FFFFFF",
      }}>
        {brandName.charAt(0)}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", fontSize: compact ? 15 : 17, fontWeight: 700,
          color: colors.text, letterSpacing: 1.5,
        }}>
          {brandName.toUpperCase()}
        </div>
        {!compact && (
          <div style={{
            display: "flex", fontSize: 13, color: colors.textSub, letterSpacing: 0.5,
          }}>
            {handle}
          </div>
        )}
      </div>
    </div>
  );
}

/** Render title with optional highlighted word(s) */
function renderTitle(
  title: string, highlightWord: string | undefined, colors: Colors,
  fontSize: number, maxWidth: number, center = false
) {
  if (!highlightWord || !title.toLowerCase().includes(highlightWord.toLowerCase())) {
    return (
      <div style={{
        display: "flex", fontSize, fontWeight: 800, color: colors.text,
        lineHeight: 1.1, maxWidth,
        ...(center ? { justifyContent: "center", textAlign: "center" as const } : {}),
      }}>
        {title}
      </div>
    );
  }

  // Split title to highlight the matching word(s)
  const idx = title.toLowerCase().indexOf(highlightWord.toLowerCase());
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + highlightWord.length);
  const after = title.slice(idx + highlightWord.length);

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", fontSize, fontWeight: 800,
      color: colors.text, lineHeight: 1.15, maxWidth,
      ...(center ? { justifyContent: "center", textAlign: "center" as const } : {}),
    }}>
      {before && <span>{before}</span>}
      <span style={{
        color: colors.accent,
        borderBottom: `4px solid ${colors.accent}`,
        paddingBottom: 2,
      }}>
        {match}
      </span>
      {after && <span>{after}</span>}
    </div>
  );
}

// ─── DOTS INDICATOR ────────────────────────────────────
function renderDots(current: number, total: number, colors: Colors) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    dots.push(
      <div key={i} style={{
        display: "flex",
        width: i === current ? 28 : 8, height: 8, borderRadius: 4,
        background: i === current
          ? `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
          : `${colors.text}15`,
      }} />
    );
  }
  return (
    <div style={{
      display: "flex", gap: 5, justifyContent: "center",
      position: "absolute", bottom: 42, left: 0, right: 0,
    }}>
      {dots}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  SLIDE RENDERERS
// ═══════════════════════════════════════════════════════

// ─── COVER ─────────────────────────────────────────────
function renderCover(
  slide: SlideInput, total: number, colors: Colors, brandName: string, handle: string
) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Top gradient bar */}
      <div style={{
        display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 5,
        background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
      }} />

      {/* Background effects */}
      {renderGlow(colors.primary, -200, -180, 600, "14")}
      {renderGlow(colors.accent, 600, 500, 500, "08")}
      {renderGridDots(colors, "04")}
      {renderCornerAccent(colors, "top-right")}

      {/* Brand header */}
      <div style={{ display: "flex", padding: "56px 65px 0" }}>
        {renderBrandBadge(brandName, handle, colors)}
      </div>

      {/* Main content */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 65px",
        position: "relative", zIndex: 10,
      }}>
        {slide.icon && (
          <div style={{
            display: "flex", fontSize: 52, marginBottom: 20,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
          }}>
            {slide.icon}
          </div>
        )}

        {renderTitle(slide.title, slide.highlight, colors, 62, 880)}

        {slide.body && (
          <div style={{
            display: "flex", fontSize: 25, fontWeight: 400,
            color: colors.textSub, lineHeight: 1.5,
            marginTop: 22, maxWidth: 780,
          }}>
            {slide.body}
          </div>
        )}

        {/* Swipe CTA */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginTop: 44,
        }}>
          <div style={{
            display: "flex", width: 44, height: 3, borderRadius: 2,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
          }} />
          <div style={{
            display: "flex", fontSize: 13, fontWeight: 700,
            color: colors.primary, letterSpacing: 3,
          }}>
            DESLIZA
          </div>
          <div style={{ display: "flex", fontSize: 16, color: colors.accent }}>
            →
          </div>
        </div>
      </div>

      {renderDots(0, total, colors)}
    </div>
  );
}

// ─── CONTENT ───────────────────────────────────────────
function renderContent(
  slide: SlideInput, index: number, total: number, colors: Colors, brandName: string, handle: string
) {
  const num = slide.number || String(index).padStart(2, "0");

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {renderGlow(colors.primary, -150, -80, 400, "08")}

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "50px 65px 0",
      }}>
        {renderBrandBadge(brandName, handle, colors, true)}
        <div style={{
          display: "flex", fontSize: 14, fontWeight: 700,
          color: colors.primary, letterSpacing: 1,
        }}>
          {num}/{String(total - 1).padStart(2, "0")}
        </div>
      </div>

      {/* Accent line */}
      <div style={{
        display: "flex", margin: "28px 65px 0",
        width: 48, height: 3, borderRadius: 2,
        background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
      }} />

      {/* Background number watermark */}
      <div style={{
        display: "flex", position: "absolute",
        top: 40, right: 30,
        fontSize: 260, fontWeight: 900,
        color: `${colors.primary}06`,
        lineHeight: 0.85,
      }}>
        {num.replace(/^0/, "")}
      </div>

      {/* Content */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 65px",
        position: "relative", zIndex: 10,
      }}>
        {slide.icon && (
          <div style={{ display: "flex", fontSize: 44, marginBottom: 14 }}>
            {slide.icon}
          </div>
        )}

        {renderTitle(slide.title, slide.highlight, colors, 46, 830)}

        {slide.body && (
          <div style={{
            display: "flex", fontSize: 26, fontWeight: 400,
            color: colors.textSub, lineHeight: 1.5,
            marginTop: 22, maxWidth: 780,
          }}>
            {slide.body}
          </div>
        )}
      </div>

      {renderDots(index, total, colors)}
    </div>
  );
}

// ─── TIP ───────────────────────────────────────────────
function renderTip(
  slide: SlideInput, index: number, total: number, colors: Colors, brandName: string, handle: string
) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Left accent bar */}
      <div style={{
        display: "flex", position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
        background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})`,
      }} />

      {renderGlow(colors.accent, 700, -100, 400, "06")}

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "50px 65px 0 72px",
      }}>
        {renderBrandBadge(brandName, handle, colors, true)}
        <div style={{
          display: "flex", padding: "5px 18px", borderRadius: 20,
          background: `${colors.primary}18`,
          fontSize: 13, fontWeight: 700, color: colors.primary, letterSpacing: 1,
        }}>
          TIP {slide.number || index}
        </div>
      </div>

      {/* Content */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 65px 0 72px",
      }}>
        {slide.icon && (
          <div style={{
            display: "flex", width: 68, height: 68, borderRadius: 18,
            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}15)`,
            border: `1px solid ${colors.primary}25`,
            alignItems: "center", justifyContent: "center",
            fontSize: 32, marginBottom: 22,
          }}>
            {slide.icon}
          </div>
        )}

        {renderTitle(slide.title, slide.highlight, colors, 44, 830)}

        {slide.body && (
          <div style={{
            display: "flex", fontSize: 25, fontWeight: 400,
            color: colors.textSub, lineHeight: 1.5,
            marginTop: 22, maxWidth: 760,
          }}>
            {slide.body}
          </div>
        )}
      </div>

      {renderDots(index, total, colors)}
    </div>
  );
}

// ─── STAT ──────────────────────────────────────────────
function renderStat(
  slide: SlideInput, index: number, total: number, colors: Colors, brandName: string, handle: string
) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {renderGlow(colors.primary, 200, 150, 600, "10")}
      {renderCornerAccent(colors, "bottom-left")}

      {/* Top bar */}
      <div style={{
        display: "flex", padding: "50px 65px 0",
      }}>
        {renderBrandBadge(brandName, handle, colors, true)}
      </div>

      {/* Centered stat */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", alignItems: "center",
        padding: "0 65px",
      }}>
        {/* Big stat number with gradient */}
        <div style={{
          display: "flex", fontSize: 150, fontWeight: 900,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          backgroundClip: "text",
          color: "transparent",
          lineHeight: 1,
          letterSpacing: -4,
        }}>
          {slide.stat || slide.number || "0"}
        </div>

        {slide.statLabel && (
          <div style={{
            display: "flex", fontSize: 16, fontWeight: 600,
            color: colors.textSub, marginTop: 8,
            letterSpacing: 4, textTransform: "uppercase",
          }}>
            {slide.statLabel}
          </div>
        )}

        {/* Gradient divider */}
        <div style={{
          display: "flex", width: 50, height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
          margin: "28px 0",
        }} />

        <div style={{
          display: "flex", fontSize: 38, fontWeight: 700,
          color: colors.text, lineHeight: 1.2, maxWidth: 720,
          justifyContent: "center", textAlign: "center" as const,
        }}>
          {slide.title}
        </div>

        {slide.body && (
          <div style={{
            display: "flex", fontSize: 22, fontWeight: 400,
            color: colors.textSub, lineHeight: 1.5,
            marginTop: 14, maxWidth: 680, justifyContent: "center",
            textAlign: "center" as const,
          }}>
            {slide.body}
          </div>
        )}
      </div>

      {renderDots(index, total, colors)}
    </div>
  );
}

// ─── QUOTE ─────────────────────────────────────────────
function renderQuote(
  slide: SlideInput, index: number, total: number, colors: Colors, brandName: string, handle: string
) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {renderGlow(colors.accent, 600, 200, 400, "06")}

      {/* Top bar */}
      <div style={{
        display: "flex", padding: "50px 65px 0",
      }}>
        {renderBrandBadge(brandName, handle, colors, true)}
      </div>

      {/* Quote */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 75px",
      }}>
        {/* Big stylized quote mark */}
        <div style={{
          display: "flex", fontSize: 140, fontWeight: 900,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          backgroundClip: "text",
          color: "transparent",
          lineHeight: 0.7, marginBottom: 16,
          opacity: 0.5,
        }}>
          {"\u201C"}
        </div>

        <div style={{
          display: "flex", fontSize: 40, fontWeight: 600,
          color: colors.text, lineHeight: 1.35,
          fontStyle: "italic", maxWidth: 850,
        }}>
          {slide.title}
        </div>

        {slide.body && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginTop: 32,
          }}>
            <div style={{
              display: "flex", width: 30, height: 2, borderRadius: 1,
              background: colors.primary,
            }} />
            <div style={{
              display: "flex", fontSize: 20, fontWeight: 600,
              color: colors.textSub,
            }}>
              {slide.body}
            </div>
          </div>
        )}
      </div>

      {renderDots(index, total, colors)}
    </div>
  );
}

// ─── LIST (NEW) — slide con 2-4 puntos con icono ──────
function renderList(
  slide: SlideInput, index: number, total: number, colors: Colors, brandName: string, handle: string
) {
  const items = slide.items || [];

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {renderGlow(colors.primary, -100, 300, 400, "08")}

      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "50px 65px 0",
      }}>
        {renderBrandBadge(brandName, handle, colors, true)}
        <div style={{
          display: "flex", fontSize: 14, fontWeight: 700,
          color: colors.primary, letterSpacing: 1,
        }}>
          {slide.number || `${index}/${total - 1}`}
        </div>
      </div>

      {/* Title */}
      <div style={{
        display: "flex", flexDirection: "column", padding: "36px 65px 0",
      }}>
        {renderTitle(slide.title, slide.highlight, colors, 40, 800)}
      </div>

      {/* Items list */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 65px",
        gap: 20,
      }}>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 18,
            padding: "18px 24px",
            background: `${colors.primary}08`,
            borderRadius: 16,
            borderLeft: `3px solid ${i === 0 ? colors.primary : i === 1 ? colors.accent : `${colors.primary}60`}`,
          }}>
            <div style={{
              display: "flex", fontSize: 20, fontWeight: 800,
              color: colors.primary, minWidth: 28,
              marginTop: 2,
            }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{
              display: "flex", fontSize: 24, fontWeight: 500,
              color: colors.text, lineHeight: 1.4,
            }}>
              {item}
            </div>
          </div>
        ))}
      </div>

      {renderDots(index, total, colors)}
    </div>
  );
}

// ─── HIGHLIGHT (NEW) — frase impactante con fondo ─────
function renderHighlight(
  slide: SlideInput, index: number, total: number, colors: Colors, brandName: string, handle: string
) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Full background gradient glow */}
      {renderGlow(colors.primary, 100, 100, 800, "12")}
      {renderGlow(colors.accent, 500, 400, 600, "08")}
      {renderGridDots(colors, "03")}

      {/* Top bar */}
      <div style={{
        display: "flex", padding: "50px 65px 0",
      }}>
        {renderBrandBadge(brandName, handle, colors, true)}
      </div>

      {/* Centered highlight */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", alignItems: "center",
        padding: "0 55px",
      }}>
        {slide.icon && (
          <div style={{
            display: "flex", fontSize: 48, marginBottom: 24,
          }}>
            {slide.icon}
          </div>
        )}

        {/* Highlight card */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "40px 50px",
          background: `linear-gradient(135deg, ${colors.primary}15, ${colors.accent}10)`,
          border: `1px solid ${colors.primary}20`,
          borderRadius: 24,
          maxWidth: 900,
        }}>
          <div style={{
            display: "flex", fontSize: 44, fontWeight: 800,
            color: colors.text, lineHeight: 1.2,
            textAlign: "center" as const, justifyContent: "center",
          }}>
            {slide.title}
          </div>
        </div>

        {slide.body && (
          <div style={{
            display: "flex", fontSize: 22, fontWeight: 400,
            color: colors.textSub, lineHeight: 1.5,
            marginTop: 24, maxWidth: 700,
            textAlign: "center" as const, justifyContent: "center",
          }}>
            {slide.body}
          </div>
        )}
      </div>

      {renderDots(index, total, colors)}
    </div>
  );
}

// ─── CTA ───────────────────────────────────────────────
function renderCta(
  slide: SlideInput, total: number, colors: Colors, brandName: string, handle: string
) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: colors.bg, position: "relative", overflow: "hidden",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Big glow */}
      {renderGlow(colors.primary, 200, 200, 700, "14")}
      {renderGlow(colors.accent, 500, 400, 500, "08")}

      {/* Centered */}
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", alignItems: "center",
        padding: "0 70px", position: "relative", zIndex: 10,
      }}>
        {/* Brand icon */}
        <div style={{
          display: "flex", width: 76, height: 76, borderRadius: 20,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          alignItems: "center", justifyContent: "center",
          fontSize: 34, fontWeight: 900, color: "#FFFFFF",
          marginBottom: 34,
          boxShadow: `0 12px 40px ${colors.primary}40`,
        }}>
          {brandName.charAt(0)}
        </div>

        {renderTitle(slide.title, slide.highlight, colors, 48, 780, true)}

        {slide.body && (
          <div style={{
            display: "flex", fontSize: 22, fontWeight: 400,
            color: colors.textSub, lineHeight: 1.5,
            marginTop: 18, maxWidth: 680, justifyContent: "center",
            textAlign: "center" as const,
          }}>
            {slide.body}
          </div>
        )}

        {/* CTA button */}
        <div style={{
          display: "flex", marginTop: 36,
          padding: "18px 48px", borderRadius: 50,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          fontSize: 22, fontWeight: 700, color: "#FFFFFF",
          letterSpacing: 0.5,
          boxShadow: `0 8px 30px ${colors.primary}35`,
        }}>
          {slide.number || "Contactar ahora"}
        </div>

        {/* Handle */}
        <div style={{
          display: "flex", fontSize: 18, fontWeight: 600,
          color: colors.textSub, marginTop: 24,
        }}>
          {handle}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        display: "flex", position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
      }} />

      {renderDots(total - 1, total, colors)}
    </div>
  );
}

// ─── SLIDE ROUTER ──────────────────────────────────────
function renderSlide(
  slide: SlideInput, index: number, total: number,
  colors: Colors, brandName: string, handle: string
) {
  const isCover = slide.type === "cover" || (index === 0 && !slide.type);
  const isCta = slide.type === "cta" || (index === total - 1 && !slide.type);

  if (isCover) return renderCover(slide, total, colors, brandName, handle);
  if (isCta) return renderCta(slide, total, colors, brandName, handle);
  if (slide.type === "stat") return renderStat(slide, index, total, colors, brandName, handle);
  if (slide.type === "quote") return renderQuote(slide, index, total, colors, brandName, handle);
  if (slide.type === "tip") return renderTip(slide, index, total, colors, brandName, handle);
  if (slide.type === "list") return renderList(slide, index, total, colors, brandName, handle);
  if (slide.type === "highlight") return renderHighlight(slide, index, total, colors, brandName, handle);
  return renderContent(slide, index, total, colors, brandName, handle);
}

// ─── ROUTE HANDLER ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const data: CarouselRequest = await request.json();
    const {
      slides,
      style = "dark",
      colors: inputColors,
      brandName = "PACAME",
      handle = "@pacameagencia",
      slideIndex,
    } = data;

    if (!slides?.length) {
      return NextResponse.json({ error: "No slides provided" }, { status: 400 });
    }
    if (slides.length > 15) {
      return NextResponse.json({ error: "Max 15 slides" }, { status: 400 });
    }

    const palette = PALETTES[style] || PALETTES.dark;
    const colors: Colors = {
      primary: inputColors?.primary || palette.primary,
      accent: inputColors?.accent || palette.accent,
      bg: inputColors?.bg || palette.bg,
      text: inputColors?.text || palette.text,
      textSub: palette.textSub,
    };

    if (slideIndex !== undefined && slideIndex >= 0 && slideIndex < slides.length) {
      const element = renderSlide(slides[slideIndex], slideIndex, slides.length, colors, brandName, handle);
      return new ImageResponse(element, { width: 1080, height: 1080 });
    }

    return NextResponse.json({
      totalSlides: slides.length, style, colors, brandName, handle,
      message: `Carousel listo: ${slides.length} slides. Pide cada uno con slideIndex 0-${slides.length - 1}.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 },
    );
  }
}

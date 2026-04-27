import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/* ═══════════════════════════════════════════════════════════════
   PACAME CAROUSEL ENGINE v3 — Carruseles profesionales 1080×1080

   REGLA SATORI: NO function components como JSX (<Comp/>).
   Solo divs. Llamar helpers como funciones: fn(args).
   No textAlign, no textTransform, no fontStyle.
   ═══════════════════════════════════════════════════════════════ */

interface SlideInput {
  title: string;
  body?: string;
  type?: "cover" | "content" | "tip" | "stat" | "quote" | "cta" | "list" | "highlight" | "comparison";
  number?: string;
  icon?: string;
  stat?: string;
  statLabel?: string;
  items?: string[];
  highlight?: string;
  badge?: string;
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
  bgGrad: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textSub: string;
}

const PALETTES: Record<string, Colors> = {
  dark: {
    primary: "#8B5CF6", accent: "#06D6A0",
    bg: "#09090F", bgGrad: "linear-gradient(160deg, #09090F 0%, #170d2e 45%, #0d0d1a 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.08)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  midnight: {
    primary: "#818CF8", accent: "#F472B6",
    bg: "#0C0A1D", bgGrad: "linear-gradient(160deg, #0C0A1D 0%, #1e1145 45%, #0e0825 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.08)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.55)",
  },
  gradient: {
    primary: "#A78BFA", accent: "#34D399",
    bg: "#110C24", bgGrad: "linear-gradient(160deg, #110C24 0%, #1e1050 45%, #0f0a1e 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.08)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  clean: {
    primary: "#B54E30", accent: "#0EA5E9",
    bg: "#F8FAFC", bgGrad: "linear-gradient(160deg, #F8FAFC 0%, #EEF2FF 45%, #F8FAFC 100%)",
    cardBg: "rgba(0,0,0,0.03)", cardBorder: "rgba(0,0,0,0.06)",
    text: "#0F172A", textSub: "#64748B",
  },
  neon: {
    primary: "#E040FB", accent: "#00E5FF",
    bg: "#0A0A14", bgGrad: "linear-gradient(160deg, #0A0A14 0%, #1a0a28 45%, #0a1018 100%)",
    cardBg: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.10)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  earth: {
    primary: "#F59E0B", accent: "#10B981",
    bg: "#1A1714", bgGrad: "linear-gradient(160deg, #1A1714 0%, #2a2010 45%, #1a1714 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.07)",
    text: "#FEF3C7", textSub: "rgba(254,252,232,0.55)",
  },
  ocean: {
    primary: "#38BDF8", accent: "#34D399",
    bg: "#0B1120", bgGrad: "linear-gradient(160deg, #0B1120 0%, #0d1e38 45%, #0b1120 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.08)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  coral: {
    primary: "#FB7185", accent: "#FBBF24",
    bg: "#1A0A10", bgGrad: "linear-gradient(160deg, #1A0A10 0%, #2a1020 45%, #1a0a10 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.08)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.6)",
  },
  mono: {
    primary: "#E4E4E7", accent: "#A1A1AA",
    bg: "#111111", bgGrad: "linear-gradient(160deg, #111111 0%, #1a1a1a 45%, #111111 100%)",
    cardBg: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.06)",
    text: "#FFFFFF", textSub: "rgba(255,255,255,0.45)",
  },
  cream: {
    primary: "#B45309", accent: "#B54E30",
    bg: "#FFFBEB", bgGrad: "linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 45%, #FFFBEB 100%)",
    cardBg: "rgba(0,0,0,0.04)", cardBorder: "rgba(0,0,0,0.07)",
    text: "#1C1917", textSub: "#78716C",
  },
};

// ═══════════════════════════════════════════════════════════
//  INLINE HELPERS (called as functions, NOT JSX components)
// ═══════════════════════════════════════════════════════════

function glow(color: string, x: number, y: number, size = 500, opacity = 0.12) {
  return (
    <div style={{
      position: "absolute", display: "flex",
      top: y, left: x, width: size, height: size,
      borderRadius: 9999,
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
      opacity,
    }} />
  );
}

function topStripe(c: Colors) {
  return (
    <div style={{
      display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 5,
      background: `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
    }} />
  );
}

function gradLine(c: Colors, w = 52, h = 4) {
  return (
    <div style={{
      display: "flex", width: w, height: h, borderRadius: h,
      background: `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
    }} />
  );
}

function badge(brandName: string, handle: string, c: Colors, compact = false) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14 }}>
      <div style={{
        display: "flex", width: compact ? 36 : 44, height: compact ? 36 : 44,
        borderRadius: compact ? 10 : 12,
        background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
        alignItems: "center", justifyContent: "center",
        fontSize: compact ? 16 : 20, fontWeight: 800, color: "#FFFFFF",
      }}>
        {brandName.charAt(0)}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", fontSize: compact ? 15 : 17, fontWeight: 700,
          color: c.text, letterSpacing: 2,
        }}>
          {brandName.toUpperCase()}
        </div>
        {!compact && (
          <div style={{ display: "flex", fontSize: 13, color: c.textSub, letterSpacing: 0.5 }}>
            {handle}
          </div>
        )}
      </div>
    </div>
  );
}

function titleText(
  title: string, highlightWord: string | undefined, c: Colors,
  fontSize: number, maxWidth: number, center = false
) {
  if (!highlightWord || !title.toLowerCase().includes(highlightWord.toLowerCase())) {
    return (
      <div style={{
        display: "flex", fontSize, fontWeight: 800, color: c.text,
        lineHeight: 1.08, maxWidth, letterSpacing: -0.5,
        ...(center ? { justifyContent: "center" } : {}),
      }}>
        {title}
      </div>
    );
  }

  const idx = title.toLowerCase().indexOf(highlightWord.toLowerCase());
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + highlightWord.length);
  const after = title.slice(idx + highlightWord.length);

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", fontSize, fontWeight: 800,
      color: c.text, lineHeight: 1.15, maxWidth, letterSpacing: -0.5,
      ...(center ? { justifyContent: "center" } : {}),
    }}>
      {before ? <div style={{ display: "flex" }}>{before}</div> : null}
      <div style={{
        display: "flex", color: c.accent,
        borderBottom: `5px solid ${c.accent}`, paddingBottom: 3,
      }}>
        {match}
      </div>
      {after ? <div style={{ display: "flex" }}>{after}</div> : null}
    </div>
  );
}

function progressBar(current: number, total: number, c: Colors) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div style={{
      display: "flex", position: "absolute", bottom: 36, left: 60, right: 60,
      flexDirection: "column", gap: 8,
    }}>
      <div style={{
        display: "flex", width: "100%", height: 4, borderRadius: 4,
        background: "rgba(255,255,255,0.08)",
      }}>
        <div style={{
          display: "flex", width: `${pct}%`, height: 4, borderRadius: 4,
          background: `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 12, fontWeight: 600, color: c.textSub, letterSpacing: 1,
      }}>
        <div style={{ display: "flex" }}>{current + 1}/{total}</div>
        <div style={{ display: "flex" }}>@pacameagencia</div>
      </div>
    </div>
  );
}

function card(c: Colors, children: React.ReactNode, padding = "36px 44px", radius = 24) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100%",
      background: c.cardBg, border: `1px solid ${c.cardBorder}`,
      borderRadius: radius, padding,
    }}>
      {children}
    </div>
  );
}

function numBadge(num: string, c: Colors, size = 52) {
  return (
    <div style={{
      display: "flex", width: size, height: size,
      borderRadius: Math.round(size * 0.3),
      background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
      alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.42), fontWeight: 800, color: "#FFFFFF",
      flexShrink: 0,
    }}>
      {num}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SLIDE RENDERERS
// ═══════════════════════════════════════════════════════════

function renderCover(s: SlideInput, total: number, c: Colors, brand: string, handle: string) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {topStripe(c)}
      {glow(c.primary, -180, -120, 650, 0.18)}
      {glow(c.accent, 650, 550, 500, 0.10)}

      <div style={{ display: "flex", padding: "52px 60px 0", position: "relative", zIndex: 10 }}>
        {badge(brand, handle, c)}
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 60px",
        position: "relative", zIndex: 10,
      }}>
        {s.icon && <div style={{ display: "flex", fontSize: 60, marginBottom: 20 }}>{s.icon}</div>}

        {s.badge && (
          <div style={{
            display: "flex", padding: "6px 18px", borderRadius: 20,
            background: `${c.primary}20`, border: `1px solid ${c.primary}30`,
            fontSize: 14, fontWeight: 700, color: c.primary,
            letterSpacing: 2, marginBottom: 20, alignSelf: "flex-start",
          }}>
            {(s.badge || "").toUpperCase()}
          </div>
        )}

        {titleText(s.title, s.highlight, c, 74, 900)}

        {s.body && (
          <div style={{
            display: "flex", fontSize: 26, fontWeight: 400,
            color: c.textSub, lineHeight: 1.5, marginTop: 24, maxWidth: 800,
          }}>
            {s.body}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 48 }}>
          {gradLine(c, 48, 3)}
          <div style={{
            display: "flex", fontSize: 14, fontWeight: 700,
            color: c.primary, letterSpacing: 4,
          }}>
            DESLIZA
          </div>
          <div style={{
            display: "flex", fontSize: 22, fontWeight: 700,
            background: `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
            backgroundClip: "text", color: "transparent",
          }}>
            {"\u2192"}
          </div>
        </div>
      </div>

      {progressBar(0, total, c)}
    </div>
  );
}

function renderContent(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  const num = s.number || String(idx).padStart(2, "0");
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {glow(c.primary, -120, -60, 400, 0.10)}

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "48px 60px 0",
      }}>
        {badge(brand, handle, c, true)}
        <div style={{
          display: "flex", padding: "5px 16px", borderRadius: 20,
          background: `${c.primary}15`, border: `1px solid ${c.primary}20`,
          fontSize: 13, fontWeight: 700, color: c.primary, letterSpacing: 1,
        }}>
          {num}/{total - 1}
        </div>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 60px", position: "relative", zIndex: 10,
      }}>
        {/* Watermark number */}
        <div style={{
          display: "flex", position: "absolute", top: -20, right: -10,
          fontSize: 280, fontWeight: 900, lineHeight: 0.85,
          background: `linear-gradient(135deg, ${c.primary}08, ${c.accent}04)`,
          backgroundClip: "text", color: "transparent",
        }}>
          {num.replace(/^0/, "")}
        </div>

        {card(c, (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
            {numBadge(num.replace(/^0/, ""), c)}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {s.icon && <div style={{ display: "flex", fontSize: 38, marginBottom: 12 }}>{s.icon}</div>}
              {titleText(s.title, s.highlight, c, 44, 750)}
              {s.body && (
                <div style={{
                  display: "flex", fontSize: 24, fontWeight: 400,
                  color: c.textSub, lineHeight: 1.6, marginTop: 18, maxWidth: 700,
                }}>
                  {s.body}
                </div>
              )}
            </div>
          </div>
        ), "44px 48px")}
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderTip(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", position: "absolute", left: 0, top: 0, bottom: 0, width: 7,
        background: `linear-gradient(180deg, ${c.primary}, ${c.accent})`,
      }} />
      {glow(c.accent, 700, -80, 400, 0.08)}

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "48px 60px 0 68px",
      }}>
        {badge(brand, handle, c, true)}
        <div style={{
          display: "flex", padding: "6px 20px", borderRadius: 20,
          background: `linear-gradient(135deg, ${c.primary}20, ${c.accent}15)`,
          border: `1px solid ${c.primary}25`,
          fontSize: 13, fontWeight: 700, color: c.primary, letterSpacing: 2,
        }}>
          {"TIP " + (s.number || idx)}
        </div>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 60px 0 68px",
      }}>
        {card(c, (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {s.icon && (
              <div style={{
                display: "flex", width: 72, height: 72, borderRadius: 20,
                background: `linear-gradient(135deg, ${c.primary}22, ${c.accent}18)`,
                border: `1px solid ${c.primary}30`,
                alignItems: "center", justifyContent: "center",
                fontSize: 34, marginBottom: 22,
              }}>
                {s.icon}
              </div>
            )}
            {titleText(s.title, s.highlight, c, 44, 840)}
            {s.body && (
              <div style={{
                display: "flex", fontSize: 24, fontWeight: 400,
                color: c.textSub, lineHeight: 1.6, marginTop: 20, maxWidth: 780,
              }}>
                {s.body}
              </div>
            )}
          </div>
        ), "40px 44px")}
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderStat(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {glow(c.primary, 200, 150, 700, 0.16)}
      {glow(c.accent, 400, 350, 500, 0.08)}

      <div style={{ display: "flex", padding: "48px 60px 0" }}>
        {badge(brand, handle, c, true)}
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", alignItems: "center", padding: "0 60px",
      }}>
        {card(c, (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              display: "flex", fontSize: 160, fontWeight: 900,
              background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
              backgroundClip: "text", color: "transparent",
              lineHeight: 1, letterSpacing: -6,
            }}>
              {s.stat || s.number || "0"}
            </div>
            {s.statLabel && (
              <div style={{
                display: "flex", fontSize: 15, fontWeight: 600,
                color: c.textSub, marginTop: 8, letterSpacing: 5,
              }}>
                {(s.statLabel || "").toUpperCase()}
              </div>
            )}
            <div style={{ display: "flex", marginTop: 28, marginBottom: 28 }}>
              {gradLine(c, 56, 4)}
            </div>
            <div style={{
              display: "flex", fontSize: 36, fontWeight: 700,
              color: c.text, lineHeight: 1.2, maxWidth: 700, justifyContent: "center",
            }}>
              {s.title}
            </div>
            {s.body && (
              <div style={{
                display: "flex", fontSize: 22, fontWeight: 400,
                color: c.textSub, lineHeight: 1.5, marginTop: 14, maxWidth: 650, justifyContent: "center",
              }}>
                {s.body}
              </div>
            )}
          </div>
        ), "48px 64px", 28)}
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderQuote(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {glow(c.accent, 600, 200, 400, 0.08)}

      <div style={{ display: "flex", padding: "48px 60px 0" }}>
        {badge(brand, handle, c, true)}
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 60px",
      }}>
        {card(c, (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              display: "flex", fontSize: 120, fontWeight: 900,
              background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
              backgroundClip: "text", color: "transparent",
              lineHeight: 0.65, marginBottom: 18, opacity: 0.6,
            }}>
              {"\u201C"}
            </div>
            <div style={{
              display: "flex", fontSize: 38, fontWeight: 600,
              color: c.text, lineHeight: 1.35, maxWidth: 860,
            }}>
              {s.title}
            </div>
            {s.body && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32 }}>
                {gradLine(c, 32, 3)}
                <div style={{
                  display: "flex", fontSize: 20, fontWeight: 600,
                  color: c.textSub, letterSpacing: 0.5,
                }}>
                  {s.body}
                </div>
              </div>
            )}
          </div>
        ), "48px 52px")}
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderList(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  const items = s.items || [];
  const listItems = [];
  for (let i = 0; i < Math.min(items.length, 5); i++) {
    listItems.push(
      <div style={{
        display: "flex", width: "100%",
        background: c.cardBg, border: `1px solid ${c.cardBorder}`,
        borderRadius: 16, padding: "20px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {numBadge(String(i + 1), c, 42)}
          <div style={{
            display: "flex", fontSize: 23, fontWeight: 500,
            color: c.text, lineHeight: 1.4, flex: 1,
          }}>
            {items[i]}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {glow(c.primary, -80, 300, 400, 0.10)}

      <div style={{ display: "flex", padding: "48px 60px 0" }}>
        {badge(brand, handle, c, true)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", padding: "32px 60px 0" }}>
        {s.icon && <div style={{ display: "flex", fontSize: 36, marginBottom: 10 }}>{s.icon}</div>}
        {titleText(s.title, s.highlight, c, 40, 820)}
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", padding: "0 60px", gap: 16,
      }}>
        {listItems}
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderHighlight(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {glow(c.primary, 100, 100, 900, 0.16)}
      {glow(c.accent, 500, 400, 600, 0.10)}

      <div style={{ display: "flex", padding: "48px 60px 0" }}>
        {badge(brand, handle, c, true)}
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", alignItems: "center", padding: "0 50px",
      }}>
        {s.icon && <div style={{ display: "flex", fontSize: 52, marginBottom: 28 }}>{s.icon}</div>}

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          width: "100%", padding: "48px 56px",
          background: `${c.primary}12`, border: `1px solid ${c.primary}25`,
          borderRadius: 28,
        }}>
          {titleText(s.title, s.highlight, c, 44, 850, true)}
        </div>

        {s.body && (
          <div style={{
            display: "flex", fontSize: 22, fontWeight: 400,
            color: c.textSub, lineHeight: 1.5, marginTop: 28, maxWidth: 720, justifyContent: "center",
          }}>
            {s.body}
          </div>
        )}
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderComparison(s: SlideInput, idx: number, total: number, c: Colors, brand: string, handle: string) {
  const items = s.items || [];
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  const leftItems = [];
  for (let i = 0; i < left.length; i++) {
    leftItems.push(
      <div style={{
        display: "flex", padding: "18px 22px", borderRadius: 14,
        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.10)",
      }}>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: c.textSub, lineHeight: 1.4 }}>
          {left[i]}
        </div>
      </div>
    );
  }

  const rightItems = [];
  for (let i = 0; i < right.length; i++) {
    rightItems.push(
      <div style={{
        display: "flex", padding: "18px 22px", borderRadius: 14,
        background: `${c.accent}08`, border: `1px solid ${c.accent}12`,
      }}>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: c.text, lineHeight: 1.4 }}>
          {right[i]}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", padding: "48px 60px 0" }}>
        {badge(brand, handle, c, true)}
      </div>

      <div style={{ display: "flex", padding: "28px 60px 0", justifyContent: "center" }}>
        {titleText(s.title, s.highlight, c, 36, 900, true)}
      </div>

      <div style={{
        display: "flex", flex: 1, padding: "24px 60px",
        gap: 20, alignItems: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          <div style={{
            display: "flex", padding: "8px 20px", borderRadius: 16,
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 14, fontWeight: 700, color: "#EF4444", letterSpacing: 2,
            justifyContent: "center",
          }}>
            {"\u2717 SIN ESTO"}
          </div>
          {leftItems}
        </div>

        <div style={{
          display: "flex", width: 52, height: 52, borderRadius: 26,
          background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
          alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 900, color: "#FFFFFF", flexShrink: 0,
        }}>
          VS
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          <div style={{
            display: "flex", padding: "8px 20px", borderRadius: 16,
            background: `${c.accent}20`, border: `1px solid ${c.accent}30`,
            fontSize: 14, fontWeight: 700, color: c.accent, letterSpacing: 2,
            justifyContent: "center",
          }}>
            {"\u2713 CON PACAME"}
          </div>
          {rightItems}
        </div>
      </div>

      {progressBar(idx, total, c)}
    </div>
  );
}

function renderCta(s: SlideInput, total: number, c: Colors, brand: string, handle: string) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: c.bgGrad, position: "relative", overflow: "hidden",
    }}>
      {glow(c.primary, 200, 200, 700, 0.18)}
      {glow(c.accent, 500, 400, 500, 0.10)}

      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", alignItems: "center",
        padding: "0 60px", position: "relative", zIndex: 10,
      }}>
        <div style={{
          display: "flex", width: 84, height: 84, borderRadius: 22,
          background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
          alignItems: "center", justifyContent: "center",
          fontSize: 38, fontWeight: 900, color: "#FFFFFF", marginBottom: 36,
        }}>
          {brand.charAt(0)}
        </div>

        {card(c, (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {titleText(s.title, s.highlight, c, 46, 780, true)}
            {s.body && (
              <div style={{
                display: "flex", fontSize: 22, fontWeight: 400,
                color: c.textSub, lineHeight: 1.5, marginTop: 16, maxWidth: 680, justifyContent: "center",
              }}>
                {s.body}
              </div>
            )}
            <div style={{
              display: "flex", marginTop: 32, padding: "20px 56px", borderRadius: 50,
              background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
              fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: 0.5,
            }}>
              {s.number || "Contactar ahora"}
            </div>
          </div>
        ), "40px 52px", 28)}

        <div style={{
          display: "flex", fontSize: 18, fontWeight: 600,
          color: c.textSub, marginTop: 28,
        }}>
          {handle}
        </div>
      </div>

      <div style={{
        display: "flex", position: "absolute", bottom: 0, left: 0, right: 0, height: 5,
        background: `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
      }} />

      {progressBar(total - 1, total, c)}
    </div>
  );
}

// ─── ROUTER ────────────────────────────────────────────

function renderSlide(
  slide: SlideInput, index: number, total: number,
  colors: Colors, brandName: string, handle: string
) {
  const t = slide.type;
  const isCover = t === "cover" || (index === 0 && !t);
  const isCta = t === "cta" || (index === total - 1 && !t);

  if (isCover) return renderCover(slide, total, colors, brandName, handle);
  if (isCta) return renderCta(slide, total, colors, brandName, handle);
  if (t === "stat") return renderStat(slide, index, total, colors, brandName, handle);
  if (t === "quote") return renderQuote(slide, index, total, colors, brandName, handle);
  if (t === "tip") return renderTip(slide, index, total, colors, brandName, handle);
  if (t === "list") return renderList(slide, index, total, colors, brandName, handle);
  if (t === "highlight") return renderHighlight(slide, index, total, colors, brandName, handle);
  if (t === "comparison") return renderComparison(slide, index, total, colors, brandName, handle);
  return renderContent(slide, index, total, colors, brandName, handle);
}

// ─── ROUTE HANDLER ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const data: CarouselRequest = await request.json();
    const {
      slides, style = "dark", colors: inputColors,
      brandName = "PACAME", handle = "@pacameagencia", slideIndex,
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
      bgGrad: palette.bgGrad,
      cardBg: palette.cardBg,
      cardBorder: palette.cardBorder,
      text: inputColors?.text || palette.text,
      textSub: palette.textSub,
    };

    if (inputColors?.bg) {
      colors.bgGrad = `linear-gradient(160deg, ${inputColors.bg} 0%, ${inputColors.bg} 100%)`;
    }

    if (slideIndex !== undefined && slideIndex >= 0 && slideIndex < slides.length) {
      try {
        const element = renderSlide(slides[slideIndex], slideIndex, slides.length, colors, brandName, handle);
        const imgRes = new ImageResponse(element, { width: 1080, height: 1080 });
        const buf = await imgRes.arrayBuffer();
        if (buf.byteLength === 0) {
          return NextResponse.json({ error: "Empty image from Satori" }, { status: 500 });
        }
        return new Response(buf, {
          headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" },
        });
      } catch (renderErr) {
        return NextResponse.json({
          error: `Render: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      totalSlides: slides.length, style,
      colors: { primary: colors.primary, accent: colors.accent },
      brandName, handle,
      message: `Carousel ready: ${slides.length} slides. Use slideIndex 0-${slides.length - 1}.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 },
    );
  }
}
